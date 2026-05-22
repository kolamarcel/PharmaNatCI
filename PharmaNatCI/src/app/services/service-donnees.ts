import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
import { environment } from '../../environments/environment';
>>>>>>> 1a8a7c0 (2e commit)
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
import {
  Medicament, Mouvement, Transfert, Commande,
  Etablissement, Categorie, Fournisseur, Lot, LigneCommande, Retour, Prevision, Utilisateur, Notification, Region, Role, DemandeTransfert, Saison
} from '../interface/donnees';

@Injectable({ providedIn: 'root' })
export class ServiceDonnees {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
<<<<<<< HEAD
  private apiUrl = 'http://localhost:8000/api';
=======
<<<<<<< HEAD
  private apiUrl = 'http://localhost:8000/api';
=======
  private apiUrl = environment.apiUrl;
>>>>>>> 1a8a7c0 (2e commit)
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
  private httpOptions = { withCredentials: true };

  regions = signal<Region[]>([]);
  etablissements = signal<Etablissement[]>([]);
  categories = signal<Categorie[]>([]);
  fournisseurs = signal<Fournisseur[]>([]);
  medicaments = signal<Medicament[]>([]);
  lots = signal<Lot[]>([]);
  mouvements = signal<Mouvement[]>([]);
  commandes = signal<Commande[]>([]);
  lignesCommande = signal<LigneCommande[]>([]);
  transferts = signal<Transfert[]>([]);
  demandesTransfert = signal<DemandeTransfert[]>([]);
  retours = signal<Retour[]>([]);
  previsions = signal<Prevision[]>([]);
  statsDashboard = signal<any>(null);
  utilisateurs = signal<Utilisateur[]>([]);
  notifications = signal<Notification[]>([]);
  roles = signal<Role[]>([]);
  saisons = signal<Saison[]>([]);

  constructor() {
    // Les données sont chargées après authentification via ServiceAuthentification
    // pour éviter les erreurs 401 au démarrage
  }

  loadAllData() {
    this.loadRegions();
    this.loadEtablissements();
    this.loadCategories();
    this.loadFournisseurs();
    this.loadMedicaments();
    this.loadLots();
    this.loadMouvements();
    this.loadCommandes();
    this.loadLignesCommande();
    this.loadTransferts();
    this.loadDemandesTransfert();
    this.loadUtilisateurs();
    this.loadNotifications();
    this.loadRetours();
    this.loadPrevisions();
    this.loadRoles();
    this.loadSaisons();
  }

