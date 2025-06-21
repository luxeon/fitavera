import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <div class="toolbar-container">
        <div class="logo-section">
          <a routerLink="/dashboard" class="app-title">
            <span class="fitavera">Fitavera</span><span class="crm">CRM</span>
          </a>
        </div>

        <div class="actions-section">
          <div class="user-info" *ngIf="userDetails">
            <span class="user-name">{{ userDetails.firstName || ('dashboard.user' | translate) }}</span>
          </div>
          
          <app-language-switcher></app-language-switcher>

          <button mat-icon-button
                  (click)="logout()"
                  aria-label="Logout"
                  [matTooltip]="'header.logout' | translate">
            <mat-icon>exit_to_app</mat-icon>
          </button>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .toolbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0 16px;
    }

    .logo-section {
      display: flex;
      align-items: center;

      a {
        text-decoration: none;
        color: inherit;
      }

      .app-title {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 1px;
        font-family: 'Inter', 'Roboto', Arial, sans-serif;
        display: flex;
        align-items: center;
      }
      .fitavera {
        color: #2c3e50;
        font-weight: 700;
      }
      .crm {
        margin-left: 2px;
        background: linear-gradient(90deg, #3498db 0%, #00bfae 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
        font-weight: 700;
      }
    }

    .actions-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-info {
      display: flex;
      align-items: center;
      
      .user-name {
        color: #2c3e50;
        font-weight: 500;
        font-size: 14px;
        margin-right: 8px;
      }
    }
  `]
})
export class AppHeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get userDetails() {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
