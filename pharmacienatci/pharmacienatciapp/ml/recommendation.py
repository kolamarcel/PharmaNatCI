"""
Moteur de Recommandation IA - PharmaNatCI
==========================================
Calcule les alertes de rupture de stock, recommande des commandes
et des transferts intra-régionaux.

Niveaux d'analyse :
  - Niveau Pharmacie : prédiction fine, alerte rupture, transfert
  - Niveau Région    : planification, commande groupée, optimisation
"""
import logging
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum, Q

from ..models import Mouvement, Etablissement, Region, Medicament, Prevision

logger = logging.getLogger(__name__)

# Facteur de sécurité : stock cible = prévision * (1 + SAFETY_FACTOR)
SAFETY_FACTOR = 0.2
# Seuil de sur-stock pour proposer un transfert depuis un autre établissement
SURPLUS_FACTOR = 1.5


def compute_current_stock(etablissement_id: str, medicament_id: str) -> Decimal:
    """Calcule le stock actuel via la somme algébrique des mouvements."""
    agg = Mouvement.objects.filter(
        etablissement_id=etablissement_id,
        medicament_id=medicament_id
    ).aggregate(
        entrees=Sum('quantite', filter=Q(typeMouvement='ENTREE')),
        sorties=Sum('quantite', filter=Q(typeMouvement='SORTIE'))
    )
    entrees = agg['entrees'] or Decimal('0')
    sorties = agg['sorties'] or Decimal('0')
    return max(Decimal('0'), entrees - sorties)


def compute_days_until_stockout(stock: Decimal, demande_par_jour: Decimal) -> int | None:
    """Retourne le nombre de jours avant rupture estimé, ou None si pas de risque."""
    if demande_par_jour <= 0:
        return None
    jours = int(stock / demande_par_jour)
    return jours


def run_recommendations(etablissement_previsions: list[dict]) -> None:
    """
    Pour chaque prévision Établissement+Médicament déjà calculée, enrichit
    la table Prevision avec les alertes de rupture et recommandations.

    etablissement_previsions : liste de dicts produits par pipeline.run_forecast()
    """
    logger.info("📊 Démarrage du moteur de recommandation...")

    # On ne traite que les prévisions au niveau établissement
    previsions = Prevision.objects.filter(niveau='etablissement').select_related(
        'medicament', 'etablissement', 'etablissement__region'
    )

    updates = []

    for prev in previsions:
        etab = prev.etablissement
        med = prev.medicament
        if not etab or not med:
            continue

        # 1. Stock actuel
        stock = compute_current_stock(etab.id, med.id)
        prev.stockActuelCalcule = stock

        # 2. Demande journalière estimée (sur 30j)
        demande_30j = float(prev.demandePrevue)
        demande_par_jour = Decimal(str(demande_30j / 30)) if demande_30j > 0 else Decimal('0')

        # 3. Détection de rupture
        jours_avant_rupture = compute_days_until_stockout(stock, demande_par_jour)
        if jours_avant_rupture is not None and jours_avant_rupture <= 30:
            prev.risqueRupture = True
            prev.dateRuptureEstimee = date.today() + timedelta(days=jours_avant_rupture)
        else:
            prev.risqueRupture = False
            prev.dateRuptureEstimee = None

        # 4. Recommandation de transfert intra-régional
        prev.recommandationTransfert = False
        prev.etablissementSourceTransfert = None

        if prev.risqueRupture and etab.region:
            # Chercher un établissement de la même région avec du surplus
            seuil_surplus = Decimal(str(demande_30j)) * Decimal(str(SURPLUS_FACTOR))
            etabs_meme_region = Etablissement.objects.filter(
                region=etab.region, actif=True
            ).exclude(id=etab.id)

            for autre_etab in etabs_meme_region:
                stock_autre = compute_current_stock(autre_etab.id, med.id)
                if stock_autre >= seuil_surplus:
                    prev.recommandationTransfert = True
                    prev.etablissementSourceTransfert = autre_etab
                    logger.info(
                        f"→ Transfert recommandé : {med.dci} de {autre_etab.nom} vers {etab.nom}"
                    )
                    break

        # 5. Recommandation de commande si pas de transfert possible
        prev.recommandationCommande = False
        prev.quantiteCommandeRecommandee = Decimal('0')

        if prev.risqueRupture and not prev.recommandationTransfert:
            stock_cible = Decimal(str(demande_30j)) * Decimal(str(1 + SAFETY_FACTOR))
            quantite_a_commander = max(Decimal('0'), stock_cible - stock)
            prev.recommandationCommande = True
            prev.quantiteCommandeRecommandee = round(quantite_a_commander, 2)
            logger.info(
                f"→ Commande recommandée : {med.dci} pour {etab.nom} : {quantite_a_commander} unités"
            )

        updates.append(prev)

    # Sauvegarde groupée
    if updates:
        Prevision.objects.bulk_update(updates, [
            'stockActuelCalcule', 'risqueRupture', 'dateRuptureEstimee',
            'recommandationCommande', 'quantiteCommandeRecommandee',
            'recommandationTransfert', 'etablissementSourceTransfert',
        ])
        logger.info(f"✅ {len(updates)} prévisions enrichies avec succès.")


