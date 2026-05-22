import os
import logging
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error

from ..models import Mouvement, Medicament, Etablissement, Prevision, Saison

# Configuration du logger
logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'pharma_demand_rf.joblib')
ENCODERS_PATH = os.path.join(MODEL_DIR, 'encoders.joblib')

def ensure_model_dir():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

# ============================================================
# 1. EXTRACTION DES DONNÉES (VIA DJANGO ORM)
# ============================================================

def extract_data_from_orm() -> pd.DataFrame:
    """Extrait les données de mouvement SORTIE via l'ORM Django."""
    logger.info("Extraction des données depuis la base de données...")
    
    mouvements = Mouvement.objects.filter(typeMouvement='SORTIE').values(
        'dateMouvement',
        'quantite',
        'medicament__nomCommercial',
        'etablissement__id',
        'etablissement__region__nom'
    )
    
    if not mouvements.exists():
        logger.warning("Aucun mouvement de sortie trouvé.")
        return pd.DataFrame()

    df = pd.DataFrame(list(mouvements))
    df = df.rename(columns={
        'dateMouvement': 'date_mouvement',
        'medicament__nomCommercial': 'medicament',
        'etablissement__id': 'etablissement',
        'etablissement__region__nom': 'region'
    })
    
    logger.info(f"Extraction réussie : {len(df)} lignes récupérées.")
    return df

# ============================================================
# 2. PREPROCESSING
# ============================================================

def clean_and_fill_dates(df: pd.DataFrame):
    """Nettoie les données et comble les trous temporels."""
    if df.empty:
        return df, None, None

    df['date'] = pd.to_datetime(df['date_mouvement']).dt.normalize()
    
    le_med = LabelEncoder()
    le_reg = LabelEncoder()
    df['medicament_encoded'] = le_med.fit_transform(df['medicament'].astype(str))
    df['region_encoded'] = le_reg.fit_transform(df['region'].astype(str))
    
    group_cols = ['date', 'medicament_encoded', 'etablissement', 'region_encoded']
    df_grouped = df.groupby(group_cols)['quantite'].sum().reset_index()
    
    df_grouped = df_grouped.set_index('date')
    
    # Comblement des jours sans ventes
    df_continuous = (
        df_grouped.groupby(['medicament_encoded', 'etablissement', 'region_encoded'])['quantite']
        .resample('D').sum()
        .fillna(0)
        .reset_index()
    )
    
    df_continuous['mois_num'] = df_continuous['date'].dt.month
    
    active_saisons = Saison.objects.filter(actif=True).select_related('region')
    region_months_map = {}
    for s in active_saisons:
        reg_name = s.region.nom if s.region else "INCONNUE"
        if reg_name not in region_months_map:
            region_months_map[reg_name] = []
        if isinstance(s.mois, list):
            region_months_map[reg_name].extend(s.mois)
            
    def get_saison(row):
        reg_encoded = int(row['region_encoded'])
        reg_name = le_reg.inverse_transform([reg_encoded])[0]
        mois_num = row['mois_num']
        active_months = region_months_map.get(reg_name, [])
        return 1 if mois_num in active_months else 0

    df_continuous['saison_encoded'] = df_continuous.apply(get_saison, axis=1)
    
    return df_continuous, le_med, le_reg

def build_features(df: pd.DataFrame):
    """Génère les lags et moyennes mobiles."""
    if df.empty:
        return df
        
    df = df.sort_values(by=['medicament_encoded', 'etablissement', 'date'])
    grouped = df.groupby(['medicament_encoded', 'etablissement'])
    
    df['lag_1'] = grouped['quantite'].shift(1)
    df['lag_7'] = grouped['quantite'].shift(7)
    df['moyenne_7j'] = grouped['quantite'].transform(lambda x: x.rolling(7, min_periods=1).mean())
    
    df = df.dropna().reset_index(drop=True)
    return df

# ============================================================
# 3. ENTRAÎNEMENT
# ============================================================

def train_pipeline():
    """Exécute le pipeline complet d'entraînement."""
    ensure_model_dir()
    
    raw_data = extract_data_from_orm()
    if raw_data.empty:
        logger.warning("Données insuffisantes pour l'entraînement (DataFrame vide).")
        return False
        
    clean_data, le_med, le_reg = clean_and_fill_dates(raw_data)
    featured_data = build_features(clean_data)
    
    if featured_data.empty or len(featured_data) < 10:
        logger.warning("Données insuffisantes pour un entraînement Random Forest fiable (< 10 lignes).")
        # On sauvegarde quand même les encodeurs pour le mode fallback
        joblib.dump({'le_med': le_med, 'le_reg': le_reg}, ENCODERS_PATH)
        return True # On retourne True pour ne pas bloquer le reste du processus

    features = ['medicament_encoded', 'etablissement', 'region_encoded', 'saison_encoded', 'lag_1', 'lag_7', 'moyenne_7j']
    X = featured_data[features]
    y = featured_data['quantite']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X, y)
    
    # Sauvegarde
    joblib.dump(model, MODEL_PATH)
    joblib.dump({'le_med': le_med, 'le_reg': le_reg}, ENCODERS_PATH)
    
    logger.info(f"Modèle réentraîné et sauvegardé.")
    return True

