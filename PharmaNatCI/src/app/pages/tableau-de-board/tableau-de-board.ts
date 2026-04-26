import { ChangeDetectionStrategy, Component, inject, computed, signal, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router } from '@angular/router';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { StockEtablissementView } from '../../interface/donnees';

@Component({
  selector: 'app-tableau-de-bord',
  standalone: true,
  imports: [MatIconModule, RouterLink, CommonModule, BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tableau-de-board.html'
})
export class TableauDeBordComposant {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);
  router = inject(Router);

  afficherModaleRapport = signal(false);
  enTelechargement = signal(false);
  estPleinEcran = signal(false);
  estEnChargement = signal(false);

  telechargerRapport() {
    this.afficherModaleRapport.set(true);
  }

  fermerModaleRapport() {
    this.afficherModaleRapport.set(false);
    this.enTelechargement.set(false);
  }

  simulerTelechargement(format: string) {
    this.enTelechargement.set(true);
    setTimeout(() => {
      this.enTelechargement.set(false);
      this.fermerModaleRapport();
      this.serviceUi.afficherToast(`Rapport ${format} généré et téléchargé.`, 'succes');
    }, 1500);
  }

  basculerPleinEcran() {
    this.estPleinEcran.update((v: boolean) => !v);
  }

  pageActuelle = signal(1);
  elementsParPage = 5;

  etablissementActuelId = signal<string | null>(null);
  
  constructor() {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (user) {
      this.etablissementActuelId.set(user.etablissementId);
    }

    // Effet pour recharger les statistiques quand l'établissement change
    effect(() => {
      const id = this.etablissementActuelId();
      if (id) {
        this.serviceDonnees.loadDashboardStats(id);
      }
    }, { allowSignalWrites: true });
  }

  etablissementActuel = computed(() => {
    const id = this.etablissementActuelId();
    return this.serviceDonnees.etablissements().find(e => e.id === id) || null;
  });

  cheminNavigation = computed(() => {
    const chemin = [];
    let courant = this.etablissementActuel();
    const userEtabId = this.serviceAuthentification.utilisateurActuel()?.etablissementId;
    
    while (courant) {
      chemin.unshift(courant);
      // Ne s'arrêter à l'établissement de l'utilisateur que s'il n'est pas Admin ou National
      if (courant.id === userEtabId && !this.serviceAuthentification.estAdmin() && !this.serviceAuthentification.estNational()) break;
      const parentId = courant.parentId;
      courant = parentId ? this.serviceDonnees.etablissements().find(e => e.id === parentId) || null : null;
    }
    return chemin;
  });

  sousEtablissements = computed(() => {
    const id = this.etablissementActuelId();
    // Si aucun ID n'est sélectionné (Admin Central), on affiche les établissements racines (National)
    if (!id) return this.serviceDonnees.etablissements().filter(e => !e.parentId);
    return this.serviceDonnees.etablissements().filter(e => e.parentId === id);
  });

  allerAEtablissement(id: string | null) {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user || !id) return;

    // Security check: only allow navigation within user's scope, unless admin
    const allowedIds = this.serviceDonnees.getSousEtablissements(user.etablissementId || '');
    if (this.serviceAuthentification.estAdmin() || this.serviceAuthentification.estNational() || allowedIds.includes(id)) {
      this.etablissementActuelId.set(id);
    }
  }

  // KPIs simplifiés (Source: Backend)
  stats = computed(() => this.serviceDonnees.statsDashboard());
  
  nombreRuptures = computed(() => this.stats()?.nombreRuptures || 0);
  nombreStockBas = computed(() => this.stats()?.nombreStockBas || 0);
  tauxDisponibilite = computed(() => this.stats()?.tauxDisponibilite || 0);
  tendanceDispo = computed(() => this.stats()?.tendanceDispo || 0);
  nombreTransfertsEnAttente = computed(() => this.stats()?.nombreTransfertsEnAttente || 0);

  alertesStock = computed(() => this.stats()?.alertesStock || []);
  mouvementsRecents = computed(() => this.stats()?.mouvementsRecents || []);

  genererCommande(alerte: any) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.router.navigate(['/commandes'], { queryParams: { medicamentId: alerte.id } });
      this.estEnChargement.set(false);
    }, 400); // Court délai pour montrer la réactivité
  }

  // Chart Data
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {},
      y: {
        min: 0
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };
  public barChartType: ChartType = 'bar';

  public barChartData = computed<ChartData<'bar'>>(() => {
    const alertes = this.alertesStock() || [];
    return {
      labels: alertes.map((s: any) => s.nom),
      datasets: [
        { data: alertes.map((s: any) => s.stock), label: 'Stock Actuel', backgroundColor: '#3b82f6' },
        { data: alertes.map((s: any) => s.cmm), label: 'CMM', backgroundColor: '#9ca3af' }
      ]
    };
  });

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };
  public pieChartType: ChartType = 'pie';

  public pieChartData = computed<ChartData<'pie', number[], string | string[]>>(() => {
    const s = this.stats()?.transfertsStats;
    const data = s ? [s.enAttente, s.valides, s.rejetes] : [0, 0, 0];
    return {
      labels: ['En attente', 'Validé/Livré', 'Rejeté'],
      datasets: [ {
        data: data,
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
      } ]
    };
  });
}
