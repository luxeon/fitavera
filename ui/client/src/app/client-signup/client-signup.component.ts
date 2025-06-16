import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ClientSignupService } from '../core/services/client-signup.service';
import { InvitationStorageService } from '../core/services/invitation-storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-client-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './client-signup.component.html',
  styleUrls: ['./client-signup.component.scss']
})
export class ClientSignupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private clientSignupService = inject(ClientSignupService);
  private invitationStorage = inject(InvitationStorageService);
  private translateService = inject(TranslateService);

  tenantId: string = '';
  inviteId: string = '';

  signupForm: FormGroup;

  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;
  hidePassword = true;
  hideConfirmPassword = true;

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

    // First check URL parameters
    this.route.paramMap.subscribe(params => {
      const tenantIdParam = params.get('tenantId');
      const inviteIdParam = params.get('inviteId');

      if (tenantIdParam) this.tenantId = tenantIdParam;
      if (inviteIdParam) this.inviteId = inviteIdParam;
    });

    // Then check if we have stored invitation data
    if (!this.route.snapshot.paramMap.has('tenantId') && this.invitationStorage.hasPendingInvitation()) {
      const invitation = this.invitationStorage.getStoredInvitation();
      if (invitation) {
        this.tenantId = invitation.tenantId;
        this.inviteId = invitation.inviteId;
      }
    }

    // Initialize the form
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      phoneNumber: ['', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required]],
      locale: ['en', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Update form locale value if we detected it from URL
    const urlLocale = this.route.snapshot.queryParams['locale'];
    if (urlLocale && ['en', 'uk'].includes(urlLocale)) {
      this.signupForm.patchValue({ locale: urlLocale });
    }

    // Subscribe to phone number changes to auto-remove spaces and braces
    this.signupForm.get('phoneNumber')?.valueChanges.subscribe(value => {
      if (value) {
        const cleanValue = value.replace(/[\s()]/g, '');
        if (cleanValue !== value) {
          this.signupForm.patchValue({ phoneNumber: cleanValue }, { emitEvent: false });
        }
      }
    });
  }

  constructor() {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      phoneNumber: ['', [Validators.pattern('^\\+?[1-9]\\d{1,14}$')]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required]],
      locale: ['en', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.signupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = null;

      const formValue = this.signupForm.value;
      const signupRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber || null,
        password: formValue.password,
        locale: formValue.locale
      };

      this.clientSignupService.signup(this.tenantId, this.inviteId, signupRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.invitationStorage.clearStoredInvitation();

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;

          if (error.status === 400) {
            this.submitError = 'Invalid registration data. Please check your inputs.';
          } else if (error.status === 404) {
            this.submitError = 'The invitation was not found or has expired.';
          } else if (error.status === 409) {
            this.submitError = 'An account with this email already exists.';
          } else {
            this.submitError = 'An error occurred during registration. Please try again.';
          }
        }
      });
    }
  }

  // Helper method to mark all controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Helper getters for form validation
  get firstNameControl() { return this.signupForm.get('firstName'); }
  get lastNameControl() { return this.signupForm.get('lastName'); }
  get phoneNumberControl() { return this.signupForm.get('phoneNumber'); }
  get passwordControl() { return this.signupForm.get('password'); }
  get confirmPasswordControl() { return this.signupForm.get('confirmPassword'); }
  get localeControl() { return this.signupForm.get('locale'); }
}
