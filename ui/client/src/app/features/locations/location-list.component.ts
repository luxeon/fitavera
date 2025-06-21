import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LocationService } from '../../core/services/location.service';
import { Page } from '../../core/models/page.model';
import { LocationPageItemResponse } from '../../core/models/location.model';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PaymentHistoryComponent } from '../../shared/components/payment-history/payment-history.component';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    BreadcrumbComponent,
    PaymentHistoryComponent
  ],
  template: `
    <div class="locations-container">
      <app-breadcrumb [tenantId]="tenantId"></app-breadcrumb>

      <h2 class="locations-title">{{ 'locations.title' | translate }}</h2>

      <app-payment-history></app-payment-history>

      <div class="locations-grid" *ngIf="!isLoading && locations?.content?.length">
        <div
          class="location-card"
          *ngFor="let location of locations?.content"
          (click)="viewSchedules(location.id)"
        >
          <div class="location-info">
            <div class="address">{{ location.address }}</div>
            <div class="city-state">{{ location.city }}, {{ location.state }} {{ location.postalCode }}</div>
            <div class="country">{{ location.country }}</div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && !locations?.content?.length">
        {{ 'locations.noLocations' | translate }}
      </div>

      <div class="loading" *ngIf="isLoading">
        {{ 'locations.loading' | translate }}
      </div>

      <div class="pagination" *ngIf="locations && locations.totalPages > 1">
        <button
          [disabled]="locations.first"
          (click)="loadPage(locations.number - 1)">
          {{ 'common.previous' | translate }}
        </button>
        <span class="page-info">
          {{ 'common.page' | translate }} {{ locations.number + 1 }} {{ 'common.of' | translate }} {{ locations.totalPages }}
        </span>
        <button
          [disabled]="locations.last"
          (click)="loadPage(locations.number + 1)">
          {{ 'common.next' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .locations-container {
      padding: 24px;
    }

    .locations-title {
      margin: 0 0 24px;
      color: #2c3e50;
      font-size: 24px;
      font-weight: 500;
    }

    .locations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .location-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .location-info {
        .address {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .city-state {
          color: #495057;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .country {
          color: #6c757d;
          font-size: 14px;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      background: #f8f9fa;
      border-radius: 12px;
      color: #6c757d;
      font-size: 16px;
    }

    .loading {
      text-align: center;
      padding: 24px;
      color: #6c757d;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;

      button {
        padding: 8px 16px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;

        &:hover:not(:disabled) {
          background: #e9ecef;
          border-color: #ced4da;
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
export class LocationListComponent implements OnInit {
  private locationService = inject(LocationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  locations: Page<LocationPageItemResponse> | null = null;
  isLoading = false;
  tenantId = '';

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.params['tenantId'];
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.isLoading = true;
    this.locationService.getLocations(this.tenantId, page)
      .subscribe({
        next: (response) => {
          this.locations = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  viewSchedules(locationId: string): void {
    this.router.navigate(['/tenant', this.tenantId, 'locations', locationId]);
  }
}
