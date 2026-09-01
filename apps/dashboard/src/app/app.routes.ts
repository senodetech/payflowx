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

// Functional Admin Guard
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role = localStorage.getItem('userRole');
  if (role === 'ADMIN') {
    return true;
  }
  router.navigate(['/dashboard/overview']);
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
