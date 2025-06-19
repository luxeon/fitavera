import { Routes } from '@angular/router';
import { ClientSignupComponent } from './client-signup/client-signup.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { clientRoleGuard } from './core/guards/client-role.guard';
import { publicGuard } from './core/guards/public.guard';
import { ClientInvitationComponent } from './client-invitation/client-invitation.component';
import { LocationListComponent } from './features/locations/location-list.component';
import { LocationDetailsComponent } from './features/location-details/location-details.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'signup',
    component: ClientSignupComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard, clientRoleGuard]
  },
  {
    path: 'tenants/:tenantId/clients/signup/:inviteId',
    component: ClientInvitationComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'tenants/:tenantId/clients/join/:inviteId',
    component: ClientInvitationComponent,
    canActivate: [authGuard, clientRoleGuard]
  },
  {
    path: 'tenant/:tenantId/locations',
    component: LocationListComponent,
    canActivate: [authGuard, clientRoleGuard]
  },
  {
    path: 'tenant/:tenantId/locations/:locationId',
    component: LocationDetailsComponent,
    canActivate: [authGuard, clientRoleGuard]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