  // Granular Loaders
  // Granular Loaders
  loadRegions() { this.http.get<Region[]>(`${this.apiUrl}/regions/`, this.httpOptions).subscribe(data => this.regions.set(data)); }
  loadRoles() { this.http.get<Role[]>(`${this.apiUrl}/roles/`, this.httpOptions).subscribe(data => this.roles.set(data)); }
  loadEtablissements() { this.http.get<Etablissement[]>(`${this.apiUrl}/etablissements/`, this.httpOptions).subscribe(data => this.etablissements.set(data)); }
  loadCategories() { this.http.get<Categorie[]>(`${this.apiUrl}/categories/`, this.httpOptions).subscribe(data => this.categories.set(data)); }
  loadFournisseurs() { this.http.get<Fournisseur[]>(`${this.apiUrl}/fournisseurs/`, this.httpOptions).subscribe(data => this.fournisseurs.set(data)); }
  loadMedicaments() { this.http.get<Medicament[]>(`${this.apiUrl}/medicaments/`, this.httpOptions).subscribe(data => this.medicaments.set(data)); }
  loadLots() { this.http.get<Lot[]>(`${this.apiUrl}/lots/`, this.httpOptions).subscribe(data => this.lots.set(data)); }
  loadMouvements() { this.http.get<Mouvement[]>(`${this.apiUrl}/mouvements/`, this.httpOptions).subscribe(data => this.mouvements.set(data)); }
  loadCommandes() { this.http.get<Commande[]>(`${this.apiUrl}/commandes/`, this.httpOptions).subscribe(data => this.commandes.set(data)); }
  loadLignesCommande() { this.http.get<LigneCommande[]>(`${this.apiUrl}/lignes-commande/`, this.httpOptions).subscribe(data => this.lignesCommande.set(data)); }
  loadTransferts() { this.http.get<Transfert[]>(`${this.apiUrl}/transferts/`, this.httpOptions).subscribe(data => this.transferts.set(data)); }
  loadDemandesTransfert() { this.http.get<DemandeTransfert[]>(`${this.apiUrl}/demandes-transfert/`, this.httpOptions).subscribe(data => this.demandesTransfert.set(data)); }
  loadUtilisateurs() { this.http.get<Utilisateur[]>(`${this.apiUrl}/utilisateurs/`, this.httpOptions).subscribe(data => this.utilisateurs.set(data)); }
  loadNotifications() { this.http.get<Notification[]>(`${this.apiUrl}/notifications/`, this.httpOptions).subscribe(data => this.notifications.set(data)); }
  loadRetours() { this.http.get<Retour[]>(`${this.apiUrl}/retours/`, this.httpOptions).subscribe(data => this.retours.set(data)); }
  loadPrevisions() { this.http.get<Prevision[]>(`${this.apiUrl}/previsions/`, this.httpOptions).subscribe(data => this.previsions.set(data)); }
  loadSaisons() { this.http.get<Saison[]>(`${this.apiUrl}/saisons/`, this.httpOptions).subscribe(data => this.saisons.set(data)); }
  loadDashboardStats(etablissementId: string) {
    this.http.get<any>(`${this.apiUrl}/dashboard/stats/`, {
      params: { etablissement_id: etablissementId },
      ...this.httpOptions
    }).subscribe(stats => this.statsDashboard.set(stats));
  }

  // Views (Computed)
  stocksParEtablissementView = computed(() => {
    const results: any[] = [];
    
    // 1. Indexer les mouvements par etablissementId et lotId pour un accès en O(1)
    const stockMap = new Map<string, number>();
    for (const m of this.mouvements()) {
      const key = `${m.etablissementId}-${m.lotId}`;
      const qty = Number(m.quantite) || 0;
      const current = stockMap.get(key) || 0;
      if (m.typeMouvement === 'ENTREE') {
        stockMap.set(key, current + qty);
      } else if (m.typeMouvement === 'SORTIE' || m.typeMouvement === 'DESTRUCTION') {
        stockMap.set(key, current - qty);
      }
    }

    // 2. Indexer les mouvements de type SORTIE pour le calcul de la CMM réelle des 3 derniers mois
    const troisMoisEnArriere = new Date();
    troisMoisEnArriere.setMonth(troisMoisEnArriere.getMonth() - 3);
    const threeMonthsTime = troisMoisEnArriere.getTime();
    
    const cmmMap = new Map<string, number>();
    for (const m of this.mouvements()) {
      if (m.typeMouvement === 'SORTIE' && new Date(m.dateMouvement).getTime() >= threeMonthsTime) {
        const key = `${m.etablissementId}-${m.medicamentId}`;
        const qty = Number(m.quantite) || 0;
        cmmMap.set(key, (cmmMap.get(key) || 0) + qty);
      }
    }

    // 3. Regrouper les lots par medicamentId
    const activeLotsMap = new Map<string, Lot[]>();
    for (const lot of this.lots()) {
      const medId = String(lot.medicamentId);
      if (!activeLotsMap.has(medId)) {
        activeLotsMap.set(medId, []);
      }
      activeLotsMap.get(medId)!.push(lot);
    }

    // 4. Indexer les catégories par id
    const catMap = new Map<string, Categorie>();
    for (const c of this.categories()) {
      catMap.set(String(c.id), c);
    }

    // 5. Générer les résultats
    this.etablissements().forEach(etab => {
      const etabId = String(etab.id);
      this.medicaments().forEach(med => {
        const medId = String(med.id);
        const cat = catMap.get(String(med.categorieId));
        const activeLots = activeLotsMap.get(medId) || [];
        
        let stock = 0;
        for (const lot of activeLots) {
          stock += stockMap.get(`${etabId}-${lot.id}`) || 0;
        }

        const lotNumeros = activeLots.map(l => l.numeroLot);
        const fournisseurIds = [...new Set(activeLots.map(l => l.fournisseurId))];

        const cmmQty = cmmMap.get(`${etabId}-${medId}`) || 0;
        const cmmReelle = Math.round(cmmQty / 3);

        results.push({
          id: med.id + '-' + etab.id,
          medicamentId: med.id,
          nom: med.dci + ' (' + med.nomCommercial + ')',
          etablissementId: etab.id,
          etablissementNom: etab.nom,
          forme: med.forme,
          dosage: med.dosage,
          categorie: cat ? cat.nom : 'Inconnue',
          image: med.image,
          stock: stock,
          cmm: cmmReelle,
          seuilMin: med.seuilMin,
          seuilAlerte: med.seuilAlerte,
          lotNumeros: lotNumeros,
          fournisseurIds: fournisseurIds
        });
      });
    });

    return results;
  });

