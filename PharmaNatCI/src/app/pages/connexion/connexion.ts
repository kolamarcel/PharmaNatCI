import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceUi } from '../../services/service-ui';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connexion.html'
})
export class ConnexionComposant {
  serviceAuthentification = inject(ServiceAuthentification);
  serviceUi = inject(ServiceUi);
  
  matricule = signal('');
  motDePasse = signal('');
  erreur = signal('');
  chargement = signal(false);

  connexion(evenement: Event) {
    evenement.preventDefault();
    this.erreur.set('');
    
    if (!this.matricule() || !this.motDePasse()) {
      this.erreur.set('Veuillez renseigner votre matricule et votre mot de passe.');
      return;
    }

    this.chargement.set(true);
    this.serviceAuthentification.connexion(this.matricule(), this.motDePasse()).subscribe({
      next: () => {
        this.serviceUi.afficherToast('Connexion réussie. Bienvenue dans PharmaNatCI.', 'succes');
      },
      error: () => {
        this.erreur.set('Matricule ou mot de passe incorrect.');
        this.serviceUi.afficherToast('Échec de la connexion. Coordonnées invalides.', 'erreur');
        this.chargement.set(false);
      }
    });
  }
}
