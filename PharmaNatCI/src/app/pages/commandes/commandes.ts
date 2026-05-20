import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, NgZone } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceAuthentification } from '../../services/service-authentification';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { ServiceUi } from '../../services/service-ui';
import { CommandeView } from '../../interface/donnees';

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './commandes.html'
})
export class CommandesComposant implements OnInit {
  serviceDonnees = inject(ServiceDonnees);
  serviceAuthentification = inject(ServiceAuthentification);
  serviceFiltrage = inject(ServiceFiltrage);
  serviceUi = inject(ServiceUi);
  route = inject(ActivatedRoute);
  zone = inject(NgZone);
  afficherModale = signal(false);

  Math = Math;

  etablissementActuelId = signal<string | null>(null);

  constructor() {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (user) {
      this.etablissementActuelId.set(user.etablissementId);
    }
  }

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
      // Ne s'arrêter à l'établissement de l'utilisateur que s'il n'est pas Admin ou National
      if (courant.id === userEtabId && !this.serviceAuthentification.estAdmin() && !this.serviceAuthentification.estNational()) break;
      const parentId = courant.parentId;
      courant = parentId ? this.serviceDonnees.etablissements().find(e => e.id === parentId) || null : null;
    }
    return chemin;
  });

  sousEtablissements = computed(() => {
    const id = this.etablissementActuelId();
    // Si aucun ID n'est sélectionné (Admin Central), on affiche les établissements racines (National)
    if (!id) return this.serviceDonnees.etablissements().filter(e => !e.parentId);
    return this.serviceDonnees.etablissements().filter(e => e.parentId === id);
  });

  allerAEtablissement(id: string | null) {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user || !id) return;

    // Security check: only allow navigation within user's scope, unless admin
    const allowedIds = this.serviceDonnees.getSousEtablissements(user.etablissementId || '');
    if (this.serviceAuthentification.estAdmin() || this.serviceAuthentification.estNational() || allowedIds.includes(id)) {
      this.etablissementActuelId.set(id);
      this.pageActuelle.set(1);
    }
  }

  pageActuelle = signal(1);
  elementsParPage = 4;
  requeteRecherche = signal('');
  statutSelectionne = signal('');
  messageErreur = signal<string | null>(null);
  estEnChargement = signal(false);

  rechercheMedicament = signal('');
  medicamentsFiltres = computed(() => {
    const terme = this.rechercheMedicament().toLowerCase();
    return this.serviceDonnees.medicaments().filter(m =>
      m.nomCommercial.toLowerCase().includes(terme) ||
      m.dci.toLowerCase().includes(terme)
    );
  });

  commandesFiltrees = computed(() => {
    const etabId = this.etablissementActuelId();
    return this.serviceFiltrage.commandesFiltrees()
      .filter(c => {
        const raw = this.serviceDonnees.commandes().find(x => x.id === c.id);
        // Show commands where the establishment is the requester OR the supplier
        return raw?.etablissementId === etabId || raw?.fournisseurId === etabId;
      })
      .filter(commande => {
        const correspondRecherche = commande.reference.toLowerCase().includes(this.requeteRecherche().toLowerCase());
        const correspondStatut = this.statutSelectionne() === '' || commande.statut === this.statutSelectionne();
        return correspondRecherche && correspondStatut;
      }).sort((a, b) => b.id.localeCompare(a.id));
  });

  commandesPaginees = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.commandesFiltrees().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => Math.ceil(this.commandesFiltrees().length / this.elementsParPage));

  pagePrecedente() {
    if (this.pageActuelle() > 1) {
      this.pageActuelle.update(p => p - 1);
    }
  }

  pageSuivante() {
    if (this.pageActuelle() < this.totalPages()) {
      this.pageActuelle.update(p => p + 1);
    }
  }

  commandeSelectionnee = signal<CommandeView | null>(null);
  lignesCommandeSelectionnee = computed(() => {
    const cmd = this.commandeSelectionnee();
    if (!cmd) return [];
    return this.serviceDonnees.lignesCommande()
      .filter(l => l.commandeId === cmd.id)
      .map(l => {
        const med = this.serviceDonnees.medicaments().find(m => m.id === l.medicamentId);
        return {
          ...l,
          medicamentNom: med ? med.dci : 'Inconnu',
          dosage: med ? med.dosage : '',
          forme: med ? med.forme : ''
        };
      });
  });

  nouvelleCommande = signal<{
    fournisseurId: string;
    urgente: boolean;
    lignes: { medicamentId: string; quantite: number }[];
  }>({
    fournisseurId: '',
    urgente: false,
    lignes: []
  });

  ajouterLigne() {
    this.nouvelleCommande.update(c => ({
      ...c,
      lignes: [...c.lignes, { medicamentId: '', quantite: 1 }]
    }));
  }

  supprimerLigne(index: number) {
    this.nouvelleCommande.update(c => ({
      ...c,
      lignes: c.lignes.filter((_, i) => i !== index)
    }));
  }

  ouvrirModale() {
    this.estEnChargement.set(true);
    setTimeout(() => {
      const user = this.serviceAuthentification.utilisateurActuel();
      const etab = this.serviceDonnees.etablissements().find(e => e.id === user?.etablissementId);
      this.nouvelleCommande.set({
        fournisseurId: etab?.parentId || 'PSP-CI',
        urgente: false,
        lignes: [{ medicamentId: '', quantite: 1 }]
      });
      this.estEnChargement.set(false);
      this.afficherModale.set(true);
    }, 400);
  }

  fermerModale() {
    this.afficherModale.set(false);
  }

  creerCommandeManuelle() {
    const user = this.serviceAuthentification.utilisateurActuel();
    if (!user) return;

    const cmd = this.nouvelleCommande();
    if (cmd.lignes.some(l => !l.medicamentId || l.quantite <= 0)) {
      this.messageErreur.set('Veuillez remplir correctement toutes les lignes de commande.');
      this.serviceUi.afficherToast('Veuillez remplir correctement toutes les lignes.', 'erreur');
      return;
    }

    this.estEnChargement.set(true);
    const commandeId = 'CMD-' + Date.now();

    // 1. Créer la commande de base d'abord
    this.serviceDonnees.ajouterCommandeObs({
      id: commandeId,
      etablissementId: user.etablissementId,
      auteurId: user.id,
      fournisseurId: cmd.fournisseurId,
      urgente: cmd.urgente,
      statut: 'Brouillon',
      progression: 0
    }).subscribe({
      next: () => {
        // 2. Créer chaque ligne de commande après que la commande parente soit effectivement enregistrée
        const requetesLignes = cmd.lignes.map((ligne, index) => {
          return this.serviceDonnees.ajouterLigneCommandeObs({
            id: `LGN-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
            commandeId: commandeId,
            medicamentId: ligne.medicamentId,
            quantite: ligne.quantite
          });
        });

        if (requetesLignes.length > 0) {
          forkJoin(requetesLignes).subscribe({
            next: () => {
              this.zone.run(() => {
                this.serviceDonnees.loadCommandes();
                this.serviceDonnees.loadLignesCommande();
                this.estEnChargement.set(false);
                this.fermerModale();
                this.serviceDonnees.ajouterNotification(
                  'Nouvelle commande créée',
                  'Votre commande a été enregistrée avec succès.',
                  user.role,
                  user.id
                );
                this.serviceUi.afficherToast('Commande créée avec succès !', 'succes');
              });
            },
            error: (err) => {
              console.error("Erreur création des lignes:", err);
              this.zone.run(() => {
                this.estEnChargement.set(false);
                this.serviceUi.afficherToast("Erreur lors de la création des articles.", 'erreur');
              });
            }
          });
        } else {
          this.zone.run(() => {
            this.serviceDonnees.loadCommandes();
            this.estEnChargement.set(false);
            this.fermerModale();
            this.serviceUi.afficherToast('Commande créée avec succès !', 'succes');
          });
        }
      },
      error: (err) => {
        console.error("Erreur création commande:", err);
        this.zone.run(() => {
          this.estEnChargement.set(false);
          this.serviceUi.afficherToast("Erreur lors de la création de la commande.", 'erreur');
        });
      }
    });
  }

  voirFacture(commande: CommandeView) {
    this.commandeSelectionnee.set(commande);
  }

  fermerFacture() {
    this.commandeSelectionnee.set(null);
  }

  imprimerFacture() {
    const element = document.getElementById('facture-commande');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour l'impression.");
      return;
    }

    let styles = '';
    document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
      styles += node.outerHTML;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture_${this.commandeSelectionnee()?.reference}</title>
          ${styles}
          <style>
            body { background-color: white !important; padding: 20px; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
          <script>
            // Attendre que les styles soient appliqués
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  telechargerFacture() {
    const element = document.getElementById('facture-commande');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `Facture_Commande_${this.commandeSelectionnee()?.reference}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    import('html2pdf.js').then((module: any) => {
      const generateur = module.default || module;
      generateur().set(opt).from(element).save();
    }).catch((err: any) => {
      console.error("Erreur téléchargement PDF:", err);
      alert("Une erreur s'est produite lors de la génération du PDF.");
    });
  }

  private _ouvrirFenetreImpression(elementId: string, titre: string) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const clone = el.cloneNode(true) as HTMLElement;
    this._appliquerStylesCalcules(el, clone);

    const win = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    if (!win) { alert('Autorisez les pop-ups pour imprimer.'); return; }

    win.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8"><title>${titre}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
      <style>
        *{box-sizing:border-box}
        html,body{background:#fff!important;margin:0;padding:0}
        body{font-family:'Inter',Arial,sans-serif}
        @page{size:A4 portrait;margin:15mm}
      </style>
    </head><body>${clone.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 1200);
  }

  private _appliquerStylesCalcules(source: Element, cible: Element) {
    const cs = window.getComputedStyle(source);
    const el = cible as HTMLElement;
    const props = [
      'display', 'flex-direction', 'align-items', 'justify-content', 'flex-wrap', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      'gap', 'grid-template-columns', 'grid-column', 'grid-row',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
      'background-color', 'background-image', 'background-size', 'background-position',
      'color', 'font-size', 'font-weight', 'font-family', 'font-style', 'font-variant',
      'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration', 'white-space',
      'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-color', 'border-width', 'border-style', 'border-radius',
      'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
      'border-collapse', 'box-shadow', 'opacity', 'overflow', 'position', 'vertical-align',
      'top', 'right', 'bottom', 'left', 'z-index', 'list-style', 'word-break', 'overflow-x', 'overflow-y',
    ];
    props.forEach(p => {
      try { const v = cs.getPropertyValue(p); if (v) el.style.setProperty(p, v); } catch { }
    });
    Array.from(source.children).forEach((child, i) => {
      if (cible.children[i]) this._appliquerStylesCalcules(child, cible.children[i]);
    });
  }

  avancerCommande(id: string) {
    this.messageErreur.set(null);
    const user = this.serviceAuthentification.utilisateurActuel();
    this.estEnChargement.set(true);

    this.serviceDonnees.avancerCommande(id, user?.id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.serviceDonnees.loadCommandes();
          this.serviceDonnees.loadLignesCommande(); // Just in case
          this.serviceDonnees.ajouterNotification(
            'Commande mise à jour',
            'Le statut de la commande ' + id + ' a été modifié.',
            user?.role,
            user?.id
          );
          this.estEnChargement.set(false);
          this.serviceUi.afficherToast('Statut de la commande mis à jour.', 'succes');
        });
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour de la commande:", err);
        this.zone.run(() => {
          this.estEnChargement.set(false);
          this.messageErreur.set('Une erreur est survenue lors de la mise à jour de la commande.');
          this.serviceUi.afficherToast('Erreur de mise à jour.', 'erreur');
        });
      }
    });
  }

  estDemandeur(commande: CommandeView): boolean {
    const user = this.serviceAuthentification.utilisateurActuel();
    return user?.etablissementId === commande.etablissementId;
  }

  estFournisseur(commande: CommandeView): boolean {
    const user = this.serviceAuthentification.utilisateurActuel();
    return user?.etablissementId === commande.fournisseurId;
  }

  estAuteur(commande: CommandeView): boolean {
    const user = this.serviceAuthentification.utilisateurActuel();
    return user?.id === commande.auteurId;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['medicamentId']) {
        const quantite = params['quantite'] ? parseInt(params['quantite'], 10) : 1;
        this.ouvrirModale();
        // Petit délai pour s'assurer que le modal est ouvert avant de pré-remplir
        setTimeout(() => {
          this.nouvelleCommande.update(c => ({
            ...c,
            lignes: [{ medicamentId: params['medicamentId'], quantite }]
          }));
        }, 450);
      }
    });
  }

}
