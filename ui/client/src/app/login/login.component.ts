import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../core/services/auth.service';
import { InvitationStorageService } from '../core/services/invitation-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invitationStorage = inject(InvitationStorageService);
  private translate = inject(TranslateService);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage = '';
  hasPendingInvitation = false;
  showInvitationMessage = false;
  showNoInvitationMessage = false;
  redirectedFromSignup = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Check if there's a pending invitation
    this.hasPendingInvitation = this.invitationStorage.hasPendingInvitation();
  }

  ngOnInit(): void {
    // Check if user is already logged in and redirect to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Check for invitation query parameter
    this.route.queryParams.subscribe(params => {
      if (params['invitation'] === 'pending') {
        this.showInvitationMessage = true;
        this.hasPendingInvitation = this.invitationStorage.hasPendingInvitation();
      }
      
      // Check for no-invitation error (only show if redirected from signup)
      if (params['error'] === 'no-invitation') {
        this.showNoInvitationMessage = true;
        this.redirectedFromSignup = true;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.handleSuccessfulLogin();
      },
      error: (error) => {
        this.isLoading = false;
        let key;
        if (error.status === 401) {
          key = 'login.errors.invalidCredentials';
        } else if (error.status === 403) {
          key = 'login.errors.forbidden';
        } else {
          key = 'login.errors.general';
        }

        this.translate.get(key).subscribe((res: string) => {
          this.errorMessage = res;
        });

        console.error('Login error:', error);
      }
    });
  }

  private handleSuccessfulLogin(): void {
    // Check if there's a pending invitation
    if (this.invitationStorage.hasPendingInvitation()) {
      const invitation = this.invitationStorage.getStoredInvitation();
      if (invitation) {
        // Navigate to the invitation handler component
        this.router.navigate([
          '/tenants', invitation.tenantId,
          'clients', 'signup', invitation.inviteId
        ]);
        return;
      }
    }

    // If no pending invitation, navigate to dashboard
    this.router.navigate(['/dashboard']);
  }
}
