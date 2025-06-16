import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../core/services/auth.service';
import { ClientInvitationService } from '../core/services/client-invitation.service';
import { InvitationStorageService } from '../core/services/invitation-storage.service';

@Component({
  selector: 'app-client-invitation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <div class="invitation-container">
      <mat-card class="invitation-card">
        <mat-card-content>
          @if (isLoading) {
            <div class="loading-content">
              <mat-spinner diameter="40"></mat-spinner>
              <p>{{ 'common.loading' | translate }}</p>
            </div>
          } @else if (successMessage) {
            <div class="success-content">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <h2>{{ 'common.success' | translate }}</h2>
              <p>{{ successMessage }}</p>
            </div>
          } @else if (errorMessage) {
            <div class="error-content">
              <mat-icon class="error-icon">error</mat-icon>
              <h2>{{ 'common.error' | translate }}</h2>
              <p>{{ errorMessage }}</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./client-invitation.component.scss']
})
export class ClientInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private clientInvitationService = inject(ClientInvitationService);
  private invitationStorageService = inject(InvitationStorageService);
  private translateService = inject(TranslateService);

  isLoading = true;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    // First, check for locale parameter and set it immediately
    this.route.queryParams.subscribe(params => {
      const locale = params['locale'];
      if (locale && ['en', 'uk'].includes(locale)) {

        // Set the locale and ensure translations are loaded
        this.translateService.setDefaultLang('en');
        this.translateService.use(locale);
      }
    });

    // Get the tenant ID and invite ID from the route
    this.route.paramMap.subscribe(params => {
      const tenantId = params.get('tenantId');
      const inviteId = params.get('inviteId');

      if (!tenantId || !inviteId) {
        this.showError('Invalid invitation link');
        return;
      }

      // Check if the user is already logged in
      if (this.authService.isLoggedIn()) {
        // If logged in, try to join the tenant
        this.joinTenant(tenantId, inviteId);
      } else {
        // If not logged in, store the invitation data and redirect to signup
        this.invitationStorageService.storeInvitation(tenantId, inviteId);

        // Pass the locale as query parameter when redirecting to signup
        const currentParams = this.route.snapshot.queryParams;
        const queryParams = currentParams['locale'] ? { locale: currentParams['locale'] } : {};

        this.router.navigate(['/signup'], { queryParams });
      }
    });
  }

  private joinTenant(tenantId: string, inviteId: string): void {
    this.isLoading = true;

    this.clientInvitationService.joinByInvitation(tenantId, inviteId).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'You have successfully joined the sport club!';
        this.invitationStorageService.clearStoredInvitation();
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 404) {
          this.errorMessage = 'The invitation was not found or has expired.';
        } else if (error.status === 400) {
          this.errorMessage = 'You are already a member of this sport club.';
        } else {
          this.errorMessage = 'An error occurred while processing your invitation. Please try again later.';
        }
      }
    });
  }

  private showError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
  }
}
