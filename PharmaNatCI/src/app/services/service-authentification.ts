import { Injectable, signal, inject, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Utilisateur, Role } from '../interface/donnees';
import { ServiceDonnees } from './service-donnees';
import { tap, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceAuthentification {
  private http = inject(HttpClient);
  private routeur = inject(Router);
  private serviceDonnees = inject(ServiceDonnees);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:8000/api';

  utilisateurActuel = signal<Utilisateur | null>(null);
  
  etablissementActuel = computed(() => {
    const user = this.utilisateurActuel();
    if (!user || !user.etablissementId) return null;
    return this.serviceDonnees.etablissements().find(e => e.id === user.etablissementId) || null;
  });

  libelleRole = computed(() => {
    const roleId = this.utilisateurActuel()?.role;
    switch (roleId) {
      case 'admin_central': return 'Administrateur Central';
      case 'superviseur_national': return 'Superviseur National';
      case 'pharmacien_region': return 'Pharmacien Régional';
      case 'pharmacien_pharmacie': return 'Pharmacien de Centre';
      case 'agent_caisse': return 'Agent de Caisse';
      default: return roleId || 'Utilisateur';
    }
  });

  // RBAC Helpers
  estNational = computed(() => this.utilisateurActuel()?.role === 'superviseur_national');
  estRegion = computed(() => this.utilisateurActuel()?.role === 'pharmacien_region');
  estPharmacie = computed(() => this.utilisateurActuel()?.role === 'pharmacien_pharmacie');
  estCaisse = computed(() => this.utilisateurActuel()?.role === 'agent_caisse');
  estAdmin = computed(() => this.utilisateurActuel()?.role === 'admin_central');

  peutGererUtilisateurs = computed(() => this.estAdmin());
  peutGererMedicaments = computed(() => this.estAdmin() || this.estNational());
  peutGererEtablissements = computed(() => this.estAdmin() || this.estNational());
  
  constructor() {
    // La vérification de session est maintenant gérée par APP_INITIALIZER dans app.config.ts
  }

  verifierSession(): Promise<Utilisateur | null> {
    return firstValueFrom(
      this.http.get<Utilisateur>(`${this.apiUrl}/auth/profile/`, { withCredentials: true })
    ).then(user => {
      this.utilisateurActuel.set(user);
      this.serviceDonnees.loadAllData();
      return user;
    }).catch(() => {
      this.utilisateurActuel.set(null);
      return null;
    });
  }

  connexion(matricule: string, motDePasse: string) {
    return this.http.post<{user: Utilisateur}>(`${this.apiUrl}/auth/login/`, {
      username: matricule,
      password: motDePasse
    }, { withCredentials: true }).pipe(
      tap(res => {
        this.utilisateurActuel.set(res.user);
        this.serviceDonnees.loadAllData(); // Charger les données après connexion
        this.routeur.navigate(['/tableau-de-bord']);
      })
    );
  }

  deconnexion() {
    this.http.post(`${this.apiUrl}/auth/logout/`, {}, { withCredentials: true }).subscribe(() => {
      this.utilisateurActuel.set(null);
      this.routeur.navigate(['/connexion']);
    });
  }

  mettreAJourProfil(donnees: any) {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/auth/profile/`, donnees, { withCredentials: true }).pipe(
      tap(user => {
        this.utilisateurActuel.set(user);
      })
    );
  }

  changerMotDePasse(vieux: string, nouveau: string) {
    return this.http.post(`${this.apiUrl}/auth/change-password/`, {
      old_password: vieux,
      new_password: nouveau
    }, { withCredentials: true });
  }

  aPermission(action: string): boolean {
    const role = this.utilisateurActuel()?.role;
    if (!role) return false;
    
    // Superviseur National a tous les droits
    if (role === 'superviseur_national') return true; 

    // Admin central : accès complet à l'administration, mais lecture seule sur l'opérationnel
    if (role === 'admin_central') {
      const actionsOperationnelles = [
        'creer_commande', 'valider_commande', 'avancer_commande',
        'gerer_transferts', 'repondre_transfert',
        'creer_mouvement', 'valider_mouvement', 'ajuster_stock',
        'initier_rappel', 'gerer_logistique'
      ];
      
      if (actionsOperationnelles.includes(action)) return false;
      
      // L'admin peut toujours gérer les entités de base
      const actionsAdministratives = ['gerer_utilisateurs', 'gerer_medicaments', 'gerer_etablissements'];
      if (actionsAdministratives.includes(action)) return true;
      
      return true; // Par défaut, l'admin voit tout (lecture seule par défaut via masquage boutons)
    }

    switch (action) {
      case 'creer_commande':
        return role === 'pharmacien_pharmacie' || role === 'pharmacien_region';
      case 'valider_commande':
      case 'avancer_commande':
        return role === 'pharmacien_region';
      case 'gerer_transferts':
      case 'repondre_transfert':
        return role === 'pharmacien_pharmacie' || role === 'pharmacien_region';
      case 'ajuster_stock':
        return role === 'pharmacien_pharmacie' || role === 'pharmacien_region';
      case 'creer_mouvement':
        return true;
      case 'superviser_region':
        return role === 'pharmacien_region';
      default:
        return false;
    }
  }
}
