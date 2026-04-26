import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withXsrfConfiguration, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { loadingInterceptor } from './interceptors/loading.interceptor';

import { routes } from './app.routes';
import { ServiceAuthentification } from './services/service-authentification';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor]),
      withXsrfConfiguration({
        cookieName: 'csrftoken',
        headerName: 'X-CSRFToken',
      })
    ),
    provideCharts(withDefaultRegisterables()),
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: ServiceAuthentification) => () => authService.verifierSession(),
      deps: [ServiceAuthentification],
      multi: true
    }
  ],
};
