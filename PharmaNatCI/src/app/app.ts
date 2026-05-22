import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ServiceUi } from './services/service-ui';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  serviceUi = inject(ServiceUi);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  toasts = this.serviceUi.toasts;

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Activer l'overlay de navigation
        this.serviceUi.activerChargementNavigation();
        this.cdr.markForCheck();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // La navigation Angular est finie, mais les requêtes HTTP continuent
        // chargementNavigation sera désactivé par l'intercepteur quand les données arrivent
        // On décrémente ici le compteur de navigation (1 NavigationStart = 1 décrémentation)
        this.serviceUi.desactiverChargementNavigation();
        this.cdr.markForCheck();
      }
    });

  }

  fermerToast(id: string) {
    this.serviceUi.supprimerToast(id);
  }
}
