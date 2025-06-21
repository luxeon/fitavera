import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { animate, style, transition, trigger } from '@angular/animations';
import { PaymentService, PaymentPageItemResponse, PaymentStatus, TrainingCreditsSummaryResponse } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Page } from '../../../core/models/page.model';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="payment-history-container" @fadeInOut>
      <mat-expansion-panel
        [expanded]="isExpanded"
        (opened)="panelOpened()"
        (closed)="isExpanded = false">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon class="panel-icon">receipt</mat-icon>
            {{ 'payment.history.title' | translate }}
          </mat-panel-title>
          <mat-panel-description>
            {{ isExpanded ? ('payment.history.hide' | translate) : ('payment.history.show' | translate) }}
          </mat-panel-description>
        </mat-expansion-panel-header>

        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!isLoading && (!payments || !payments.content?.length)" class="empty-state">
          {{ 'payment.history.empty' | translate }}
        </div>

        <div *ngIf="!isLoading && payments && payments.content?.length" class="payment-table-container">
          <table mat-table [dataSource]="payments.content" class="payment-table">
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>{{ 'payment.history.date' | translate }}</th>
              <td mat-cell *matCellDef="let payment">{{ payment.createdAt | date:'mediumDate':undefined:translate.currentLang }}</td>
            </ng-container>

            <!-- Training Column -->
            <ng-container matColumnDef="training">
              <th mat-header-cell *matHeaderCellDef>{{ 'payment.history.training' | translate }}</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.training?.name || 'Unknown Training' }}
              </td>
            </ng-container>

            <!-- Units Column -->
            <ng-container matColumnDef="units">
              <th mat-header-cell *matHeaderCellDef>{{ 'payment.history.units' | translate }}</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.trainingsCount }}
                <span *ngIf="payment.validDays" class="validity">
                  ({{ 'payment.history.valid_for' | translate }} {{ payment.validDays }} {{ 'payment.history.days' | translate }})
                </span>
                <div *ngIf="getEffectiveStatus(payment) === 'COMPLETED' && !isExpired(payment) && hasCreditsSummary(payment)" class="remaining-credits">
                  <span class="credits-info">
                    {{ 'payment.history.remaining' | translate }}: {{ getCreditsSummary(payment)?.remainingTrainings }}
                  </span>
                  <span class="credits-info">
                    {{ 'payment.history.expires' | translate }}: {{ getCreditsSummary(payment)?.expiresAt | date:'mediumDate' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Amount Column -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>{{ 'payment.history.amount' | translate }}</th>
              <td mat-cell *matCellDef="let payment">{{ payment.price | currency:payment.currency:'symbol' }}</td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ 'payment.history.status' | translate }}</th>
              <td mat-cell *matCellDef="let payment">
                <mat-chip
                  [color]="getStatusColor(getEffectiveStatus(payment))"
                  [matTooltip]="'payment.status.' + getEffectiveStatus(payment).toLowerCase() | translate"
                  disableRipple>
                  {{ 'payment.status.' + getEffectiveStatus(payment).toLowerCase() | translate }}
                </mat-chip>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            *ngIf="payments.totalPages > 1"
            [length]="payments.totalElements"
            [pageSize]="pageSize"
            [pageIndex]="currentPage"
            [pageSizeOptions]="[5, 10, 25]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .payment-history-container {
      margin-top: 24px;
      margin-bottom: 24px;
    }

    .panel-icon {
      margin-right: 8px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #6c757d;
    }

    .payment-table-container {
      overflow-x: auto;
    }

    .payment-table {
      width: 100%;
    }

    .validity {
      color: #6c757d;
      font-size: 0.9em;
      margin-left: 4px;
    }

    .remaining-credits {
      margin-top: 4px;
      font-size: 0.85em;
      color: #3498db;
    }

    .credits-info {
      display: block;
      margin-top: 2px;
      font-weight: 500;
    }

    ::ng-deep .mat-mdc-chip.mat-mdc-standard-chip {
      --mdc-chip-label-text-color: white;
      --mdc-chip-elevated-container-color: #3498db;
      height: 24px;
      font-size: 12px;
    }

    ::ng-deep .mat-primary.mat-mdc-chip.mat-mdc-standard-chip {
      --mdc-chip-elevated-container-color: #2ecc71;
    }

    ::ng-deep .mat-warn.mat-mdc-chip.mat-mdc-standard-chip {
      --mdc-chip-elevated-container-color: #e74c3c;
    }

    ::ng-deep .mat-accent.mat-mdc-chip.mat-mdc-standard-chip {
      --mdc-chip-elevated-container-color: #f39c12;
    }

    ::ng-deep .mat-muted.mat-mdc-chip.mat-mdc-standard-chip {
      --mdc-chip-elevated-container-color: #95a5a6;
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  public readonly translate = inject(TranslateService);

  isExpanded = false;
  isLoading = false;
  tenantId = '';
  clientId = '';

  payments: Page<PaymentPageItemResponse> | null = null;
  displayedColumns: string[] = ['date', 'training', 'units', 'amount', 'status'];
  currentPage = 0;
  pageSize = 5;

  // Store training credits summary by training ID
  creditsSummaries: Map<string, TrainingCreditsSummaryResponse> = new Map();

  ngOnInit(): void {
    const claims = this.authService.getUserClaims();
    if (claims) {
      // Get the UUID id from JWT claims
      this.clientId = claims.id;

      // Get tenant ID from route params
      this.route.params.subscribe(params => {
        if (params['tenantId']) {
          this.tenantId = params['tenantId'];
        }
      });
    }
  }

  panelOpened(): void {
    this.isExpanded = true;
    this.fetchPayments();
  }

  fetchPayments(): void {
    if (!this.tenantId || !this.clientId) return;

    this.isLoading = true;
    this.paymentService.getPayments(this.tenantId, this.clientId, this.currentPage, this.pageSize)
      .pipe(
        switchMap(response => {
          this.payments = response;

          // Reset credits summaries map
          this.creditsSummaries.clear();

          // Create an array of observables for fetching training credits summaries
          // Only for non-expired COMPLETED payments
          const creditRequests =
            response.content
              .filter(payment =>
                payment.status === PaymentStatus.COMPLETED &&
                !this.isExpired(payment) &&
                payment.training?.id
              )
              .map(payment =>
                this.paymentService.getTrainingCreditsSummary(
                  this.tenantId,
                  this.clientId,
                  payment.training.id
                ).pipe(
                  map(summary => [payment.training.id, summary] as [string, TrainingCreditsSummaryResponse]),
                  catchError(() => of(null as unknown as [string, TrainingCreditsSummaryResponse]))
                )
              );

          // If there are no credit requests, return empty array
          if (creditRequests.length === 0) {
            return of([]);
          }

          // Execute all requests in parallel
          return forkJoin(creditRequests);
        })
      )
      .subscribe({
        next: (summaries) => {
          // Store summaries in map
          summaries.forEach(item => {
            if (item) {
              const [trainingId, summary] = item;
              this.creditsSummaries.set(trainingId, summary);
            }
          });
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.fetchPayments();
  }

  /**
   * Checks if a payment is expired based on its creation date and validity period
   */
  isExpired(payment: PaymentPageItemResponse): boolean {
    // Only check for expiration on COMPLETED payments with validDays
    if (payment.status !== PaymentStatus.COMPLETED || !payment.validDays) {
      return false;
    }

    const createdAt = new Date(payment.createdAt);
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + payment.validDays);

    return expiresAt < new Date();
  }

  getEffectiveStatus(payment: PaymentPageItemResponse): PaymentStatus {
    if (payment.status === PaymentStatus.COMPLETED && this.isExpired(payment)) {
      return PaymentStatus.EXPIRED;
    }
    return payment.status;
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED: return 'primary';
      case PaymentStatus.PENDING: return 'accent';
      case PaymentStatus.CANCELED: return 'warn';
      case PaymentStatus.EXPIRED: return 'muted';
      default: return '';
    }
  }

  /**
   * Checks if credits summary exists for a payment
   */
  hasCreditsSummary(payment: PaymentPageItemResponse): boolean {
    return !!payment.training?.id && this.creditsSummaries.has(payment.training.id);
  }

  /**
   * Gets credits summary for a payment
   */
  getCreditsSummary(payment: PaymentPageItemResponse): TrainingCreditsSummaryResponse | undefined {
    return payment.training?.id ? this.creditsSummaries.get(payment.training.id) : undefined;
  }
} 