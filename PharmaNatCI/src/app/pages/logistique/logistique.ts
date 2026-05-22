import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-logistique',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logistique.html'
})
export class LogisticsComponent {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);

  etablissementActuelId = signal<string | null>(null);
  
  // Modale d'ajustement
  afficherModaleAjustement = signal(false);
  typeAjustement = signal<'ENTREE' | 'SORTIE'>('ENTREE');
  chargementAction = signal(false);
  nouveauMouvement = {
    medicamentId: '',
    numeroLot: '',
    quantite: 1,
    motif: ''
  };

  idMedicamentAjustement = signal<string>('');

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

  mouvementsRecents = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceFiltrage.mouvementsFiltres()
      .filter(m => String(m.etablissementId) === String(etabId))
      .sort((a, b) => new Date(b.dateMouvement || b.date).getTime() - new Date(a.dateMouvement || a.date).getTime())
      .slice(0, 5);
  });

  transfertsEnAttente = computed(() => {
    const etabId = String(this.etablissementActuelId());
    return this.serviceFiltrage.transfertsFiltres()
      .filter(t => String(t.etablissementOrigineId) === etabId && t.statut === 'En attente')
      .slice(0, 5);
  });

  transfertsEnTransit = computed(() => {
    const etabId = String(this.etablissementActuelId());
    return this.serviceFiltrage.transfertsFiltres()
      .filter(t => String(t.etablissementDestinationId) === etabId && t.statut === 'Expédié')
      .slice(0, 5);
  });

  lotsFiltresAvecStock = computed(() => {
    const medId = this.idMedicamentAjustement();
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
  });

  ouvrirModale(type: 'ENTREE' | 'SORTIE') {
    this.chargementAction.set(true);
    setTimeout(() => {
      this.typeAjustement.set(type);
      const firstMedId = this.serviceDonnees.medicaments()[0]?.id || '';
      this.idMedicamentAjustement.set(firstMedId);
      
      this.nouveauMouvement = {
        medicamentId: firstMedId,
        numeroLot: '',
        quantite: 1,
        motif: type === 'ENTREE' ? 'Réajustement inventaire' : 'Perte/Casse'
      };
      this.chargementAction.set(false);
      this.afficherModaleAjustement.set(true);
    }, 400);
  }

  onMedicamentChange(id: string) {
    this.idMedicamentAjustement.set(id);
    this.nouveauMouvement.medicamentId = id;
    this.nouveauMouvement.numeroLot = ''; // Reset lot on med change
  }

  confirmerAjustement() {
    const role = this.serviceAuthentification.utilisateurActuel()?.role;
    const statut = (role !== 'agent_caisse') ? 'valide' : 'en_attente';
    this.chargementAction.set(true);

    const nomNumLot = this.nouveauMouvement.numeroLot.trim();
    if (!nomNumLot) return;

    // 1. Chercher si le lot existe déjà pour ce médicament
    let lotExistant = this.serviceDonnees.lots().find(l => 
      l.numeroLot.toLowerCase() === nomNumLot.toLowerCase() && 
      String(l.medicamentId) === String(this.nouveauMouvement.medicamentId)
    );

    const proceedWithMovement = (lotId: string) => {
      const mov = {
        id: 'MOV-ADJ-' + Date.now(),
        etablissementId: this.etablissementActuelId(),
        medicamentId: this.nouveauMouvement.medicamentId,
        lotId: lotId,
        typeMouvement: this.typeAjustement(),
        quantite: this.nouveauMouvement.quantite,
        dateMouvement: new Date().toISOString(),
        reference: 'ADJ-MANUEL',
        auteurId: this.serviceAuthentification.utilisateurActuel()?.id,
        statut: statut,
        motif: this.nouveauMouvement.motif + (lotExistant ? '' : ` (Nouveau Lot: ${nomNumLot})`)
      };

      this.chargementAction.set(true);
      // Simuler un léger délai pour que l'utilisateur voit l'action (premium feel)
      setTimeout(() => {
        this.serviceDonnees.ajouterMouvements([mov]);
        this.serviceDonnees.loadLots();
        this.serviceDonnees.loadMouvements();
        this.chargementAction.set(false);
        this.afficherModaleAjustement.set(false);
        
        this.serviceDonnees.ajouterNotification(
          'Ajustement effectué',
          `Un mouvement de ${this.typeAjustement()} a été enregistré.`,
          this.serviceAuthentification.utilisateurActuel()?.role,
          this.serviceAuthentification.utilisateurActuel()?.id
        );
        this.serviceUi.afficherToast(`Mouvement enregistré avec succès.`, 'succes');
      }, 600);
    };

    if (lotExistant) {
      proceedWithMovement(lotExistant.id);
    } else {
      // Si c'est une sortie, on ne peut pas créer de nouveau lot
      if (this.typeAjustement() === 'SORTIE') {
        alert("Impossible de sortir un lot qui n'existe pas en stock.");
        return;
      }

      // Récupération d'un fournisseur valide (obligatoire pour le modèle Lot)
      const validFournisseurId = this.serviceDonnees.fournisseurs()[0]?.id || 
                                 this.serviceDonnees.lots()[0]?.fournisseurId;

      if (!validFournisseurId) {
        alert("Action impossible : aucun fournisseur n'est enregistré dans le système. Veuillez en créer un d'abord.");
        return;
      }

      // Création automatique du lot pour une Entrée
      const nouveauLot = {
        id: 'LOT-M-' + Date.now(),
        medicamentId: this.nouveauMouvement.medicamentId,
        numeroLot: nomNumLot,
        fournisseurId: validFournisseurId,
        dateFabrication: new Date().toISOString().split('T')[0],
        datePeremption: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
        statut: 'actif'
      };

      this.chargementAction.set(true);
      this.serviceDonnees.ajouterLot(nouveauLot).subscribe({
        next: createdLot => {
          proceedWithMovement(createdLot.id);
        },
        error: () => this.chargementAction.set(false)
      });
    }
  }

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

  retoursFiltres = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceDonnees.retoursView().filter(r => r.etablissementId === etabId)
      .sort((a, b) => b.id.localeCompare(a.id));
  });

  initierRappel() {
    const lotId = this.serviceDonnees.lots()[0]?.id;
    if (lotId) {
      this.serviceDonnees.triggerRappel(lotId);
      this.serviceDonnees.ajouterNotification(
        'Rappel de lot initié',
        'Le processus de rappel de lot a été démarré pour le lot ' + lotId,
        this.serviceAuthentification.utilisateurActuel()?.role,
        this.serviceAuthentification.utilisateurActuel()?.id
      );
      this.serviceUi.afficherToast('Processus de rappel initié.', 'info');
    }
  }

  simulerScan() {
    // Find a transfer or command to deliver
    const etabId = this.etablissementActuelId();
    const tr = this.serviceDonnees.transferts().find(t => String(t.etablissementDestinationId) === String(etabId) && t.statut === 'Expédié');
    if (tr) {
      this.chargementAction.set(true);
      this.serviceDonnees.mettreAJourStatutTransfert(tr.id, 'Livré').subscribe({
        next: () => {
          this.serviceDonnees.loadTransferts();
          this.serviceDonnees.loadMouvements();
          this.serviceDonnees.loadLots();
          this.chargementAction.set(false);
          this.serviceDonnees.ajouterNotification(
            'Scan e-POD réussi',
            'Le transfert ' + tr.id + ' a été réceptionné et le stock a été mis à jour.',
            this.serviceAuthentification.utilisateurActuel()?.role,
            this.serviceAuthentification.utilisateurActuel()?.id
          );
          this.serviceUi.afficherToast('Scan e-POD réussi. Stock mis à jour.', 'succes');
        },
        error: () => this.chargementAction.set(false)
      });
      return;
    }

    const cmd = this.serviceDonnees.commandes().find(c => String(c.etablissementId) === String(etabId) && c.statut === 'Préparation');
    if (cmd) {
      this.serviceDonnees.avancerCommande(cmd.id).subscribe(() => {
        this.serviceDonnees.loadCommandes();
        this.serviceDonnees.ajouterNotification(
          'Scan e-POD réussi',
          'La commande ' + cmd.id + ' a été réceptionnée.',
          this.serviceAuthentification.utilisateurActuel()?.role,
          this.serviceAuthentification.utilisateurActuel()?.id
        );
        this.serviceUi.afficherToast('Commande réceptionnée via e-POD.', 'succes');
      });
      return;
    }

    this.serviceDonnees.ajouterNotification(
      'Scan e-POD',
      'Aucune livraison en attente pour scan sur ' + this.etablissementActuel()?.nom,
      this.serviceAuthentification.utilisateurActuel()?.role,
      this.serviceAuthentification.utilisateurActuel()?.id
    );
    this.serviceUi.afficherToast('Aucune livraison en attente.', 'info');
  }
}