  stocksGlobalView = computed(() => {
    // 1. Calculer le stock global par lot
    const globalStockMap = new Map<string, number>();
    for (const m of this.mouvements()) {
      const lotId = String(m.lotId);
      const qty = Number(m.quantite) || 0;
      const current = globalStockMap.get(lotId) || 0;
      if (m.typeMouvement === 'ENTREE') {
        globalStockMap.set(lotId, current + qty);
      } else if (m.typeMouvement === 'SORTIE' || m.typeMouvement === 'DESTRUCTION') {
        globalStockMap.set(lotId, current - qty);
      }
    }

    // 2. Regrouper les lots par medicamentId
    const activeLotsMap = new Map<string, Lot[]>();
    for (const lot of this.lots()) {
      const medId = String(lot.medicamentId);
      if (!activeLotsMap.has(medId)) {
        activeLotsMap.set(medId, []);
      }
      activeLotsMap.get(medId)!.push(lot);
    }

    // 3. Indexer les catégories
    const catMap = new Map<string, Categorie>();
    for (const c of this.categories()) {
      catMap.set(String(c.id), c);
    }

    return this.medicaments().map(med => {
      const cat = catMap.get(String(med.categorieId));
      const activeLots = activeLotsMap.get(String(med.id)) || [];
      
      let stock = 0;
      for (const lot of activeLots) {
        stock += globalStockMap.get(String(lot.id)) || 0;
      }

      return {
        id: med.id,
        medicamentId: med.id,
        nom: med.dci + ' (' + med.nomCommercial + ')',
        forme: med.forme,
        dosage: med.dosage,
        categorie: cat ? cat.nom : 'Inconnue',
        stock: stock,
        cmm: med.seuilMin,
        seuilAlerte: med.seuilAlerte
      };
    });
  });

  mouvementsView = computed(() => {
    const medMap = new Map<string, Medicament>();
    for (const m of this.medicaments()) medMap.set(String(m.id), m);

    const lotMap = new Map<string, Lot>();
    for (const l of this.lots()) lotMap.set(String(l.id), l);

    const etabMap = new Map<string, Etablissement>();
    for (const e of this.etablissements()) etabMap.set(String(e.id), e);

    const fournMap = new Map<string, Fournisseur>();
    for (const f of this.fournisseurs()) fournMap.set(String(f.id), f);

    return this.mouvements().map(m => {
      const med = medMap.get(String(m.medicamentId));
      const lot = lotMap.get(String(m.lotId));
      const etab = etabMap.get(String(m.etablissementId));
      const fournisseur = lot ? fournMap.get(String(lot.fournisseurId)) : null;
      
      return {
        id: m.id,
        date: new Date(m.dateMouvement).toLocaleString(),
        direction: m.typeMouvement === 'ENTREE' ? 'entree' : (m.typeMouvement === 'SORTIE' ? 'sortie' : 'destruction'),
        type: m.motif || m.typeMouvement,
        idMedicament: m.medicamentId,
        nomMedicament: med ? med.dci : 'Inconnu',
        lot: lot ? lot.numeroLot : 'Inconnu',
        lotId: m.lotId,
        quantite: m.quantite,
        auteur: m.auteurId || 'Système',
        statut: m.statut || 'valide',
        etablissementId: m.etablissementId,
        etablissementNom: etab ? etab.nom : 'Inconnu',
        fournisseurId: fournisseur?.id || null,
        fournisseurNom: fournisseur?.nom || 'Inconnu'
      };
    });
  });

