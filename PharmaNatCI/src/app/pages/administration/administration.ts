import { Component, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceUi } from '../../services/service-ui';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { Utilisateur, Medicament, Categorie, Etablissement, Region, Saison, Fournisseur } from '../../interface/donnees';
import * as L from 'leaflet';
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
import { environment } from '../../../environments/environment';
>>>>>>> 1a8a7c0 (2e commit)
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './administration.html'
})
export class AdministrationComposant {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceUi = inject(ServiceUi);
  serviceFiltrage = inject(ServiceFiltrage);
  routeur = inject(Router);
  http = inject(HttpClient);

  constructor() {
    // Tous les rôles autorisés dans le menu peuvent accéder à la page.
    // Les actions d'ajout/modification/suppression sont protégées par peutGererUtilisateurs() dans le HTML.
    const user = this.serviceAuthentification.utilisateurActuel();
    if (user) {
      this.etablissementActuelId.set(user.etablissementId);
    }

    // Effet pour initialiser la carte dès que le modal s'affiche
    effect(() => {
      if (this.afficherModalSaisiePosition()) {
        // Un délai très court suffit pour que le DOM soit prêt
        setTimeout(() => this.initMapSaisie(), 50);
      }
    });
  }

  ongletActif = signal<'utilisateurs' | 'medicaments' | 'categories' | 'etablissements' | 'regions' | 'saisons' | 'fournisseurs'>('utilisateurs');
  termeRecherche = signal('');
  estEnChargement = signal(false);

