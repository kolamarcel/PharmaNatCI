import { ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceDonnees } from '../../services/service-donnees';
import { ServiceFiltrage } from '../../services/service-filtrage';
import { StockEtablissementView } from '../../interface/donnees';
import * as L from 'leaflet';

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

  @ViewChild('mapElement') mapElement!: ElementRef;
  map: L.Map | null = null;

  etablissementsData = computed(() => {
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

      return { ...e, lat, lng };
    });
  });

  stats = computed(() => {
    const etabs = this.serviceDonnees.etablissements();
    return {
      total: etabs.length,
      regions: this.serviceDonnees.regions().length,
      districts: etabs.filter(e => e.type?.toUpperCase() === 'REGION').length,
      pharmacies: etabs.filter(e => e.type?.toUpperCase() === 'PHARMACIE').length,
      national: etabs.filter(e => e.type?.toUpperCase() === 'NATIONAL').length
    };
  });

  structureSurvol = signal<any>(null);

  afficherCatalogue = signal(false);
  afficherStructures = signal(false);

  constructor() {
    // Effect to handle map initialization when the modal opens
    effect(() => {
      if (this.afficherStructures()) {
        // Wait a tick for the element to be rendered in the DOM (@if)
        setTimeout(() => this.initMap(), 100);
      } else {
        this.destroyMap();
      }
    });
  }

  private initMap() {
    if (!this.mapElement) return;

    // Center on Côte d'Ivoire
    this.map = L.map(this.mapElement.nativeElement).setView([7.536064, -5.54708], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.addMarkers();
    
    // Invalidate size in case of layout shifts
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private addMarkers() {
    if (!this.map) return;

    const data = this.etablissementsData();
    data.forEach(etab => {
      const type = etab.type?.toUpperCase();
      let color = '#10b981'; // Default (Pharmacie Locale / Emerald Green)
      let radius = 5;

      if (type === 'NATIONAL') {
        color = '#f97316'; // Vibrant Orange for National
        radius = 9;
      } else if (type === 'REGION') {
        color = '#6366f1'; // Indigo for Regional
        radius = 7;
      } else {
        color = '#10b981'; // Emerald Green for Pharmacie Locale
        radius = 5;
      }

      const marker = L.circleMarker([etab.lat, etab.lng], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85
      })
      .addTo(this.map!)
      .bindPopup(`
        <div style="font-family: 'Inter', sans-serif;">
          <strong style="color: #111827;">${etab.nom}</strong><br>
          <span style="color: #6b7280; font-size: 12px;">Type: ${etab.type}</span><br>
          ${etab.adresse ? `<span style="color: #6b7280; font-size: 12px;">${etab.adresse}</span>` : ''}
        </div>
      `);
    });
  }

  private destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

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