  previsionsView = computed(() => {
    const medMap = new Map<string, Medicament>();
    for (const m of this.medicaments()) medMap.set(String(m.id), m);

    return this.previsions().map(p => {
      const medicament = medMap.get(String(p.medicamentId));
      return {
        ...p,
        medicamentNom: medicament ? medicament.dci : 'Inconnu'
      };
    });
  });

  retoursView = computed(() => {
    const etabMap = new Map<string, Etablissement>();
    for (const e of this.etablissements()) etabMap.set(String(e.id), e);

    const medMap = new Map<string, Medicament>();
    for (const m of this.medicaments()) medMap.set(String(m.id), m);

    return this.retours().map(r => {
      const etablissement = etabMap.get(String(r.etablissementId));
      const medicament = medMap.get(String(r.medicamentId));
      return {
        ...r,
        etablissementNom: etablissement ? etablissement.nom : 'Inconnu',
        medicamentNom: medicament ? medicament.dci : 'Inconnu'
      };
    });
  });

  demandesTransfertView = computed(() => {
    const etabMap = new Map<string, Etablissement>();
    for (const e of this.etablissements()) etabMap.set(String(e.id), e);

    const medMap = new Map<string, Medicament>();
    for (const m of this.medicaments()) medMap.set(String(m.id), m);

    return this.demandesTransfert().map(d => {
      const demandeur = etabMap.get(String(d.etablissementDemandeurId));
      const cible = d.etablissementCibleId === 'TOUS' ? { nom: 'Toutes les structures' } : etabMap.get(String(d.etablissementCibleId));
      const med = medMap.get(String(d.medicamentId));
      return {
        ...d,
        demandeurNom: demandeur ? demandeur.nom : 'Inconnu',
        cibleNom: cible ? cible.nom : 'Inconnu',
        medicamentNom: med ? med.dci : 'Inconnu'
      };
    });
  });

  transfertsView = computed(() => {
    const medMap = new Map<string, Medicament>();
    for (const m of this.medicaments()) medMap.set(String(m.id), m);

    const etabMap = new Map<string, Etablissement>();
    for (const e of this.etablissements()) etabMap.set(String(e.id), e);

    // Recherche optimisée des mouvements par référence
    const movByRefMap = new Map<string, Mouvement[]>();
    for (const m of this.mouvements()) {
      const ref = String(m.reference);
      if (!movByRefMap.has(ref)) movByRefMap.set(ref, []);
      movByRefMap.get(ref)!.push(m);
    }
      
    return this.transferts().map(t => {
      const med = medMap.get(String(t.medicamentId));
      const origine = etabMap.get(String(t.etablissementOrigineId));
      const dest = etabMap.get(String(t.etablissementDestinationId));
      const mouvements = movByRefMap.get('TR-' + String(t.id)) || [];
      
      return {
        id: t.id,
        reference: t.id,
        origine: origine ? origine.nom : 'Inconnu',
        destination: dest ? dest.nom : 'Inconnu',
        etablissementOrigineId: t.etablissementOrigineId,
        etablissementDestinationId: t.etablissementDestinationId,
        medicament: med ? med.dci : 'Inconnu',
        medicamentId: t.medicamentId,
        quantite: t.quantite,
        statut: t.statut,
        urgence: t.urgence,
        mouvementsAssocies: mouvements.map(m => ({
          type: m.typeMouvement,
          quantite: m.quantite,
          etab: etabMap.get(String(m.etablissementId))?.nom || 'Structure'
        }))
      };
    });
  });