  etablissementActuelId = signal<string | null>(null);

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
      if (courant.id === userEtabId && !this.serviceAuthentification.estAdmin() && !this.serviceAuthentification.estNational()) break;
      const parentId = courant.parentId;
      courant = parentId ? this.serviceDonnees.etablissements().find(e => e.id === parentId) || null : null;
    }
    return chemin;
  });

  sousEtablissements = computed(() => {
    const id = this.etablissementActuelId();
    if (!id) return this.serviceDonnees.etablissements().filter(e => !e.parentId);
    return this.serviceDonnees.etablissements().filter(e => e.parentId === id);
  });

  allerAEtablissement(id: string | null) {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return;

    // Si id est null (clic sur Racine), on réinitialise
    if (!id) {
      this.etablissementActuelId.set(null);
      return;
    }

    const allowedIds = this.serviceDonnees.getSousEtablissements(user.etablissementId || '');
    if (this.serviceAuthentification.estAdmin() || this.serviceAuthentification.estNational() || allowedIds.includes(id)) {
      this.etablissementActuelId.set(id);
    }
  }

  utilisateursFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    const selectedId = this.etablissementActuelId();
    const descendansIds = selectedId ? this.serviceDonnees.getSousEtablissements(selectedId) : null;

    return this.serviceDonnees.utilisateurs().filter(u => {
      const matchTerme = u.nom?.toLowerCase().includes(terme) ||
        u.email.toLowerCase().includes(terme) ||
        (u.matricule && u.matricule.toLowerCase().includes(terme));

      const matchStructure = !descendansIds || (u.etablissementId && descendansIds.includes(u.etablissementId));

      return matchTerme && matchStructure;
    }).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  });

  medicamentsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.medicaments().filter(m =>
      m.nomCommercial.toLowerCase().includes(terme) ||
      m.dci.toLowerCase().includes(terme)
    ).sort((a, b) => a.nomCommercial.localeCompare(b.nomCommercial));
  });

  categoriesFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.categories().filter(c =>
      c.nom.toLowerCase().includes(terme)
    ).sort((a, b) => a.nom.localeCompare(b.nom));
  });

  etablissementsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    const selectedId = this.etablissementActuelId();
    const descendansIds = selectedId ? this.serviceDonnees.getSousEtablissements(selectedId) : null;

    return this.serviceDonnees.etablissements().filter(e => {
      const matchTerme = e.nom.toLowerCase().includes(terme) || e.type.toLowerCase().includes(terme);

      // Filtre hiérarchique : on affiche l'établissement lui-même et ses descendants
      const matchStructure = !descendansIds || descendansIds.includes(e.id);

      return matchTerme && matchStructure;
    }).sort((a, b) => a.nom.localeCompare(b.nom));
  });

  regionsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.regions().filter(r =>
      r.nom.toLowerCase().includes(terme) ||
      (r.code && r.code.toLowerCase().includes(terme))
    ).sort((a, b) => a.nom.localeCompare(b.nom));
  });

  fournisseursFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.fournisseurs().filter(f =>
      f.nom.toLowerCase().includes(terme)
    ).sort((a, b) => a.nom.localeCompare(b.nom));
  });

  etablissementsPourRole = computed(() => {
    const role = this.utilisateurEdition().role;
    const etabs = this.serviceDonnees.etablissements();

    if (!role || role === 'admin_central') return [];

    const roleNormalise = role.toLowerCase().trim();

    // Superviseur National -> Uniquement l'Entrepôt National
    if (roleNormalise.includes('superviseur_national')) {
      return etabs.filter(e => e.type === 'NATIONAL');
    }

    // Pharmacien Région -> Uniquement les Entrepôts Régionaux
    if (roleNormalise.includes('pharmacien_region')) {
      return etabs.filter(e => e.type === 'REGION');
    }

    // Pharmacien Pharmacie et Agent de Caisse -> PHARMACIE
    if (roleNormalise.includes('pharmacien_pharmacie') || roleNormalise.includes('agent_caisse')) {
      return etabs.filter(e => e.type === 'PHARMACIE');
    }

    // Par défaut pour les autres rôles s'il y en a
    return etabs.filter(e => e.type === 'PHARMACIE');
  });

  formatEtablissementNom(e: Etablissement): string {
    if (e.type === 'PHARMACIE') {
      const region = this.serviceDonnees.regions().find(r => r.id === e.regionId);
      return region ? `${e.nom} (${region.nom})` : e.nom;
    } else if (e.type === 'REGION') {
      const nation = this.serviceDonnees.etablissements().find(n => n.id === e.parentId || n.type === 'NATIONAL');
      return nation ? `${e.nom} (${nation.nom})` : `${e.nom} (Nation)`;
    }
    return e.nom;
  }

  // Modals state
  estEnChargementModal = signal(false);
  afficherModalUtilisateur = signal(false);
  utilisateurEdition = signal<Partial<Utilisateur>>({});

  afficherModalMedicament = signal(false);
  medicamentEdition = signal<Partial<Medicament>>({});

  afficherModalCategorie = signal(false);
  categorieEdition = signal<Partial<Categorie>>({});

  afficherModalEtablissement = signal(false);
  etablissementEdition = signal<Partial<Etablissement>>({});

  afficherModalRegion = signal(false);
  regionEdition = signal<Partial<Region>>({});

  afficherModalSaison = signal(false);
  saisonEdition = signal<Partial<Saison>>({});
  saisonMoisInput = signal(''); // mois séparés par virgules ex: "5,6,7"

  afficherModalFournisseur = signal(false);
  fournisseurEdition = signal<Partial<Fournisseur>>({});

  saisonsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.saisons().filter(s =>
      s.nom.toLowerCase().includes(terme) ||
      (this.serviceDonnees.regions().find(r => r.id === s.regionId)?.nom || '').toLowerCase().includes(terme)
    );
  });

  // Map Picker State
  @ViewChild('mapSaisieElement') mapSaisieElement!: ElementRef;
  afficherModalSaisiePosition = signal(false);
  rechercheLieu = signal('');
  mapSaisie: L.Map | null = null;
  markerSaisie: L.Marker | null = null;
  positionSelectionnee = signal<{ lat: number, lng: number } | null>(null);
  resultatsRechercheLieu = signal<any[]>([]);

  ouvrirModalSaisiePosition() {
    this.afficherModalSaisiePosition.set(true);
  }

  fermerModalSaisiePosition() {
    this.afficherModalSaisiePosition.set(false);
    if (this.mapSaisie) {
      this.mapSaisie.remove();
      this.mapSaisie = null;
      this.markerSaisie = null;
    }
  }

  private initMapSaisie() {
    if (!this.mapSaisieElement || this.mapSaisie) return;

    const latInit = this.etablissementEdition().latitude || 7.536064;
    const lngInit = this.etablissementEdition().longitude || -5.54708;

    // Initialisation rapide sans animations initiales pour plus de réactivité
    this.mapSaisie = L.map(this.mapSaisieElement.nativeElement, {
      zoomControl: true,
      fadeAnimation: false,
      markerZoomAnimation: false
    }).setView([latInit, lngInit], 6);

<<<<<<< HEAD
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
=======
<<<<<<< HEAD
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
=======
    L.tileLayer(environment.tileLayerUrl, {
>>>>>>> 1a8a7c0 (2e commit)
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
      attribution: '© OpenStreetMap contributors',
      updateWhenIdle: true,
      keepBuffer: 2
    }).addTo(this.mapSaisie);

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });

    this.markerSaisie = L.marker([latInit, lngInit], {
      draggable: true,
      icon: customIcon
    }).addTo(this.mapSaisie);

    this.markerSaisie.on('dragend', () => {
      const pos = this.markerSaisie!.getLatLng();
      this.positionSelectionnee.set({ lat: pos.lat, lng: pos.lng });
    });

    this.mapSaisie.on('click', (e: L.LeafletMouseEvent) => {
      this.markerSaisie!.setLatLng(e.latlng);
      this.positionSelectionnee.set({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    this.positionSelectionnee.set({ lat: latInit, lng: lngInit });

    // Forcer le rendu immédiat et répété pour contrer les délais de rendu du navigateur
    this.mapSaisie.invalidateSize();
    setTimeout(() => this.mapSaisie?.invalidateSize(), 100);
    setTimeout(() => this.mapSaisie?.invalidateSize(), 400);
  }

  rechercherLieu(query?: string) {
    const q = query || this.rechercheLieu();
    if (!q || q.length < 3) {
      this.resultatsRechercheLieu.set([]);
      return;
    }

<<<<<<< HEAD
    this.http.get<any[]>(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ci&limit=5`).subscribe(results => {
=======
<<<<<<< HEAD
    this.http.get<any[]>(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ci&limit=5`).subscribe(results => {
=======
    this.http.get<any[]>(`${environment.nominatimUrl}?format=json&q=${encodeURIComponent(q)}&countrycodes=ci&limit=5`).subscribe(results => {
>>>>>>> 1a8a7c0 (2e commit)
>>>>>>> 472cd0d8fbf1901c90d654f35050fbce51666f13
      this.resultatsRechercheLieu.set(results || []);

      // Si l'utilisateur clique sur le bouton "Rechercher" ou appuie sur Entrée, on prend le premier résultat
      if (!query && results && results.length > 0) {
        this.centrerSurLieu(results[0]);
      } else if (query) {
        // En mode automatique (input), on ne centre que si le nom correspond exactement (sélection dans datalist)
        const match = results.find(r => r.display_name === q);
        if (match) this.centrerSurLieu(match);
      }
    });
  }

  private centrerSurLieu(best: any) {
    const lat = parseFloat(best.lat);
    const lon = parseFloat(best.lon);

    if (this.mapSaisie && this.markerSaisie) {
      this.mapSaisie.setView([lat, lon], 12);
      this.markerSaisie.setLatLng([lat, lon]);
      this.positionSelectionnee.set({ lat, lng: lon });
    }
  }

  confirmerPosition() {
    const pos = this.positionSelectionnee();
    if (pos) {
      this.etablissementEdition.update(e => ({ ...e, latitude: pos.lat, longitude: pos.lng }));
      this.serviceUi.afficherToast('Position mise à jour.', 'succes');
    }
    this.fermerModalSaisiePosition();
  }

  nomRegionDeSaison(regionId: string): string {
    return this.serviceDonnees.regions().find(r => r.id === regionId)?.nom || '—';
  }

  // Utilisateurs
  ouvrirModalUtilisateur(u?: Utilisateur) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      if (u) {
        this.utilisateurEdition.set({ ...u });
      } else {
        const currentUser = this.serviceAuthentification.utilisateurActuel();
        this.utilisateurEdition.set({
          role: 'agent_caisse',
          actif: true,
          etablissementId: currentUser?.role === 'admin_central' ? null : currentUser?.etablissementId
        });
      }
      this.estEnChargementModal.set(false);
      this.afficherModalUtilisateur.set(true);
    }, 400);
  }
  fermerModalUtilisateur() { this.afficherModalUtilisateur.set(false); }
  sauvegarderUtilisateur() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const u = this.utilisateurEdition() as Utilisateur;
      // Utiliser le matricule comme identifiant de connexion (username)
      if (u.matricule) {
        u.username = u.matricule;
      }

      let message = '';
      if (u.id) {
        this.serviceDonnees.modifierUtilisateur(u);
        message = 'Utilisateur modifié avec succès.';
      } else {
        u.id = 'u' + Date.now();
        this.serviceDonnees.ajouterUtilisateur(u);
        message = 'Utilisateur ajouté avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalUtilisateur();
    }, 600);
  }
  onRoleChange() {
    // Déclenche la mise à jour du signal pour que le computed etablissementsPourRole s'actualise
    this.utilisateurEdition.update(u => ({ ...u }));

    const role = this.utilisateurEdition().role;
    if (!role || role === 'admin_central') {
      this.utilisateurEdition.update(u => ({ ...u, etablissementId: null }));
      return;
    }

    const validEtabs = this.etablissementsPourRole();
    const currentEtabId = this.utilisateurEdition().etablissementId;
    if (currentEtabId && !validEtabs.find(e => e.id === currentEtabId)) {
      this.utilisateurEdition.update(u => ({ ...u, etablissementId: null }));
    }
  }
  basculerStatutUtilisateur(u: Utilisateur) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.modifierUtilisateur({ ...u, actif: !u.actif });
      this.serviceUi.afficherToast(`Le statut de l'utilisateur a été ${!u.actif ? 'activé' : 'désactivé'}.`, 'info');
      this.estEnChargement.set(false);
    }, 600);
  }
  supprimerUtilisateur(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerUtilisateur(id);
        this.serviceUi.afficherToast('Utilisateur supprimé avec succès.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  // Medicaments
  ouvrirModalMedicament(m?: Medicament) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      this.medicamentEdition.set(m ? { ...m } : { actif: true });
      this.estEnChargementModal.set(false);
      this.afficherModalMedicament.set(true);
    }, 400);
  }
  fermerModalMedicament() { this.afficherModalMedicament.set(false); }
  sauvegarderMedicament() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const m = this.medicamentEdition() as Medicament;
      let message = '';
      if (m.id) {
        this.serviceDonnees.modifierMedicament(m);
        message = 'Médicament modifié avec succès.';
      } else {
        m.id = 'm' + Date.now();
        this.serviceDonnees.ajouterMedicament(m);
        message = 'Médicament ajouté avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalMedicament();
    }, 600);
  }
  basculerStatutMedicament(m: Medicament) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.modifierMedicament({ ...m, actif: !m.actif });
      this.serviceUi.afficherToast(`Le statut du médicament a été ${!m.actif ? 'activé' : 'désactivé'}.`, 'info');
      this.estEnChargement.set(false);
    }, 600);
  }
  supprimerMedicament(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerMedicament(id);
        this.serviceUi.afficherToast('Médicament supprimé avec succès.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  // Categories
  ouvrirModalCategorie(c?: Categorie) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      this.categorieEdition.set(c ? { ...c } : { actif: true });
      this.estEnChargementModal.set(false);
      this.afficherModalCategorie.set(true);
    }, 400);
  }
  fermerModalCategorie() { this.afficherModalCategorie.set(false); }
  sauvegarderCategorie() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const c = this.categorieEdition() as Categorie;
      let message = '';
      if (c.id) {
        this.serviceDonnees.modifierCategorie(c);
        message = 'Catégorie modifiée avec succès.';
      } else {
        c.id = 'c' + Date.now();
        this.serviceDonnees.ajouterCategorie(c);
        message = 'Catégorie ajoutée avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalCategorie();
    }, 600);
  }
  basculerStatutCategorie(c: Categorie) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.modifierCategorie({ ...c, actif: !c.actif });
      this.serviceUi.afficherToast(`Le statut de la catégorie a été ${!c.actif ? 'activé' : 'désactivé'}.`, 'info');
      this.estEnChargement.set(false);
    }, 600);
  }
  supprimerCategorie(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerCategorie(id);
        this.serviceUi.afficherToast('Catégorie supprimée avec succès.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  // Etablissements
  ouvrirModalEtablissement(e?: Etablissement) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      this.etablissementEdition.set(e ? { ...e } : { actif: true });
      this.estEnChargementModal.set(false);
      this.afficherModalEtablissement.set(true);
    }, 400);
  }
  fermerModalEtablissement() { this.afficherModalEtablissement.set(false); }
  sauvegarderEtablissement() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const e = this.etablissementEdition() as Etablissement;
      let message = '';
      if (e.id) {
        this.serviceDonnees.modifierEtablissement(e);
        message = 'Établissement modifié avec succès.';
      } else {
        e.id = 'e' + Date.now();
        this.serviceDonnees.ajouterEtablissement(e);
        message = 'Établissement ajouté avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalEtablissement();
    }, 600);
  }
  basculerStatutEtablissement(e: Etablissement) {
    this.estEnChargement.set(true);
    setTimeout(() => {
      this.serviceDonnees.modifierEtablissement({ ...e, actif: !e.actif });
      this.serviceUi.afficherToast(`Le statut de l'établissement a été ${!e.actif ? 'activé' : 'désactivé'}.`, 'info');
      this.estEnChargement.set(false);
    }, 600);
  }
  supprimerEtablissement(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerEtablissement(id);
        this.serviceUi.afficherToast('Établissement supprimé avec succès.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  // Regions
  ouvrirModalRegion(r?: Region) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      this.regionEdition.set(r ? { ...r } : {});
      this.estEnChargementModal.set(false);
      this.afficherModalRegion.set(true);
    }, 400);
  }
  fermerModalRegion() { this.afficherModalRegion.set(false); }
  sauvegarderRegion() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const r = this.regionEdition() as Region;
      let message = '';
      if (r.id) {
        this.serviceDonnees.modifierRegion(r);
        message = 'Région modifiée avec succès.';
      } else {
        r.id = 'r' + Date.now();
        this.serviceDonnees.ajouterRegion(r);
        message = 'Région ajoutée avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalRegion();
    }, 600);
  }
  supprimerRegion(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerRegion(id);
        this.serviceUi.afficherToast('Région supprimée avec succès.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  // Saisons
  ouvrirModalSaison(s?: Saison) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      if (s) {
        this.saisonEdition.set({ ...s });
        this.saisonMoisInput.set(s.mois.join(','));
      } else {
        this.saisonEdition.set({ actif: true, mois: [] });
        this.saisonMoisInput.set('');
      }
      this.estEnChargementModal.set(false);
      this.afficherModalSaison.set(true);
    }, 300);
  }
  fermerModalSaison() { this.afficherModalSaison.set(false); }

  sauvegarderSaison() {
    this.estEnChargement.set(true);
    const raw = this.saisonMoisInput();
    const mois = raw.split(',').map(v => parseInt(v.trim(), 10)).filter(n => n >= 1 && n <= 12);
    const s = { ...this.saisonEdition(), mois } as Saison;

    if (s.id) {
      this.serviceDonnees.modifierSaison(s).subscribe({
        next: () => {
          this.serviceDonnees.loadSaisons();
          this.serviceUi.afficherToast('Saison modifiée avec succès.', 'succes');
          this.estEnChargement.set(false);
          this.fermerModalSaison();
        },
        error: () => {
          this.serviceUi.afficherToast('Erreur lors de la modification.', 'erreur');
          this.estEnChargement.set(false);
        }
      });
    } else {
      this.serviceDonnees.ajouterSaison(s).subscribe({
        next: () => {
          this.serviceDonnees.loadSaisons();
          this.serviceUi.afficherToast('Saison ajoutée avec succès.', 'succes');
          this.estEnChargement.set(false);
          this.fermerModalSaison();
        },
        error: () => {
          this.serviceUi.afficherToast('Erreur lors de l\'ajout.', 'erreur');
          this.estEnChargement.set(false);
        }
      });
    }
  }

  supprimerSaison(id: string) {
    if (confirm('Supprimer cette saison ?')) {
      this.estEnChargement.set(true);
      this.serviceDonnees.supprimerSaison(id).subscribe({
        next: () => {
          this.serviceDonnees.loadSaisons();
          this.serviceUi.afficherToast('Saison supprimée.', 'succes');
          this.estEnChargement.set(false);
        },
        error: () => {
          this.serviceUi.afficherToast('Erreur lors de la suppression.', 'erreur');
          this.estEnChargement.set(false);
        }
      });
    }
  }

  // Fournisseurs
  ouvrirModalFournisseur(f?: Fournisseur) {
    this.estEnChargementModal.set(true);
    setTimeout(() => {
      this.fournisseurEdition.set(f ? { ...f } : {});
      this.estEnChargementModal.set(false);
      this.afficherModalFournisseur.set(true);
    }, 300);
  }
  fermerModalFournisseur() { this.afficherModalFournisseur.set(false); }
  sauvegarderFournisseur() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const f = this.fournisseurEdition() as Fournisseur;
      let message = '';
      if (f.id) {
        this.serviceDonnees.modifierFournisseur(f);
        message = 'Fournisseur modifié avec succès.';
      } else {
        f.id = 'f' + Date.now();
        this.serviceDonnees.ajouterFournisseur(f);
        message = 'Fournisseur ajouté avec succès.';
      }
      this.serviceUi.afficherToast(message, 'succes');
      this.estEnChargement.set(false);
      this.fermerModalFournisseur();
    }, 600);
  }
  supprimerFournisseur(id: string) {
    if (confirm('Supprimer ce fournisseur ?')) {
      this.estEnChargement.set(true);
      setTimeout(() => {
        this.serviceDonnees.supprimerFournisseur(id);
        this.serviceUi.afficherToast('Fournisseur supprimé.', 'succes');
        this.estEnChargement.set(false);
      }, 600);
    }
  }

  onFileSelected(event: Event, entity: 'utilisateur' | 'etablissement' | 'medicament') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const previewUrl = reader.result as string; // utilisé uniquement pour l'aperçu HTML
        if (entity === 'utilisateur') {
          this.utilisateurEdition.update(u => ({ ...u, photo_file: file, photo: previewUrl } as any));
        } else if (entity === 'etablissement') {
          this.etablissementEdition.update(e => ({ ...e, photo_file: file, photo: previewUrl } as any));
        } else if (entity === 'medicament') {
          this.medicamentEdition.update(m => ({ ...m, image_file: file, image: previewUrl } as any));
        }
      };
      reader.readAsDataURL(file);
    }
  }
}
