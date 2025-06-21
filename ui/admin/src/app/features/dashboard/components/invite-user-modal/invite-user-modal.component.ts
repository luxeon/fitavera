import { Component, EventEmitter, Output, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-invite-user-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, MatProgressSpinnerModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ],
  template: `
    <div class="modal-overlay">
      <div class="modal-content" @fadeInOut>
        <h2>{{ 'dashboard.clients.invite.title' | translate }}</h2>
        <div class="form-content">
          <div class="form-group">
            <label for="email">{{ 'dashboard.clients.invite.email' | translate }}</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="email"
              placeholder="{{ 'dashboard.clients.invite.emailPlaceholder' | translate }}"
              class="form-control"
              (keydown.enter)="onEnterPressed($any($event))"
              [disabled]="isLoading"
            >
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-button" (click)="onCancel()" [disabled]="isLoading">
            {{ 'common.cancel' | translate }}
          </button>
          <button 
            class="invite-button" 
            [disabled]="!isValidEmail() || isLoading"
            (click)="onInvite()">
            <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
            <span *ngIf="!isLoading">{{ 'dashboard.clients.invite.send' | translate }}</span>
            <span *ngIf="isLoading">{{ 'dashboard.clients.invite.sending' | translate }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 32px;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      h2 {
        margin: 0 0 24px;
        color: #2c3e50;
        font-size: 20px;
      }
    }

    .form-content {
      margin-bottom: 24px;
    }

    .form-group {
      width: 100%;

      label {
        display: block;
        margin-bottom: 8px;
        color: #2c3e50;
        font-size: 14px;
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #3498db;
        }

        &:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 100px;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .cancel-button {
      background: #e9ecef;
      color: #495057;

      &:hover:not(:disabled) {
        background: #dee2e6;
      }
    }

    .invite-button {
      background: #3498db;
      color: white;
      gap: 8px;

      &:hover:not(:disabled) {
        background: #2980b9;
      }

      .spinner {
        margin-right: 8px;
      }
    }
  `]
})
export class InviteUserModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() invite = new EventEmitter<string>();
  @Input() isLoading = false;

  email: string = '';

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (!this.isLoading) {
      this.onCancel();
    }
  }

  onEnterPressed(event: any): void {
    if (!this.isLoading && this.isValidEmail()) {
      event.preventDefault();
      this.onInvite();
    }
  }

  onCancel(): void {
    this.email = '';
    this.close.emit();
  }

  onInvite(): void {
    if (this.isValidEmail() && !this.isLoading) {
      this.invite.emit(this.email);
    }
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }
} 