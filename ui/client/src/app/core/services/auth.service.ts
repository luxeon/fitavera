import { Injectable, inject } from '@angular/core';
import  {HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { InvitationStorageService } from './invitation-storage.service';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserClaims {
  sub: string;
  id: string;
  tenantIds: string[];
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roles?: Array<{ authority: string }>;
  exp: number;
  iat?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private invitationStorage = inject(InvitationStorageService);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly CLIENT_ROLE = 'ROLE_CLIENT';

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          const claims = this.decodeToken(response.accessToken);
          if (!this.hasClientRole(claims)) {
            throw new Error('User does not have client role');
          }
          this.storeToken(response.accessToken);
        }),
        catchError(error => {
          if (error.message === 'User does not have client role') {
            return throwError(() => new HttpErrorResponse({ error: 'Access denied: Client role required', status: 403}));
          }
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.invitationStorage.clearStoredInvitation();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasClientRole(claims: UserClaims | null): boolean {
    if (!claims || !claims.roles) return false;
    return claims.roles.some(role => role.authority === this.CLIENT_ROLE);
  }

  getUserClaims(): UserClaims | null {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }

  private decodeToken(token: string): UserClaims | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
