import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const clientRoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const claims = authService.getUserClaims();
  if (!authService.hasClientRole(claims)) {
    router.navigate(['/login']);
    return false;
  }

  return true;
}; 