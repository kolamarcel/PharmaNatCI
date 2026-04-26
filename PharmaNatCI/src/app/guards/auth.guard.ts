import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServiceAuthentification } from '../services/service-authentification';

/**
 * Guard qui protège les routes nécessitant une authentification.
 * Si l'utilisateur n'est pas connecté, il est redirigé vers /connexion.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  if (auth.utilisateurActuel()) {
    return true;
  }

  return router.createUrlTree(['/connexion']);
};
