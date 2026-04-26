import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ServiceUi } from '../../services/service-ui';

@Component({
  selector: 'app-mouvements',
  standalone: true,
  imports: [ FormsModule, CommonModule,MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mouvements.html'
})
export class Mouvements {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);

  Math = Math;

  ongletActif = signal<'tous' | 'en_attente'>('tous');
  afficherModale = signal(false);
  afficherModaleDetails = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elementSelectionne = signal<any | null>(null);
  directionModale = signal<'entree' | 'sortie'>('entree');
  messageErreur = signal<string | null>(null);
  estEnChargement = signal(false);

  lignesMouvement = signal<{ idMedicament: string, quantite: number, numeroLot: string }[]>([]);
  typeMouvementModale = signal<string>('');
  rechercheMedicament = signal('');

  medicamentsFiltres = computed(() => {
    const terme = this.rechercheMedicament().toLowerCase();
    return this.serviceDonnees.medicaments().filter(m => 
      m.nomCommercial.toLowerCase().includes(terme) || 
      m.dci.toLowerCase().includes(terme)
    );
  });

  pageActuelle = signal(1);
  elementsParPage = 5;
  requeteRecherche = signal('');
  typeSelectionne = signal('');
  dateSelectionnee = signal('');

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

  mouvementsFiltres = computed(() => {
    const etabId = this.etablissementActuelId();
    let movs = this.serviceDonnees.mouvementsView().filter(m => m.etablissementId === etabId);
    
    if (this.ongletActif() === 'en_attente') {
      movs = movs.filter(m => m.statut === 'en_attente');
    }
    
    return movs.filter(m => {
      const correspondRecherche = m.nomMedicament.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                            m.lot.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
                            m.auteur.toLowerCase().includes(this.requeteRecherche().toLowerCase());
      const correspondType = this.typeSelectionne() === '' || m.type === this.typeSelectionne();
      const correspondDate = this.dateSelectionnee() === '' || m.date.startsWith(this.dateSelectionnee());
      
      return correspondRecherche && correspondType && correspondDate;
    }).sort((a, b) => b.id.localeCompare(a.id));
  });

  mouvementsPagines = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.mouvementsFiltres().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => Math.ceil(this.mouvementsFiltres().length / this.elementsParPage));

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

  nombreEnAttente = computed(() => this.serviceFiltrage.mouvementsFiltres().filter(m => m.statut === 'en_attente').length);

  peutValider = computed(() => {
    return this.serviceAuthentification.aPermission('valider_mouvement');
  });

  ouvrirModale(direction: 'entree' | 'sortie') {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.estEnChargement.set(false);
      this.directionModale.set(direction);
      this.typeMouvementModale.set(direction === 'entree' ? 'Réception PSP' : 'Ordonnance');
      this.lignesMouvement.set([{ idMedicament: this.serviceDonnees.medicaments()[0]?.id || 'm1', quantite: 1, numeroLot: '' }]);
      this.messageErreur.set(null);
      this.afficherModale.set(true);
    }, 400);
  }

  ajouterLigne() {
    this.lignesMouvement.update(l => [...l, { idMedicament: this.serviceDonnees.medicaments()[0]?.id || '', quantite: 1, numeroLot: '' }]);
  }

  getLotsPourMedicament(medId: string) {
    const etabId = this.etablissementActuelId();
    if (!medId || !etabId) return [];

    return this.serviceDonnees.lots()
      .filter(l => String(l.medicamentId) === String(medId))
      .map(lot => {
        const entrees = this.serviceDonnees.mouvements()
          .filter(m => String(m.etablissementId) === String(etabId) && String(m.lotId) === String(lot.id) && m.typeMouvement === 'ENTREE')
          .reduce((sum, m) => sum + Number(m.quantite), 0);
        const sorties = this.serviceDonnees.mouvements()
          .filter(m => String(m.etablissementId) === String(etabId) && String(m.lotId) === String(lot.id) && (m.typeMouvement === 'SORTIE' || m.typeMouvement === 'DESTRUCTION'))
          .reduce((sum, m) => sum + Number(m.quantite), 0);
        
        return {
          ...lot,
          stockAcutel: entrees - sorties
        };
      });
  }

  supprimerLigne(index: number) {
    if (this.lignesMouvement().length > 1) {
      this.lignesMouvement.update(l => l.filter((_, i) => i !== index));
    }
  }

  fermerModale() {
    this.afficherModale.set(false);
    this.messageErreur.set(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  voirDetails(item: any) {
    this.elementSelectionne.set(item);
    this.afficherModaleDetails.set(true);
  }

  fermerModaleDetails() {
    this.afficherModaleDetails.set(false);
    this.elementSelectionne.set(null);
  }

  soumettreMouvement(evenement: Event) {
    evenement.preventDefault();
    this.messageErreur.set(null);

    const role = this.serviceAuthentification.utilisateurActuel()?.role;
    const nomAuteur = this.serviceAuthentification.utilisateurActuel()?.nom || 'Inconnu';
    const statut = (role !== 'agent_caisse') ? 'valide' : 'en_attente';
    const etablissementId = this.etablissementActuelId() || 'e1';

    const reference = 'REF-' + Date.now();
    const auteurId = this.serviceAuthentification.utilisateurActuel()?.id;
    
    // Mapping du type de mouvement vers les codes backend
    let typeMouvement = 'ENTREE';
    const typeLabel = this.typeMouvementModale();
    if (['Réception PSP', 'Transfert Reçu', 'Retour Fournisseur', 'ENTREE'].includes(typeLabel)) {
      typeMouvement = 'ENTREE';
    } else if (['Ordonnance', 'Service Interne', 'SORTIE'].includes(typeLabel)) {
      typeMouvement = 'SORTIE';
    } else if (['Destruction', 'Péremption'].includes(typeLabel)) {
      typeMouvement = 'DESTRUCTION';
    } else if (typeLabel === 'Ajustement') {
      typeMouvement = 'AJUSTEMENT';
    }

    const mouvementsAAjouter: any[] = [];
    
    const observablesLots = this.lignesMouvement().map((ligne, index) => {
      const nomNumLot = ligne.numeroLot.trim();
      if (!nomNumLot) return of(null);

      const lotExistant = this.serviceDonnees.lots().find(l => 
        l.numeroLot.toLowerCase() === nomNumLot.toLowerCase() && 
        String(l.medicamentId) === String(ligne.idMedicament)
      );

      if (lotExistant) {
        return of({ index, lotId: lotExistant.id, nouveau: false });
      } else {
        if (typeMouvement === 'SORTIE' || typeMouvement === 'DESTRUCTION') {
          return of({ index, error: `Le lot "${nomNumLot}" n'existe pas en stock.` });
        }

        // Récupération d'un fournisseur valide (obligatoire pour le modèle Lot)
        const validFournisseurId = this.serviceDonnees.fournisseurs()[0]?.id || 
                                   this.serviceDonnees.lots()[0]?.fournisseurId;

        if (!validFournisseurId) {
          return of({ index, error: `Impossible de créer le lot "${nomNumLot}" : aucun fournisseur n'est enregistré dans le système.` });
        }

        const nouveauLot = {
          id: 'LOT-M-' + Date.now() + '-' + index,
          medicamentId: ligne.idMedicament,
          numeroLot: nomNumLot,
          fournisseurId: validFournisseurId,
          dateFabrication: new Date().toISOString().split('T')[0],
          datePeremption: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
          statut: 'actif'
        };

        this.estEnChargement.set(true);
        return this.serviceDonnees.ajouterLot(nouveauLot).pipe(
          map(created => ({ index, lotId: created.id, nouveau: true, numeroLot: nomNumLot })),
          catchError(() => {
            this.estEnChargement.set(false);
            return of({ index, error: "Erreur lors de la création du lot." });
          })
        );
      }
  });

  forkJoin(observablesLots).subscribe((results: any[]) => {
    // Note: If no observables (lignes is empty), forkJoin might not emit. 
    // But validation usually handles empty lines before.
    if (!results || results.length === 0) {
      this.estEnChargement.set(false);
      return;
    }
      const erreurs = results.filter(r => r && r.error);
      if (erreurs.length > 0) {
        this.messageErreur.set(erreurs[0].error);
        return;
      }

      const mouvementsAAjouter = results.map((res, i) => {
        if (!res) return null;
        const resp = res as { index: number, lotId: string, nouveau: boolean, numeroLot?: string };
        const ligne = this.lignesMouvement()[resp.index];
        return {
          id: `MOV-${Date.now()}-${i}`,
          etablissementId: etablissementId,
          medicamentId: ligne.idMedicament,
          lotId: resp.lotId,
          typeMouvement: typeMouvement,
          quantite: ligne.quantite,
          reference: reference,
          auteurId: auteurId,
          motif: typeLabel + (resp.nouveau ? ` (Nouveau Lot: ${resp.numeroLot})` : ''),
          statut: statut
        };
      }).filter(m => m !== null);

      this.serviceDonnees.ajouterMouvements(mouvementsAAjouter);
      this.serviceDonnees.loadLots();
      this.serviceDonnees.loadMouvements();
      this.estEnChargement.set(false);
      this.fermerModale();
      
      this.serviceDonnees.ajouterNotification(
        'Opération groupée effectuée',
        `${mouvementsAAjouter.length} mouvements enregistrés.`,
        role,
        auteurId
      );
      this.serviceUi.afficherToast('Mouvements enregistrés avec succès.', 'succes');
    });
  }

  valider(id: string) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.validerMouvement(id);
      this.serviceUi.afficherToast('Mouvement validé.', 'succes');
      this.estEnChargement.set(false);
    }, 400);
  }

  rejeter(id: string) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.rejeterMouvement(id);
      this.serviceUi.afficherToast('Mouvement rejeté.', 'info');
      this.estEnChargement.set(false);
    }, 400);
  }
}
