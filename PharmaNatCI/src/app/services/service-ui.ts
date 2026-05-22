import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'succes' | 'erreur' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ServiceUi {
  // Signal réactif pour l'état de chargement global (boutons d'action)
  chargementGlobal = signal<boolean>(false);

  // Signal dédié au chargement de page (navigation)
  chargementNavigation = signal<boolean>(false);

  // Signal pour la file d'attente des toasts
  toasts = signal<Toast[]>([]);

  // Compteur pour gérer les requêtes concurrentes (actions)
  private requetesEnCours = 0;

  // Compteur pour gérer les requêtes de navigation
  private requetesNavigationEnCours = 0;

  activerChargement() {
    this.requetesEnCours++;
    this.chargementGlobal.set(true);
  }

  desactiverChargement() {
    this.requetesEnCours = Math.max(0, this.requetesEnCours - 1);
    if (this.requetesEnCours === 0) {
      this.chargementGlobal.set(false);
    }
  }

  activerChargementNavigation() {
    this.requetesNavigationEnCours++;
    this.chargementNavigation.set(true);
  }

  desactiverChargementNavigation() {
    this.requetesNavigationEnCours = Math.max(0, this.requetesNavigationEnCours - 1);
    if (this.requetesNavigationEnCours === 0) {
      this.chargementNavigation.set(false);
    }
  }

  afficherToast(message: string, type: 'succes' | 'erreur' | 'info' = 'info') {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const nouveauToast: Toast = { id, message, type };
    
    this.toasts.update(currentToasts => [...currentToasts, nouveauToast]);

    // Retirer automatiquement le toast après 4 secondes
    setTimeout(() => {
      this.supprimerToast(id);
    }, 4000);
  }

  supprimerToast(id: string) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
  }
}