  commandesView = computed(() => {
    const etabMap = new Map<string, Etablissement>();
    for (const e of this.etablissements()) etabMap.set(String(e.id), e);

    // Indexer les lignes de commande par commandeId
    const lignesByCmdMap = new Map<string, LigneCommande[]>();
    for (const l of this.lignesCommande()) {
      const cmdId = String(l.commandeId);
      if (!lignesByCmdMap.has(cmdId)) lignesByCmdMap.set(cmdId, []);
      lignesByCmdMap.get(cmdId)!.push(l);
    }

    return this.commandes().map(c => {
      const lignes = lignesByCmdMap.get(String(c.id)) || [];
      const articles = lignes.reduce((sum, l) => sum + Number(l.quantite), 0);
      const etablissement = etabMap.get(String(c.etablissementId));
      const fournisseur = etabMap.get(String(c.fournisseurId));
      
      return {
        id: c.id,
        reference: c.id,
        date: new Date(c.dateCreation).toLocaleDateString(),
        articles: articles,
        statut: c.statut,
        progression: c.progression || 0,
        etablissement: etablissement ? etablissement.nom : 'Inconnu',
        etablissementId: c.etablissementId,
        fournisseur: fournisseur ? fournisseur.nom : (c.fournisseurId || 'PSP-CI'),
        fournisseurId: c.fournisseurId,
        urgente: c.urgente,
        auteurId: c.auteurId
      };
    });
  });

  // Actions
  verifierStock(etablissementId: string, medicamentId: string, quantite: number): boolean {
    const stock = this.stocksParEtablissementView().find(s => String(s.etablissementId) === String(etablissementId) && String(s.medicamentId) === String(medicamentId));
    return (stock?.stock || 0) >= quantite;
  }

  ajouterNotification(titre: string, message: string, destinataireRole?: string, destinataireId?: string) {
    const newNotif = {
      id: 'NOTIF-' + Date.now(),
      titre,
      message,
      date: new Date().toISOString(),
      lue: false,
      destinataireRole,
      destinataireId
    };
    this.http.post(`${this.apiUrl}/notifications/ajouter/`, newNotif, this.httpOptions).subscribe(() => this.loadNotifications());
  }

  marquerNotificationLue(id: string) {
    this.http.patch(`${this.apiUrl}/notifications/${id}/modifier/`, { lue: true }, this.httpOptions).subscribe(() => this.loadNotifications());
  }

  marquerToutesNotificationsLues(role?: string, userId?: string) {
    // Utilise l'endpoint bulk du backend au lieu de N requêtes individuelles
    this.http.post(`${this.apiUrl}/notifications/marquer_lues/`, {}, this.httpOptions)
      .subscribe(() => this.loadNotifications());
  }

  ajouterMouvements(mouvements: any[]) {
    mouvements.forEach(mov => {
      this.http.post(`${this.apiUrl}/mouvements/ajouter/`, mov, this.httpOptions).subscribe(() => this.loadMouvements());
    });
  }

  ajouterMouvement(mov: any) { this.ajouterMouvements([mov]); }
  validerMouvement(id: string) { this.http.patch(`${this.apiUrl}/mouvements/${id}/modifier/`, { statut: 'valide' }, this.httpOptions).subscribe(() => this.loadMouvements()); }
  rejeterMouvement(id: string) { this.http.patch(`${this.apiUrl}/mouvements/${id}/modifier/`, { statut: 'rejete' }, this.httpOptions).subscribe(() => this.loadMouvements()); }

