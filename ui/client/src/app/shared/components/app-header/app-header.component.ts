import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
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
            <span class="fitavera">Fitavera</span><span class="app">APP</span>
          </a>
        </div>

        <div class="actions-section">
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
        font-size: 1.7rem;
        font-weight: 800;
        letter-spacing: 1px;
        color: #fff;
        display: flex;
        align-items: center;
        text-decoration: none;
      }

      .app {
        margin-left: 4px;
        font-weight: 800;
        background: linear-gradient(90deg, #00eaff 0%, #00bfae 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
      }
    }

    .actions-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `]
})
export class AppHeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
