import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InviteUserModalComponent } from '../invite-user-modal/invite-user-modal.component';
import { ClientPageItemResponse } from '../../../../core/services/user.service';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, TranslateModule, InviteUserModalComponent],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="clients-section" @fadeInOut>
      <div class="action-header">
        <h3>{{ 'dashboard.clients.title' | translate }}</h3>
        <button class="action-button" (click)="showInviteModal = true">
          {{ 'dashboard.clients.invite.button.text' | translate }}
        </button>
      </div>

      <div class="loading" *ngIf="isLoading">
        {{ 'common.loading' | translate }}
      </div>

      <div class="empty-state" *ngIf="!isLoading && !clients?.length">
        {{ 'dashboard.clients.empty' | translate }}
      </div>

      <div class="clients-list" *ngIf="!isLoading && clients?.length">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.name' | translate }}</th>
              <th>{{ 'common.email' | translate }}</th>
              <th>{{ 'common.phone' | translate }}</th>
              <th>{{ 'common.joinedAt' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let client of clients" 
                (click)="onClientClick(client.id)"
                class="clickable-row">
              <td>{{ client.firstName }} {{ client.lastName }}</td>
              <td>{{ client.email }}</td>
              <td>{{ client.phoneNumber || '-' }}</td>
              <td>{{ client.createdAt | date }}</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="totalPages > 1">
          <button
            class="pagination-button"
            [disabled]="currentPage === 0"
            (click)="onPageChange(currentPage - 1)">
            {{ 'common.previous' | translate }}
          </button>
          <span class="page-info">
            {{ 'common.page' | translate }} {{ currentPage + 1 }} {{ 'common.of' | translate }} {{ totalPages }}
          </span>
          <button
            class="pagination-button"
            [disabled]="currentPage === totalPages - 1"
            (click)="onPageChange(currentPage + 1)">
            {{ 'common.next' | translate }}
          </button>
        </div>
      </div>

      <app-invite-user-modal
        *ngIf="showInviteModal"
        [isLoading]="isInviting"
        (close)="showInviteModal = false"
        (invite)="onInviteUser($event)">
      </app-invite-user-modal>
    </div>
  `,
  styles: [`
    .clients-section {
      padding: 0;
    }

    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
      }
    }

    .action-button {
      padding: 8px 16px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;

      &:hover {
        background: #2980b9;
      }
    }

    .loading {
      text-align: center;
      padding: 48px;
      color: #6c757d;
      font-size: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;
      font-size: 16px;
    }

    .clients-list {
      margin-top: 24px;

      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }

        td {
          color: #2c3e50;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .clickable-row {
          cursor: pointer;
          transition: background-color 0.2s;

          &:hover {
            background: #f8f9fa;
          }
        }
      }
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;

      .pagination-button {
        padding: 8px 16px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        color: #2c3e50;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: #e9ecef;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .page-info {
        color: #6c757d;
        font-size: 14px;
      }
    }
  `]
})
export class ClientsComponent implements OnInit {
  @Input() tenantId!: string;

  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  showInviteModal = false;
  isLoading = false;
  isInviting = false;
  clients: ClientPageItemResponse[] = [];
  currentPage = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.loadClients();
  }

  onClientClick(clientId: string): void {
    this.router.navigate(['/tenants', this.tenantId, 'clients', clientId]);
  }

  loadClients(page: number = 0): void {
    this.isLoading = true;
    this.userService.getClients(this.tenantId, page)
      .subscribe({
        next: (response) => {
          this.clients = response.content;
          this.currentPage = response.number;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          this.isLoading = false;
        }
      });
  }

  onPageChange(page: number): void {
    this.loadClients(page);
  }

  onInviteUser(email: string): void {
    this.isInviting = true;
    this.userService.inviteUser(this.tenantId, email)
      .subscribe({
        next: () => {
          this.isInviting = false;
          this.showInviteModal = false;
          this.loadClients(this.currentPage);
          this.notificationService.showSuccess(
            this.translateService.instant('dashboard.clients.invite.success', { email })
          );
        },
        error: (error) => {
          console.error('Error inviting user:', error);
          this.isInviting = false;
          
          // Handle specific error cases
          if (error.status === 409) {
            this.notificationService.showError(
              this.translateService.instant('dashboard.clients.invite.error.alreadyExists', { email })
            );
          } else {
            this.notificationService.showError(
              this.translateService.instant('dashboard.clients.invite.error.general')
            );
          }
          
          // Close the modal to reset the loading state
          this.showInviteModal = false;
        }
      });
  }
}
