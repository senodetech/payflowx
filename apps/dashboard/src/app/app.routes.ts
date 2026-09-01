import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

// Functional Auth Guard
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');
  if (token) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/dashboard/overview/overview.component').then((m) => m.OverviewComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments-list.component').then((m) => m.PaymentsListComponent),
      },
      {
        path: 'keys',
        loadComponent: () =>
          import('./features/keys/keys-manager.component').then((m) => m.KeysManagerComponent),
      },
      {
        path: 'webhooks',
        loadComponent: () =>
          import('./features/webhooks/webhooks-manager.component').then((m) => m.WebhooksManagerComponent),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin-console.component').then((m) => m.AdminConsoleComponent),
      },
      {
        path: 'dev-docs',
        loadComponent: () =>
          import('./features/docs/dev-docs.component').then((m) => m.DevDocsComponent),
      },
      {
        path: 'platform-guide',
        loadComponent: () =>
          import('./features/docs/platform-guide.component').then((m) => m.PlatformGuideComponent),
      },
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