  ajouterDemandeTransfert(demande: any) {
    const payload = {
      id: `DEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      etablissementDemandeurId: demande.demandeur,
      etablissementCibleId: demande.cible === 'TOUS' ? null : demande.cible,
      medicamentId: demande.medicament,
      quantiteDemandee: demande.quantite,
      quantiteSatisfaite: 0,
      statut: 'En attente',
      urgence: demande.urgence || 'Normal'
    };
    this.http.post(`${this.apiUrl}/demandes-transfert/ajouter/`, payload, this.httpOptions)
      .subscribe(() => this.loadDemandesTransfert());
  }
  repondreDemandeTransfert(demandeId: string, etablissementRepondantId: string, quantite: number) {
    // Special action usually handled by a mixed endpoint or multiple calls
    this.http.post(`${this.apiUrl}/demandes-transfert/${demandeId}/repondre/`, {
      etablissementRepondantId,
      quantite
    }, this.httpOptions).subscribe(() => {
      this.loadDemandesTransfert();
      this.loadTransferts();
    });
  }

  ajouterTransfert(transfert: any) { this.http.post(`${this.apiUrl}/transferts/ajouter/`, transfert, this.httpOptions).subscribe(() => this.loadTransferts()); }
  mettreAJourStatutTransfert(id: string, statut: string) { 
    return this.http.patch(`${this.apiUrl}/transferts/${id}/modifier/`, { statut }, this.httpOptions);
  }

  ajouterCommande(commande: any) { this.http.post(`${this.apiUrl}/commandes/ajouter/`, commande, this.httpOptions).subscribe(() => { this.loadCommandes(); this.loadLignesCommande(); }); }
  ajouterCommandeObs(commande: any) { return this.http.post(`${this.apiUrl}/commandes/ajouter/`, commande, this.httpOptions); }
  ajouterLigneCommande(ligne: any) { this.http.post(`${this.apiUrl}/lignes-commande/ajouter/`, ligne, this.httpOptions).subscribe(() => this.loadLignesCommande()); }
  ajouterLigneCommandeObs(ligne: any) { return this.http.post(`${this.apiUrl}/lignes-commande/ajouter/`, ligne, this.httpOptions); }
  updateCommandeStatut(id: string, statut: string) { this.http.patch(`${this.apiUrl}/commandes/${id}/modifier/`, { statut }, this.httpOptions).subscribe(() => this.loadCommandes()); }
  avancerCommande(id: string, userId?: string) {
    return this.http.post(`${this.apiUrl}/commandes/${id}/avancer/`, { userId }, this.httpOptions);
  }

  addRetour(retour: any) { this.http.post(`${this.apiUrl}/retours/ajouter/`, retour, this.httpOptions).subscribe(() => this.loadRetours()); }
  triggerRappel(lotId: string) { this.http.post(`${this.apiUrl}/lots/${lotId}/rappel/`, {}, this.httpOptions).subscribe(() => this.loadLots()); }
  ajouterLot(lot: any) { 
    return this.http.post<Lot>(`${this.apiUrl}/lots/ajouter/`, lot, this.httpOptions);
  }

  regenererPrevisionsIA() {
    return this.http.post(`${this.apiUrl}/previsions/ia/actualiser/`, {}, this.httpOptions);
  }

  // Saisons
  ajouterSaison(saison: Partial<Saison>) {
    const payload = { ...saison, id: 's' + Date.now() };
    return this.http.post<Saison>(`${this.apiUrl}/saisons/ajouter/`, payload, this.httpOptions);
  }
  modifierSaison(saison: Saison) {
    return this.http.patch<Saison>(`${this.apiUrl}/saisons/${saison.id}/modifier/`, saison, this.httpOptions);
  }
  supprimerSaison(id: string) {
    return this.http.delete(`${this.apiUrl}/saisons/${id}/supprimer/`, this.httpOptions);
  }

  // Helpers
  getSousEtablissements(id: string): string[] {
    const direct = this.etablissements().filter(e => e.parentId === id).map(e => e.id);
    let all = [id, ...direct];
    for (const childId of direct) {
      all = [...all, ...this.getSousEtablissements(childId)];
    }
    return [...new Set(all)];
  }

  // Helper pour créer un FormData si un fichier est présent
  private prepareData(obj: any): FormData | any {
    const hasFile = Object.keys(obj).some(k => k.endsWith('_file') && obj[k] instanceof File);
    
    if (hasFile) {
      const fd = new FormData();
      Object.keys(obj).forEach(k => {
        // Skip preview strings and helper _file fields
        if (!k.endsWith('_file') && k !== 'photo' && k !== 'image' && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
          fd.append(k, obj[k]);
        }
      });
      // Append the actual files if they exist
      if (obj.photo_file instanceof File) fd.append('photo', obj.photo_file);
      if (obj.image_file instanceof File) fd.append('image', obj.image_file);
      return fd;
    }

    // JSON branch: Ensure strings are never sent to ImageFields
    const copy = { ...obj };
    delete copy.photo_file;
    delete copy.image_file;
    if (typeof copy.photo === 'string') delete copy.photo;
    if (typeof copy.image === 'string') delete copy.image;
    
    return copy;
  }

  // Admin CRUD
  ajouterUtilisateur(u: any) { 
    const payload = { ...u };
    if (payload.matricule) payload.username = payload.matricule;
    this.http.post(`${this.apiUrl}/utilisateurs/ajouter/`, this.prepareData(payload), this.httpOptions).subscribe(() => this.loadUtilisateurs()); 
  }
  modifierUtilisateur(u: any) { 
    const payload = { ...u };
    if (payload.matricule) payload.username = payload.matricule;
    this.http.patch(`${this.apiUrl}/utilisateurs/${u.id}/modifier/`, this.prepareData(payload), this.httpOptions).subscribe(() => this.loadUtilisateurs()); 
  }
  supprimerUtilisateur(id: string) { this.http.delete(`${this.apiUrl}/utilisateurs/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadUtilisateurs()); }

