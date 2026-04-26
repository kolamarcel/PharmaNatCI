import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';
import { CommandeView } from '../../interface/donnees';

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commandes.html'
})
export class CommandesComposant implements OnInit {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);
  route = inject(ActivatedRoute);
  afficherModale = signal(false);

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

  pageActuelle = signal(1);
  elementsParPage = 4;
  requeteRecherche = signal('');
  statutSelectionne = signal('');
  messageErreur = signal<string | null>(null);
  estEnChargement = signal(false);
  
  rechercheMedicament = signal('');
  medicamentsFiltres = computed(() => {
    const terme = this.rechercheMedicament().toLowerCase();
    return this.serviceDonnees.medicaments().filter(m => 
      m.nomCommercial.toLowerCase().includes(terme) || 
      m.dci.toLowerCase().includes(terme)
    );
  });

  commandesFiltrees = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceFiltrage.commandesFiltrees()
      .filter(c => {
        const raw = this.serviceDonnees.commandes().find(x => x.id === c.id);
        // Show commands where the establishment is the requester OR the supplier
        return raw?.etablissementId === etabId || raw?.fournisseurId === etabId;
      })
      .filter(commande => {
        const correspondRecherche = commande.reference.toLowerCase().includes(this.requeteRecherche().toLowerCase());
        const correspondStatut = this.statutSelectionne() === '' || commande.statut === this.statutSelectionne();
        return correspondRecherche && correspondStatut;
      }).sort((a, b) => b.id.localeCompare(a.id));
  });

  commandesPaginees = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.commandesFiltrees().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => Math.ceil(this.commandesFiltrees().length / this.elementsParPage));

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

  commandeSelectionnee = signal<CommandeView | null>(null);
  lignesCommandeSelectionnee = computed(() => {
    const cmd = this.commandeSelectionnee();
    if (!cmd) return [];
    return this.serviceDonnees.lignesCommande()
      .filter(l => l.commandeId === cmd.id)
      .map(l => {
        const med = this.serviceDonnees.medicaments().find(m => m.id === l.medicamentId);
        return {
          ...l,
          medicamentNom: med ? med.dci : 'Inconnu',
          dosage: med ? med.dosage : '',
          forme: med ? med.forme : ''
        };
      });
  });

  nouvelleCommande = signal<{
    fournisseurId: string;
    urgente: boolean;
    lignes: { medicamentId: string; quantite: number }[];
  }>({
    fournisseurId: '',
    urgente: false,
    lignes: []
  });

  ajouterLigne() {
    this.nouvelleCommande.update(c => ({
      ...c,
      lignes: [...c.lignes, { medicamentId: '', quantite: 1 }]
    }));
  }

  supprimerLigne(index: number) {
    this.nouvelleCommande.update(c => ({
      ...c,
      lignes: c.lignes.filter((_, i) => i !== index)
    }));
  }

  ouvrirModale() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const user = this.serviceAuthentification.utilisateurActuel();
      const etab = this.serviceDonnees.etablissements().find(e => e.id === user?.etablissementId);
      this.nouvelleCommande.set({
        fournisseurId: etab?.parentId || 'PSP-CI',
        urgente: false,
        lignes: [{ medicamentId: '', quantite: 1 }]
      });
      this.estEnChargement.set(false);
      this.afficherModale.set(true);
    }, 400);
  }

  fermerModale() {
    this.afficherModale.set(false);
  }

  creerCommandeManuelle() {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return;

    const cmd = this.nouvelleCommande();
    if (cmd.lignes.some(l => !l.medicamentId || l.quantite <= 0)) {
      this.messageErreur.set('Veuillez remplir correctement toutes les lignes de commande.');
      this.serviceUi.afficherToast('Veuillez remplir correctement toutes les lignes.', 'erreur');
      return;
    }

    this.estEnChargement.set(true);
    setTimeout(() => {
      const commandeId = 'CMD-' + Date.now();

      // 1. Créer la commande de base
      this.serviceDonnees.ajouterCommande({
        id: commandeId,
        etablissementId: user.etablissementId,
        auteurId: user.id,
        fournisseurId: cmd.fournisseurId,
        urgente: cmd.urgente,
        statut: 'Brouillon',
        progression: 0
      });

      // 2. Créer chaque ligne de commande individuellement (requis par le backend)
      cmd.lignes.forEach((ligne, index) => {
        this.serviceDonnees.ajouterLigneCommande({
          id: `LGN-${Date.now()}-${index}`,
          commandeId: commandeId,
          medicamentId: ligne.medicamentId,
          quantite: ligne.quantite
        });
      });

      this.estEnChargement.set(false);
      this.fermerModale();
      this.serviceDonnees.ajouterNotification(
        'Nouvelle commande créée',
        'Votre commande a été enregistrée avec succès.',
        user.role,
        user.id
      );
      this.serviceUi.afficherToast('Commande créée avec succès !', 'succes');
    }, 600);
  }

  voirFacture(commande: CommandeView) {
    this.commandeSelectionnee.set(commande);
  }

  fermerFacture() {
    this.commandeSelectionnee.set(null);
  }

  avancerCommande(id: string) {
    this.messageErreur.set(null);
    const user = this.serviceAuthentification.utilisateurActuel();
    this.estEnChargement.set(true);
    setTimeout(() => {
      try {
        this.serviceDonnees.avancerCommande(id, user?.id);
        this.serviceDonnees.ajouterNotification(
          'Commande mise à jour',
          'Le statut de la commande ' + id + ' a été modifié.',
          user?.role,
          user?.id
        );
        this.serviceUi.afficherToast('Statut de la commande mis à jour.', 'succes');
      } catch (error) {
        if (error instanceof Error) {
          this.messageErreur.set(error.message);
          this.serviceUi.afficherToast(error.message, 'erreur');
        } else {
          this.messageErreur.set('Une erreur est survenue lors de la mise à jour de la commande.');
          this.serviceUi.afficherToast('Erreur de mise à jour.', 'erreur');
        }
      } finally {
        this.estEnChargement.set(false);
      }
    }, 600);
  }

  estDemandeur(commande: CommandeView): boolean {
    const user = this.serviceAuthentification.utilisateurActuel();
    return user?.etablissementId === commande.etablissementId;
  }

  estFournisseur(commande: CommandeView): boolean {
    const user = this.serviceAuthentification.utilisateurActuel();
    return user?.etablissementId === commande.fournisseurId;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['medicamentId']) {
        this.ouvrirModale();
        this.nouvelleCommande.update(c => ({
          ...c,
          lignes: [{ medicamentId: params['medicamentId'], quantite: 1 }]
        }));
      }
    });
  }
}
