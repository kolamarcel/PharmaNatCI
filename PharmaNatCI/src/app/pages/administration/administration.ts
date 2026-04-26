import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceUi } from '../../services/service-ui';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { Utilisateur, Medicament, Categorie, Etablissement, Region, Saison } from '../../interface/donnees';

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

  constructor() {
    // Tous les rôles autorisés dans le menu peuvent accéder à la page.
    // Les actions d'ajout/modification/suppression sont protégées par peutGererUtilisateurs() dans le HTML.
    const user = this.serviceAuthentification.utilisateurActuel();
    if (user) {
      this.etablissementActuelId.set(user.etablissementId);
    }
  }

  ongletActif = signal<'utilisateurs' | 'medicaments' | 'categories' | 'etablissements' | 'regions' | 'saisons'>('utilisateurs');
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

  saisonsFiltres = computed(() => {
    const terme = this.termeRecherche().toLowerCase();
    return this.serviceDonnees.saisons().filter(s =>
      s.nom.toLowerCase().includes(terme) ||
      (this.serviceDonnees.regions().find(r => r.id === s.regionId)?.nom || '').toLowerCase().includes(terme)
    );
  });

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
