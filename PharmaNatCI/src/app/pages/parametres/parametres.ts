import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceUi } from '../../services/service-ui';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule,MatIconModule],
  templateUrl: './parametres.html'
})
export class ParametresComposant {
  serviceAuthentification = inject(ServiceAuthentification);
  serviceUi = inject(ServiceUi);
  
  ongletActif = signal<'profil' | 'notifications' | 'securite'>('profil');
  estEnChargement = signal(false);

  // Modèles de formulaires
  profil = {
    first_name: this.serviceAuthentification.utilisateurActuel()?.first_name || '',
    last_name: this.serviceAuthentification.utilisateurActuel()?.last_name || '',
    email: this.serviceAuthentification.utilisateurActuel()?.email || '',
    telephone: this.serviceAuthentification.utilisateurActuel()?.telephone || '',
    fonction: this.serviceAuthentification.utilisateurActuel()?.fonction || ''
  };

  notifs = {
    notif_rupture: this.serviceAuthentification.utilisateurActuel()?.notif_rupture ?? true,
    notif_commande: this.serviceAuthentification.utilisateurActuel()?.notif_commande ?? true,
    notif_systeme: this.serviceAuthentification.utilisateurActuel()?.notif_systeme ?? false
  };

  securite = {
    vieux: '',
    nouveau: '',
    confirmation: ''
  };

  enregistrerProfil() {
    this.estEnChargement.set(true);
    this.serviceAuthentification.mettreAJourProfil(this.profil).subscribe({
      next: () => {
        this.serviceUi.afficherToast('Profil mis à jour avec succès.', 'succes');
        this.estEnChargement.set(false);
      },
      error: () => {
        this.serviceUi.afficherToast('Erreur lors de la mise à jour du profil.', 'erreur');
        this.estEnChargement.set(false);
      }
    });
  }

  enregistrerNotifications() {
    this.estEnChargement.set(true);
    this.serviceAuthentification.mettreAJourProfil(this.notifs).subscribe({
      next: () => {
        this.serviceUi.afficherToast('Préférences de notification enregistrées.', 'succes');
        this.estEnChargement.set(false);
      },
      error: () => {
        this.serviceUi.afficherToast('Erreur lors de l\'enregistrement.', 'erreur');
        this.estEnChargement.set(false);
      }
    });
  }

  changerMotDePasse() {
    if (this.securite.nouveau !== this.securite.confirmation) {
      this.serviceUi.afficherToast('Les mots de passe ne correspondent pas.', 'erreur');
      return;
    }

    this.estEnChargement.set(true);
    this.serviceAuthentification.changerMotDePasse(this.securite.vieux, this.securite.nouveau).subscribe({
      next: () => {
        this.serviceUi.afficherToast('Mot de passe changé avec succès.', 'succes');
        this.securite = { vieux: '', nouveau: '', confirmation: '' };
        this.estEnChargement.set(false);
      },
      error: (err) => {
        const msg = err.error?.error || 'Erreur lors du changement de mot de passe.';
        this.serviceUi.afficherToast(msg, 'erreur');
        this.estEnChargement.set(false);
      }
    });
  }

  choisirPhoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.estEnChargement.set(true);
      const formData = new FormData();
      formData.append('photo', file);

      this.serviceAuthentification.mettreAJourProfil(formData).subscribe({
        next: () => {
          this.serviceUi.afficherToast('Photo de profil mise à jour.', 'succes');
          this.estEnChargement.set(false);
        },
        error: () => {
          this.serviceUi.afficherToast('Erreur lors de l\'envoi de la photo.', 'erreur');
          this.estEnChargement.set(false);
        }
      });
    }
  }

  afficherSucces(message: string) {
    this.serviceUi.afficherToast(message, 'succes');
  }
}
