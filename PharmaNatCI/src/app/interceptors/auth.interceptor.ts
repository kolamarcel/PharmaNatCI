import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ServiceAuthentification } from '../services/service-authentification';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(ServiceAuthentification);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Session expirée ou non authentifiée
        authService.utilisateurActuel.set(null);
        router.navigate(['/connexion']);
      }
      return throwError(() => error);
    })
  );
};
