import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ServiceAuthentification } from '../services/service-authentification';
import { ServiceDonnees } from '../services/service-donnees';
import { ServiceUi } from '../services/service-ui';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceUi = inject(ServiceUi);
  routeur = inject(Router);
  
  chargement = this.serviceUi.chargementGlobal;
  chargementNav = this.serviceUi.chargementNavigation;
  afficherNotifications = signal(false);
  menuMobileOuvert = signal(false);

  notifications = computed(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    return this.serviceDonnees.notifications()
      .filter(n => {
        if (!n.destinataireRole && !n.destinataireId) return true; // Global
        return n.destinataireRole === user.role || n.destinataireId === user.id;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)
      .map(n => ({
        id: n.id,
        titre: n.titre,
        message: n.message,
        lue: n.lue,
        heure: new Date(n.date).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      }));
  });

  aDesNotificationsNonLues = computed(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return false;
    return this.serviceDonnees.notifications().some(n => 
      !n.lue && (!n.destinataireRole || n.destinataireRole === user.role) && (!n.destinataireId || n.destinataireId === user.id)
    );
  });

  effacerNotifications() {
    const user = this.serviceAuthentification.utilisateurActuel();
    this.serviceDonnees.marquerToutesNotificationsLues(user?.role, user?.id);
  }

  elementsMenu = [
    { chemin: '/tableau-de-bord', libelle: 'Tableau de bord', icone: 'dashboard', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie', 'agent_caisse'] },
    { chemin: '/stocks', libelle: 'Gestion des Stocks', icone: 'inventory_2', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie', 'agent_caisse'] },
    { chemin: '/mouvements', libelle: 'Mouvements', icone: 'sync_alt', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie', 'agent_caisse'] },
    { chemin: '/transferts', libelle: 'Transferts', icone: 'local_shipping', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie'] },
    { chemin: '/commandes', libelle: 'Commandes PSP', icone: 'shopping_cart', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie'] },
    { chemin: '/annuaire', libelle: 'Référentiel', icone: 'library_books', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie', 'agent_caisse'] },
    { chemin: '/logistique', libelle: 'Logistique & Retours', icone: 'local_shipping', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie'] },
    { chemin: '/previsions', libelle: 'Prévisions IA', icone: 'insights', roles: ['admin_central', 'superviseur_national', 'pharmacien_region'] },
    { chemin: '/administration', libelle: 'Administration', icone: 'admin_panel_settings', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie'] },
    { chemin: '/parametres', libelle: 'Paramètres', icone: 'settings', roles: ['admin_central', 'superviseur_national', 'pharmacien_region', 'pharmacien_pharmacie', 'agent_caisse'] },
  ];

  elementsMenuFiltres = computed(() => {
    const role = this.serviceAuthentification.utilisateurActuel()?.role;
    if (!role) return [];
    return this.elementsMenu.filter(item => item.roles.includes(role));
  });

  basculerNotifications() {
    this.afficherNotifications.update(v => !v);
  }

  fermerNotifications() {
    if (this.afficherNotifications()) {
      this.afficherNotifications.set(false);
    }
  }

  basculerMenuMobile() {
    this.menuMobileOuvert.update(v => !v);
  }

  fermerMenuMobile() {
    this.menuMobileOuvert.set(false);
  }

  deconnexion() {
    this.serviceAuthentification.deconnexion();
  }
}
