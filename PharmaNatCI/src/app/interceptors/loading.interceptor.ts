import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ServiceUi } from '../services/service-ui';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const serviceUi = inject(ServiceUi);

  // Activer le chargement global (pour les boutons d'action: spinners, disabled)
  serviceUi.activerChargement();

  return next(req).pipe(
    finalize(() => {
      serviceUi.desactiverChargement();
    })
  );
};
