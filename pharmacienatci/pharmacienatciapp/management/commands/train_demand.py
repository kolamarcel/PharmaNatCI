from django.core.management.base import BaseCommand
from pharmacienatciapp.ml.pipeline import train_pipeline, run_forecast
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Entraîne le modèle de prédiction de la demande et génère les prévisions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Démarrage du pipeline IA...'))
        
        # 1. Entraînement
        success_train = train_pipeline()
        if success_train:
            self.stdout.write(self.style.SUCCESS('Modèle entraîné avec succès.'))
            
            # 2. Prévision
            success_forecast = run_forecast()
            if success_forecast:
                self.stdout.write(self.style.SUCCESS('Prévisions générées et enregistrées.'))
            else:
                self.stdout.write(self.style.ERROR('Échec de la génération des prévisions.'))
        else:
            self.stdout.write(self.style.ERROR("Échec de l'entraînement (Données suffisantes ?)."))
