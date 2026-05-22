import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceUi } from '../../services/service-ui';

@Component({
  selector: 'app-ai-forecast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './previsions.html'
})
export class Previsions {
  store = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceUi = inject(ServiceUi);
  router = inject(Router);
  
  estEnChargement = signal(false);
  previsionSelectionnee = signal<any>(null);

  // Modal de confirmation
  confirmationVisible = signal(false);
  confirmationMessage = signal('');
  private _actionEnAttente: (() => void) | null = null;

  demanderConfirmation(message: string, action: () => void) {
    this.confirmationMessage.set(message);
    this._actionEnAttente = action;
    this.confirmationVisible.set(true);
  }

  confirmerAction() {
    this.confirmationVisible.set(false);
    if (this._actionEnAttente) {
      this._actionEnAttente();
      this._actionEnAttente = null;
    }
  }

  annulerAction() {
    this.confirmationVisible.set(false);
    this._actionEnAttente = null;
  }

  previsionsFiltrees = computed(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    const all = this.store.previsionsView();
    
    if (!user) return [];
    
    // Les administrateurs et superviseurs nationaux voient tout
    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return all;
    }
    
    // Les autres ne voient que les prévisions de leur établissement ou de leur région
    return all.filter(p => 
      p.etablissementId === user.etablissementId || 
      (user.role === 'pharmacien_region' && p.regionId === user.etablissementId) // Simplification: si l'utilisateur est rattaché à l'entrepôt régional
    );
  });

  ouvrirDetails(prev: any) {
    this.previsionSelectionnee.set(prev);
  }

  fermerDetails() {
    this.previsionSelectionnee.set(null);
  }

  genererCommande(medicamentId: string, quantite: number) {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user?.etablissementId) {
      this.serviceUi.afficherToast("Vous n'êtes rattaché à aucun établissement.", 'erreur');
      return;
    }

    // Fermer le modal de détail, puis naviguer vers Commandes avec les champs pré-remplis
    this.fermerDetails();
    this.router.navigate(['/commandes'], {
      queryParams: { medicamentId, quantite }
    });
  }

  actualiserModele() {
    this.estEnChargement.set(true);
    this.store.regenererPrevisionsIA().subscribe({
      next: () => {
        this.store.loadPrevisions();
        this.serviceUi.afficherToast('Modèle IA actualisé avec succès.', 'succes');
        this.estEnChargement.set(false);
      },
      error: (err) => {
        console.error(err);
        this.serviceUi.afficherToast('Erreur lors de l\'actualisation du modèle.', 'erreur');
        this.estEnChargement.set(false);
      }
    });
  }
}
