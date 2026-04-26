import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { StockEtablissementView } from '../../interface/donnees';

@Component({
  selector: 'app-annuaire',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './annuaire.html'
})
export class AnnuaireComposant {
  serviceDonnees = inject(ServiceDonnees);
  serviceFiltrage = inject(ServiceFiltrage);

  Math = Math;

  etablissementsSurCarte = computed(() => {
    return this.serviceDonnees.etablissements().map(e => {
      let lat = e.latitude;
      let lng = e.longitude;

      // Simulation de coordonnées si absentes
      if (!lat || !lng) {
        const coords: Record<string, { lat: number, lng: number }> = {
          'reg1': { lat: 5.36, lng: -4.00 }, // Sud (Abidjan)
          'reg2': { lat: 9.45, lng: -5.63 }, // Nord (Korhogo)
          'reg3': { lat: 7.69, lng: -5.03 }, // Centre (Bouaké)
        };
        const base = coords[e.regionId] || { lat: 7.5, lng: -5.5 };
        lat = base.lat + (Math.random() - 0.5) * 0.8;
        lng = base.lng + (Math.random() - 0.5) * 0.8;
      }

      // Conversion en % pour le positionnement SVG (Bounds CI: Lat 4-11, Lng -9 to -2)
      const x = ((lng - (-9)) / ((-2) - (-9))) * 100;
      const y = 100 - ((lat - 4) / (11 - 4)) * 100;

      return { ...e, x, y };
    });
  });

  structureSurvol = signal<any>(null);

  afficherCatalogue = signal(false);
  afficherStructures = signal(false);

  pageActuelle = signal(1);
  elementsParPage = 10;
  requeteRecherche = signal('');
  categorieSelectionnee = signal('');

  stocksFiltres = computed(() => {
    return this.serviceFiltrage.stocksFiltres().filter((item: StockEtablissementView) => {
      const correspondRecherche = item.nom.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
        item.forme.toLowerCase().includes(this.requeteRecherche().toLowerCase()) ||
        item.medicamentId.toLowerCase().includes(this.requeteRecherche().toLowerCase());
      const correspondCategorie = this.categorieSelectionnee() === '' || item.categorie === this.categorieSelectionnee();
      return correspondRecherche && correspondCategorie;
    });
  });

  stocksPagines = computed(() => {
    const debut = (this.pageActuelle() - 1) * this.elementsParPage;
    return this.stocksFiltres().slice(debut, debut + this.elementsParPage);
  });

  totalPages = computed(() => Math.ceil(this.stocksFiltres().length / this.elementsParPage));

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

  ouvrirCatalogue() {
    this.afficherCatalogue.set(true);
  }

  fermerCatalogue() {
    this.afficherCatalogue.set(false);
  }

  ouvrirStructures() {
    this.afficherStructures.set(true);
  }

  fermerStructures() {
    this.afficherStructures.set(false);
  }
}
