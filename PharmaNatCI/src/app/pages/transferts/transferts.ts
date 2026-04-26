import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';

@Component({
  selector: 'app-transferts',
  standalone: true,
  imports: [ CommonModule,MatIconModule, FormsModule,],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transferts.html'
})
export class TransfertsComposant {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);
  
  transfertSelectionne = signal<any | null>(null);
  lignesTransfertSelectionne = computed(() => {
    const t = this.transfertSelectionne();
    if (!t) return [];
    // Un transfert est mono-médicament dans cette version
    const med = this.serviceDonnees.medicaments().find(m => m.id === t.medicamentId);
    return [{
      id: 'L1',
      medicamentNom: t.medicament,
      forme: med?.forme || '',
      dosage: med?.dosage || '',
      quantite: t.quantite
    }];
  });

  Math = Math;

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

  afficherModale = signal(false);
  afficherModaleReponse = signal(false);
  messageErreur = signal<string | null>(null);
  estEnChargement = signal(false);
  nouveauTransfert: { destination: string, lignes: { medicament: string, quantite: number }[], urgence: string } = { destination: '', lignes: [{ medicament: '', quantite: 100 }], urgence: 'Normal' };
  reponseTransfert: { demandeId: string, quantite: number } = { demandeId: '', quantite: 0 };

  ajouterLigneTransfert() {
    this.nouveauTransfert.lignes.push({ medicament: '', quantite: 100 });
  }

  supprimerLigneTransfert(index: number) {
    this.nouveauTransfert.lignes.splice(index, 1);
  }

  vueActuelle = signal<'demandes' | 'transferts'>('demandes');
  pageActuelle = signal(1);
  elementsParPage = 4;
  requeteRecherche = signal('');
  statutSelectionne = signal('');
  sousVueTransfert = signal<'actifs' | 'historique'>('actifs');
  
  rechercheMedicament = signal('');
  medicamentsFiltres = computed(() => {
    const terme = this.rechercheMedicament().toLowerCase();
    return this.serviceDonnees.medicaments().filter(m => 
      m.nomCommercial.toLowerCase().includes(terme) || 
      m.dci.toLowerCase().includes(terme)
    );
  });

  demandesFiltrees = computed(() => {
    const etabId = this.etablissementActuelId();
    const monEtab = this.serviceDonnees.etablissements().find(e => e.id === etabId);

    return this.serviceFiltrage.demandesTransfertFiltrees()
      .filter(d => {
        const raw = this.serviceDonnees.demandesTransfert().find(x => x.id === d.id);
        if (!raw) return false;

        // Mes propres demandes
        if (raw.etablissementDemandeurId === etabId) return true;

        // Ciblé spécifiquement pour moi
        if (raw.etablissementCibleId === etabId) return true;

        // Demandes globales (TOUS) : application des règles métier
        if (raw.etablissementCibleId === 'TOUS') {
          const demandeur = this.serviceDonnees.etablissements().find(e => e.id === raw.etablissementDemandeurId);
          if (!monEtab || !demandeur) return false;

          // Règle PHARMACIE -> de la même région uniquement
          if (demandeur.type === 'PHARMACIE') {
            return monEtab.type === 'PHARMACIE' && monEtab.regionId === demandeur.regionId;
          }
          // Règle REGION -> entre entrepôts uniquement
          if (demandeur.type === 'REGION') {
            return monEtab.type === 'REGION';
          }
        }
        return false;
      })
      .filter(demande => {
        const correspondRecherche = demande.id.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              demande.medicamentNom.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              demande.demandeurNom.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              demande.cibleNom.toLowerCase().includes(this.requeteRecherche().toLowerCase());
        const correspondStatut = this.statutSelectionne() === '' || demande.statut === this.statutSelectionne();
        return correspondRecherche && correspondStatut;
      }).sort((a, b) => b.id.localeCompare(a.id));
  });

  demandesPaginees = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.demandesFiltrees().slice(debut, debut + this.elementsParPage);
  });

  transfertsFiltres = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceFiltrage.transfertsFiltres()
      .filter(t => {
        const raw = this.serviceDonnees.transferts().find(x => x.id === t.id);
        const estLie = raw?.etablissementOrigineId === etabId || raw?.etablissementDestinationId === etabId;
        if (!estLie) return false;

        // Filtre par sous-vue (Actifs vs Historique)
        if (this.sousVueTransfert() === 'actifs') {
          return t.statut === 'En attente' || t.statut === 'Expédié';
        } else {
          return t.statut === 'Livré' || t.statut === 'Annulé' || t.statut === 'Refusé';
        }
      })
      .filter(transfert => {
        const correspondRecherche = transfert.reference.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              transfert.medicament.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              transfert.origine.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                              transfert.destination.toLowerCase().includes(this.requeteRecherche().toLowerCase());
        const correspondStatut = this.statutSelectionne() === '' || transfert.statut === this.statutSelectionne();
        return correspondRecherche && correspondStatut;
      }).sort((a, b) => b.id.localeCompare(a.id));
  });

  transfertsPagines = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.transfertsFiltres().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => {
    const total = this.vueActuelle() === 'demandes' ? this.demandesFiltrees().length : this.transfertsFiltres().length;
    return Math.ceil(total / this.elementsParPage);
  });

  destinationsPossibles = computed(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user || !user.etablissementId) return [];
    const monEtab = this.serviceDonnees.etablissements().find(e => e.id === user.etablissementId);
    if (!monEtab) return [];
    
    if (monEtab.type === 'PHARMACIE') {
      return this.serviceDonnees.etablissements().filter(e => 
        e.id !== monEtab.id && 
        e.type === 'PHARMACIE' && 
        e.regionId === monEtab.regionId
      );
    } else if (monEtab.type === 'REGION') {
      return this.serviceDonnees.etablissements().filter(e => 
        e.id !== monEtab.id && 
        e.type === 'REGION'
      );
    }
    return [];
  });

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
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.nouveauTransfert.lignes = [{ medicament: this.serviceDonnees.medicaments()[0]?.id || '', quantite: 100 }];
      this.nouveauTransfert.destination = 'TOUS';
      this.messageErreur.set(null);
      this.estEnChargement.set(false);
      this.afficherModale.set(true);
    }, 400);
  }

  fermerModale() {
    this.afficherModale.set(false);
    this.messageErreur.set(null);
  }

  soumettreTransfert(evenement: Event) {
    evenement.preventDefault();
    this.messageErreur.set(null);
    try {
      this.estEnChargement.set(true);
      // Simuler léger délai (premium feel)
      setTimeout(() => {
        let count = 0;
        for (const ligne of this.nouveauTransfert.lignes) {
          if (!ligne.medicament || ligne.quantite <= 0) continue;
          this.serviceDonnees.ajouterDemandeTransfert({
            demandeur: this.serviceAuthentification.utilisateurActuel()?.etablissementId || 'Ma Structure',
            cible: this.nouveauTransfert.destination,
            medicament: ligne.medicament,
            quantite: ligne.quantite,
            urgence: this.nouveauTransfert.urgence
          });
          count++;
        }
        this.estEnChargement.set(false);
        this.fermerModale();
        this.serviceDonnees.ajouterNotification(
          'Demande de transfert créée',
          `Votre demande pour ${count} médicament(s) a été enregistrée.`,
          this.serviceAuthentification.utilisateurActuel()?.role,
          this.serviceAuthentification.utilisateurActuel()?.id
        );
        this.serviceUi.afficherToast('Demande de transfert envoyée.', 'succes');
      }, 600);
    } catch (error) {
      this.estEnChargement.set(false);
      if (error instanceof Error) {
        this.messageErreur.set(error.message);
        this.serviceUi.afficherToast(error.message, 'erreur');
      } else {
        this.messageErreur.set('Une erreur est survenue lors de la création de la demande.');
        this.serviceUi.afficherToast('Erreur création de demande.', 'erreur');
      }
    }
  }

  ouvrirModaleReponse(demandeId: string, quantiteRestante: number) {
    this.reponseTransfert = { demandeId, quantite: quantiteRestante };
    this.messageErreur.set(null);
    this.afficherModaleReponse.set(true);
  }

  fermerModaleReponse() {
    this.afficherModaleReponse.set(false);
    this.messageErreur.set(null);
  }

  soumettreReponse(evenement: Event) {
    evenement.preventDefault();
    this.messageErreur.set(null);
    try {
      const user = this.serviceAuthentification.utilisateurActuel();
      if (!user || !user.etablissementId) throw new Error('Utilisateur non connecté ou sans établissement.');
      
      // Validation du stock avant de répondre
      const demande = this.demandesFiltrees().find(d => d.id === this.reponseTransfert.demandeId);
      if (demande) {
        const aAssezDeStock = this.serviceDonnees.verifierStock(user.etablissementId, demande.medicamentId, this.reponseTransfert.quantite);
        if (!aAssezDeStock) {
          throw new Error(`Stock insuffisant (${demande.medicamentNom}) pour répondre à cette demande.`);
        }
      }

      this.estEnChargement.set(true);
      this.serviceDonnees.repondreDemandeTransfert(
        this.reponseTransfert.demandeId,
        user.etablissementId,
        this.reponseTransfert.quantite
      );
      this.estEnChargement.set(false);
      this.fermerModaleReponse();
      this.serviceDonnees.ajouterNotification(
        'Réponse au transfert',
        `Vous avez répondu à la demande avec ${this.reponseTransfert.quantite} unités.`,
        user.role,
        user.id
      );
      this.serviceUi.afficherToast('Réponse à la demande envoyée.', 'succes');
    } catch (error) {
      if (error instanceof Error) {
        this.messageErreur.set(error.message);
        this.serviceUi.afficherToast(error.message, 'erreur');
      } else {
        this.messageErreur.set('Une erreur est survenue lors de la réponse.');
        this.serviceUi.afficherToast('Erreur lors de la réponse.', 'erreur');
      }
    }
  }

  mettreAJourStatut(id: string, statut: string) {
    try {
      // Validation du stock avant expédition
      if (statut === 'Expédié') {
        const tr = this.transfertsFiltres().find(t => t.id === id);
        if (tr) {
          const aAssezDeStock = this.serviceDonnees.verifierStock(tr.etablissementOrigineId, tr.medicamentId, tr.quantite);
          if (!aAssezDeStock) {
            throw new Error(`Stock insuffisant pour expédier ce transfert (${tr.medicament}).`);
          }
        }
      }
      
      this.estEnChargement.set(true);
      this.serviceDonnees.mettreAJourStatutTransfert(id, statut).subscribe({
        next: () => {
          this.serviceDonnees.loadTransferts();
          this.serviceDonnees.loadMouvements();
          this.serviceDonnees.loadLots();
          this.estEnChargement.set(false);
          this.serviceUi.afficherToast(`Transfert ${statut.toLowerCase()} avec succès.`, 'succes');
        },
        error: () => {
          this.estEnChargement.set(false);
          this.serviceUi.afficherToast('Erreur de mise à jour.', 'erreur');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message); // Legacy alert maintained, toast added
        this.serviceUi.afficherToast(error.message, 'erreur');
      }
    }
  }

  voirFacture(transfert: any) {
    this.transfertSelectionne.set(transfert);
  }

  fermerFacture() {
    this.transfertSelectionne.set(null);
  }
}