  ajouterMedicament(m: any) { this.http.post(`${this.apiUrl}/medicaments/ajouter/`, this.prepareData(m), this.httpOptions).subscribe(() => this.loadMedicaments()); }
  modifierMedicament(m: any) { this.http.patch(`${this.apiUrl}/medicaments/${m.id}/modifier/`, this.prepareData(m), this.httpOptions).subscribe(() => this.loadMedicaments()); }
  supprimerMedicament(id: string) { this.http.delete(`${this.apiUrl}/medicaments/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadMedicaments()); }

  ajouterCategorie(c: Categorie) { this.http.post(`${this.apiUrl}/categories/ajouter/`, c, this.httpOptions).subscribe(() => this.loadCategories()); }
  modifierCategorie(c: Categorie) { this.http.put(`${this.apiUrl}/categories/${c.id}/modifier/`, c, this.httpOptions).subscribe(() => this.loadCategories()); }
  supprimerCategorie(id: string) { this.http.delete(`${this.apiUrl}/categories/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadCategories()); }

  ajouterRegion(r: Region) { this.http.post(`${this.apiUrl}/regions/ajouter/`, r, this.httpOptions).subscribe(() => this.loadRegions()); }
  modifierRegion(r: Region) { this.http.put(`${this.apiUrl}/regions/${r.id}/modifier/`, r, this.httpOptions).subscribe(() => this.loadRegions()); }
  supprimerRegion(id: string) { this.http.delete(`${this.apiUrl}/regions/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadRegions()); }

  ajouterEtablissement(e: any) { this.http.post(`${this.apiUrl}/etablissements/ajouter/`, this.prepareData(e), this.httpOptions).subscribe(() => this.loadEtablissements()); }
  modifierEtablissement(e: any) { this.http.patch(`${this.apiUrl}/etablissements/${e.id}/modifier/`, this.prepareData(e), this.httpOptions).subscribe(() => this.loadEtablissements()); }
  supprimerEtablissement(id: string) { this.http.delete(`${this.apiUrl}/etablissements/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadEtablissements()); }

  ajouterFournisseur(f: Fournisseur) { this.http.post(`${this.apiUrl}/fournisseurs/ajouter/`, f, this.httpOptions).subscribe(() => this.loadFournisseurs()); }
  modifierFournisseur(f: Fournisseur) { this.http.put(`${this.apiUrl}/fournisseurs/${f.id}/modifier/`, f, this.httpOptions).subscribe(() => this.loadFournisseurs()); }
  supprimerFournisseur(id: string) { this.http.delete(`${this.apiUrl}/fournisseurs/${id}/supprimer/`, this.httpOptions).subscribe(() => this.loadFournisseurs()); }

  private loadData() { this.loadAllData(); }
}