# ============================================================
# 4. GÉNÉRATION DE PRÉVISIONS (NIVEAU ÉTABLISSEMENT)
# ============================================================

def run_forecast():
    """
    Génère les prévisions pour les 30 prochains jours par Établissement+Médicament,
    puis déclenche le moteur de recommandation (ruptures, transferts, commandes).
    """
    from .recommendation import run_recommendations, run_regional_aggregation

    model = None
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    
    if not os.path.exists(ENCODERS_PATH):
        logger.error("Encodeurs introuvables. Impossible de générer des prévisions.")
        return False
        
    encoders = joblib.load(ENCODERS_PATH)
    le_med = encoders['le_med']
    le_reg = encoders['le_reg']

    # Récupère les données pour les lags initiaux
    raw_data = extract_data_from_orm()
    if raw_data.empty:
        logger.warning("Aucune donnée de sortie pour générer des prévisions.")
        return True

    clean_data, _, _ = clean_and_fill_dates(raw_data)

    # Précalcul carte saisons par région
    active_saisons = Saison.objects.filter(actif=True).select_related('region')
    region_months_map = {}
    for s in active_saisons:
        reg_name = s.region.nom if s.region else "INCONNUE"
        region_months_map.setdefault(reg_name, [])
        if isinstance(s.mois, list):
            region_months_map[reg_name].extend(s.mois)

    # Itère sur chaque combinaison Établissement + Médicament
    entities = clean_data[['medicament_encoded', 'etablissement', 'region_encoded']].drop_duplicates()

    today = datetime.now().date()
    next_month_str = (today + timedelta(days=30)).strftime('%Y-%m')
    saved_count = 0

    for _, entity in entities.iterrows():
        med_idx = entity['medicament_encoded']
        etab_id = entity['etablissement']
        reg_idx = entity['region_encoded']

        history = clean_data[
            (clean_data['medicament_encoded'] == med_idx) &
            (clean_data['etablissement'] == etab_id)
        ].sort_values('date')

        if len(history) < 1:
            continue

        current_quantities = history['quantite'].tolist()
        total_forecast_next_30 = 0

        current_reg_name = le_reg.inverse_transform([int(reg_idx)])[0]
        active_months_for_region = region_months_map.get(current_reg_name, [])

        # Mode FALLBACK si pas assez de données (moins de 7 jours) ou pas de modèle
        if len(history) < 7 or model is None:
            # Moyenne simple des sorties observées
            moyenne_quotidienne = np.mean(current_quantities)
            total_forecast_next_30 = moyenne_quotidienne * 30
            confiance = 65.0 # Confiance faible pour le mode fallback
        else:
            # Prédiction récursive IA – 30 jours
            try:
                for i in range(1, 31):
                    target_date = today + timedelta(days=i)
                    saison = 1 if target_date.month in active_months_for_region else 0
                    lag_1 = current_quantities[-1]
                    lag_7 = current_quantities[-7]
                    moy_7 = np.mean(current_quantities[-7:])

                    X_pred = pd.DataFrame([{
                        'medicament_encoded': med_idx,
                        'etablissement': etab_id,
                        'region_encoded': reg_idx,
                        'saison_encoded': saison,
                        'lag_1': lag_1,
                        'lag_7': lag_7,
                        'moyenne_7j': moy_7
                    }])
                    pred = max(0, model.predict(X_pred)[0])
                    total_forecast_next_30 += pred
                    current_quantities.append(pred)

                std_hist = np.std(history['quantite'])
                confiance = max(60, min(98, 100 - (std_hist / (np.mean(history['quantite']) + 1) * 20)))
            except Exception as e:
                logger.error(f"Erreur prédiction IA pour {etab_id}: {e}")
                total_forecast_next_30 = np.mean(current_quantities) * 30
                confiance = 60.0

        # Résolution des entités Django
        med_nom = le_med.inverse_transform([int(med_idx)])[0]
        med = Medicament.objects.filter(nomCommercial=med_nom).first()
        etab = Etablissement.objects.filter(pk=etab_id).first()
        if not med or not etab:
            continue

        # Enregistrement au niveau établissement
        prev_id = f"PREV-{etab_id}-{med.id}-{next_month_str}"
        Prevision.objects.update_or_create(
            id=prev_id,
            defaults={
                'medicament': med,
                'etablissement': etab,
                'region': etab.region,
                'niveau': 'etablissement',
                'mois': next_month_str,
                'demandePrevue': round(total_forecast_next_30, 2),
                'confiance': round(confiance, 1),
                'facteurs': ['Historique saisonnier', 'Moyenne mobile' if model is None else 'Modèle Random Forest', f'Région: {current_reg_name}'],
            }
        )
        saved_count += 1

    logger.info(f"✅ {saved_count} prévisions établissement générées pour {next_month_str}.")

    if saved_count > 0:
        # Phase Recommandations : rupture, transferts, commandes
        run_recommendations([])
        # Phase Agrégation régionale
        run_regional_aggregation()

    return True
