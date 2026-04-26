import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';
import { StockEtablissementView } from '../../interface/donnees';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [ FormsModule, CommonModule,MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stocks.html'
})
export class StocksComposant {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);
  routeur = inject(Router);

  Math = Math;

  afficherModale = signal(false);
  afficherModaleDetails = signal(false);
  messageErreur = signal<string | null>(null);
  estEnChargement = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elementSelectionne = signal<any | null>(null);
  ajustement: { idMedicament: string, nouveauStock: number, lot: string, motif: string } = { idMedicament: 'm1', nouveauStock: 0, lot: '', motif: '' };

  pageActuelle = signal(1);
  elementsParPage = 5;
  requeteRecherche = signal('');
  categorieSelectionnee = signal('');
  statutSelectionne = signal('');

  etablissementActuelId = signal<string | null>(null);
  
  constructor() {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (user) {
      this.etablissementActuelId.set(user.etablissementId);
    }
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
      this.pageActuelle.set(1);
    }
  }

  inventaire = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceDonnees.stocksParEtablissementView()
      .filter(s => s.etablissementId === etabId)
      .map(med => {
        const joursCouverture = med.cmm > 0 ? Math.round((med.stock / med.cmm) * 30) : 0;
        let statut = 'Normal';
        if (joursCouverture === 0 || med.stock === 0) statut = 'Rupture';
        else if (joursCouverture < 30) statut = 'Stock Bas';
        
        return { ...med, joursCouverture, statut };
      });
  });

  inventaireFiltre = computed(() => {
    return this.inventaire().filter(item => {
      const correspondRecherche = item.nom.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                            item.forme.toLowerCase().includes(this.requeteRecherche().toLowerCase());
      const correspondCategorie = this.categorieSelectionnee() === '' || item.categorie === this.categorieSelectionnee();
      const correspondStatut = this.statutSelectionne() === '' || item.statut === this.statutSelectionne();
      return correspondRecherche && correspondCategorie && correspondStatut;
    }).sort((a, b) => a.nom.localeCompare(b.nom));
  });

  inventairePagine = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.inventaireFiltre().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => Math.ceil(this.inventaireFiltre().length / this.elementsParPage));

  pagePrecedente() {
    if (this.pageActuelle() > 1) {
      this.pageActuelle.update(p => p - 1);
    }
  }

  pageSuivante() {
    if (this.pageActuelle() < this.totalPages()) {
      this.pageActuelle.update(p => p + 1);
    }
  }

  ouvrirModale() {
    const premierMed = this.inventaire()[0];
    if (premierMed) {
      this.ajustement = { idMedicament: premierMed.medicamentId, nouveauStock: premierMed.stock, lot: '', motif: 'Inventaire' };
      this.messageErreur.set(null);
      this.afficherModale.set(true);
    }
  }

  fermerModale() {
    this.afficherModale.set(false);
    this.messageErreur.set(null);
  }

  voirDetails(item: StockEtablissementView) {
    this.elementSelectionne.set(item);
    this.afficherModaleDetails.set(true);
  }

  fermerModaleDetails() {
    this.afficherModaleDetails.set(false);
    this.elementSelectionne.set(null);
  }

  demanderTransfert() {
    this.routeur.navigate(['/transferts']);
  }

  genererCommande(item: StockEtablissementView) {
    this.routeur.navigate(['/commandes'], { queryParams: { medicamentId: item.medicamentId } });
  }

  soumettreInventaire(evenement: Event) {
    evenement.preventDefault();
    this.messageErreur.set(null);
    const med = this.inventaire().find(m => m.medicamentId === this.ajustement.idMedicament);
    if (!med) return;

    const difference = this.ajustement.nouveauStock - med.stock;
    if (difference === 0) {
      this.fermerModale();
      return;
    }

    const direction = difference > 0 ? 'entree' : 'sortie';
    const nomAuteur = this.serviceAuthentification.utilisateurActuel()?.nom || 'Inconnu';
    const role = this.serviceAuthentification.utilisateurActuel()?.role;
    const statut = (role !== 'agent_caisse') ? 'valide' : 'en_attente';
    this.estEnChargement.set(true);
    // Simuler un léger délai pour que l'utilisateur voie l'action (premium)
    setTimeout(() => {
      try {
        this.serviceDonnees.ajouterMouvement({
          direction: direction,
          type: 'Ajustement Inventaire',
          idMedicament: med.medicamentId,
          nomMedicament: med.nom,
          lot: this.ajustement.lot,
          quantite: Math.abs(difference),
          auteur: nomAuteur,
          statut: statut,
          etablissementId: this.etablissementActuelId() || 'e1'
        });
        this.serviceUi.afficherToast('Inventaire soumis avec succès.', 'succes');
        this.estEnChargement.set(false);
        this.fermerModale();
      } catch (error) {
        this.estEnChargement.set(false);
        if (error instanceof Error) {
          this.messageErreur.set(error.message);
          this.serviceUi.afficherToast(error.message, 'erreur');
        } else {
          this.messageErreur.set('Erreur lors de l\'ajustement du stock.');
          this.serviceUi.afficherToast('Erreur lors de l\'ajustement du stock.', 'erreur');
        }
      }
    }, 600);
  }
}