def run_regional_aggregation() -> None:
    """
    Agrège les prévisions établissement par région pour créer une vue
    globale de planification régionale.
    """
    logger.info("🌍 Agrégation régionale des prévisions...")

    regions = Region.objects.all()
    next_month_str = (date.today() + timedelta(days=30)).strftime('%Y-%m')

    for region in regions:
        # Récupère tous les médicaments prévus dans la région
        medicaments_ids = Prevision.objects.filter(
            niveau='etablissement',
            etablissement__region=region,
            mois=next_month_str
        ).values_list('medicament_id', flat=True).distinct()

        for med_id in medicaments_ids:
            agg = Prevision.objects.filter(
                niveau='etablissement',
                etablissement__region=region,
                medicament_id=med_id,
                mois=next_month_str
            ).aggregate(
                total_demande=Sum('demandePrevue'),
                total_stock=Sum('stockActuelCalcule'),
            )

            total_demande = agg['total_demande'] or Decimal('0')
            total_stock = agg['total_stock'] or Decimal('0')
            risque_region = total_stock < total_demande

            med = Medicament.objects.get(pk=med_id)
            prev_id = f"PREV-REG-{region.id}-{med_id}-{next_month_str}"
            confiance_moy = Prevision.objects.filter(
                niveau='etablissement',
                etablissement__region=region,
                medicament_id=med_id,
                mois=next_month_str
            ).aggregate(m=Sum('confiance'))['m'] or Decimal('0')
            nb = Prevision.objects.filter(
                niveau='etablissement',
                etablissement__region=region,
                medicament_id=med_id,
                mois=next_month_str
            ).count()
            confiance = confiance_moy / nb if nb > 0 else Decimal('0')

            Prevision.objects.update_or_create(
                id=prev_id,
                defaults={
                    'medicament': med,
                    'region': region,
                    'niveau': 'region',
                    'mois': next_month_str,
                    'demandePrevue': total_demande,
                    'stockActuelCalcule': total_stock,
                    'risqueRupture': risque_region,
                    'confiance': min(Decimal('98'), confiance),
                    'recommandationCommande': risque_region,
                    'quantiteCommandeRecommandee': max(Decimal('0'), total_demande - total_stock),
                    'facteurs': ['Agrégation régionale', 'IA multi-établissements'],
                }
            )
            if risque_region:
                logger.info(
                    f"⚠ Risque régional : {med.dci} dans la région {region.nom} "
                    f"(Stock={total_stock}, Demande={total_demande})"
                )

    logger.info("✅ Agrégation régionale terminée.")
