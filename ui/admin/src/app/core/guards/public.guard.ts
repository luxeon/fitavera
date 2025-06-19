import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Redirect authenticated users to dashboard
    return router.parseUrl('/dashboard');
  }

  // Allow access to public pages for non-authenticated users
  return true;
}; 