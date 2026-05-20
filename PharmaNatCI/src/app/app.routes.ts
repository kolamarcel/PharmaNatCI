import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'connexion', loadComponent: () => import('./pages/connexion/connexion').then(m => m.ConnexionComposant) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      { path: 'tableau-de-bord', loadComponent: () => import('./pages/tableau-de-board/tableau-de-board').then(m => m.TableauDeBordComposant) },
      { path: 'stocks', loadComponent: () => import('./pages/stocks/stocks').then(m => m.StocksComposant) },
      { path: 'mouvements', loadComponent: () => import('./pages/mouvements/mouvements').then(m => m.Mouvements) },
      { path: 'transferts', loadComponent: () => import('./pages/transferts/transferts').then(m => m.TransfertsComposant) },
      { path: 'commandes', loadComponent: () => import('./pages/commandes/commandes').then(m => m.CommandesComposant) },
      { path: 'annuaire', loadComponent: () => import('./pages/annuaire/annuaire').then(m => m.AnnuaireComposant) },
      { path: 'logistique', loadComponent: () => import('./pages/logistique/logistique').then(m => m.LogisticsComponent) },
      { path: 'previsions', loadComponent: () => import('./pages/previsions/previsions').then(m => m.Previsions) },
      { path: 'parametres', loadComponent: () => import('./pages/parametres/parametres').then(m => m.ParametresComposant) },
      { path: 'administration', loadComponent: () => import('./pages/administration/administration').then(m => m.AdministrationComposant) },
    ]
  },
  { path: '**', redirectTo: 'connexion' }
];
