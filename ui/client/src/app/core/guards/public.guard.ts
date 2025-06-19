import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn()) {
    // Redirect authenticated users to dashboard
    return router.parseUrl('/dashboard');
  }
  
  // Allow access to public pages for non-authenticated users
  return true;
}; 