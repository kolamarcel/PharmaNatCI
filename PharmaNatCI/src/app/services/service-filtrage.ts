import { Injectable, inject, computed } from '@angular/core';
import { ServiceDonnees } from './service-donnees';
import { ServiceAuthentification } from './service-authentification';
import { Utilisateur, Etablissement, StockEtablissementView, Mouvement, Transfert, DemandeTransfert, Commande } from '../interface/donnees';

@Injectable({ providedIn: 'root' })
export class ServiceFiltrage {
  private serviceDonnees = inject(ServiceDonnees);
  private serviceAuthentification = inject(ServiceAuthentification);

  stocksFiltres = computed<StockEtablissementView[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    
    const allStocks = this.serviceDonnees.stocksParEtablissementView();
    
    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allStocks;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId);
      return allStocks.filter(s => ids.includes(s.etablissementId));
    }

    return allStocks.filter(s => s.etablissementId === etabId);
  });

  mouvementsFiltres = computed<any[]>(() => { // Use specific view type if available
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allMouvements = this.serviceDonnees.mouvementsView();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allMouvements;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId).map(id => String(id));
      return allMouvements.filter(m => ids.includes(String(m.etablissementId)));
    }

    return allMouvements.filter(m => String(m.etablissementId) === String(etabId));
  });

  transfertsFiltres = computed<any[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allTransferts = this.serviceDonnees.transfertsView();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allTransferts;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId);
      return allTransferts.filter(t => ids.includes(t.etablissementOrigineId) || ids.includes(t.etablissementDestinationId));
    }

    return allTransferts.filter(t => t.etablissementOrigineId === etabId || t.etablissementDestinationId === etabId);
  });

  demandesTransfertFiltrees = computed<any[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allDemandes = this.serviceDonnees.demandesTransfertView();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allDemandes;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId);
      return allDemandes.filter(d => {
        const raw = this.serviceDonnees.demandesTransfert().find(x => x.id === d.id);
        if (!raw) return false;
        return ids.includes(raw.etablissementDemandeurId) || ids.includes(raw.etablissementCibleId);
      });
    }

    return allDemandes.filter(d => {
      const raw = this.serviceDonnees.demandesTransfert().find(x => x.id === d.id);
      if (!raw) return false;
      return raw.etablissementDemandeurId === etabId || raw.etablissementCibleId === etabId;
    });
  });

  commandesFiltrees = computed<any[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allCommandes = this.serviceDonnees.commandesView();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allCommandes;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId).map(id => String(id));
      return allCommandes.filter(c => ids.includes(String(c.etablissementId)));
    }

    return allCommandes.filter(c => String(c.etablissementId) === String(etabId));
  });
  
  utilisateursFiltres = computed<Utilisateur[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allUsers = this.serviceDonnees.utilisateurs();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allUsers;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId).map(id => String(id));
      return allUsers.filter(u => u.etablissementId && ids.includes(String(u.etablissementId)));
    }

    return allUsers.filter(u => String(u.etablissementId) === String(etabId));
  });

  etablissementsFiltres = computed<Etablissement[]>(() => {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return [];
    const allEtabs = this.serviceDonnees.etablissements();

    if (user.role === 'admin_central' || user.role === 'superviseur_national') {
      return allEtabs;
    }
    
    const etabId = user.etablissementId;
    if (!etabId) return [];

    if (user.role === 'pharmacien_region') {
      const ids = this.serviceDonnees.getSousEtablissements(etabId).map(id => String(id));
      return allEtabs.filter(e => ids.includes(String(e.id)));
    }

    return allEtabs.filter(e => String(e.id) === String(etabId));
  });
}
