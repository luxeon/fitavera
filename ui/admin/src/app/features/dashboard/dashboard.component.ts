import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, UserDetailsResponse } from '../../core/services/auth.service';
import { TenantService, TenantResponse } from '../../core/services/tenant.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocationsComponent } from './components/locations/locations.component';
import { TrainerListComponent } from './components/trainer/components/trainer-list.component';
import { TrainerService } from '../../core/services/trainer.service';
import { firstValueFrom } from 'rxjs';
import { ClientsComponent } from './components/clients/clients.component';
import { TariffsComponent } from './components/tariffs/tariffs.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { TrainerDialogComponent } from './components/trainer/components/trainer-dialog.component';
import { WorkoutsComponent } from './components/workouts/workouts.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LocationsComponent,
    TrainerListComponent,
    ClientsComponent,
    TariffsComponent,
    WorkoutsComponent,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-content">
        <div *ngIf="tenantDetails" class="fitness-club">
          <span class="label">{{ 'dashboard.fitnessClub.label' | translate }}</span>
          <h2>{{ tenantDetails.name }}</h2>
        </div>

        <mat-tab-group *ngIf="tenantDetails" [selectedIndex]="getSelectedTabIndex()" (selectedIndexChange)="onTabChange($event)">
          <mat-tab [label]="'dashboard.tabs.locations' | translate">
            <div class="tab-content">
              <app-locations [tenantId]="tenantDetails.id"></app-locations>
            </div>
          </mat-tab>

          <mat-tab [label]="'dashboard.tabs.workouts' | translate">
            <div class="tab-content">
              <app-workouts [tenantId]="tenantDetails.id"></app-workouts>
            </div>
          </mat-tab>

          <mat-tab [label]="'dashboard.tabs.trainers' | translate">
            <div class="tab-content">
              <div class="action-header">
                <h3>{{ 'dashboard.trainers.title' | translate }}</h3>
                <button class="action-button" (click)="onAddTrainer()">
                  {{ 'dashboard.trainers.add' | translate }}
                </button>
              </div>
              <div class="loading" *ngIf="isLoadingTrainers">
                {{ 'common.loading' | translate }}
              </div>
              <div class="empty-state" *ngIf="!isLoadingTrainers && !trainers?.length">
                {{ 'dashboard.trainers.empty' | translate }}
              </div>
              <app-trainer-list
                *ngIf="!isLoadingTrainers && trainers?.length"
                [trainers]="trainers"
                [currentPage]="currentTrainerPage"
                [totalPages]="totalTrainerPages"
                [tenantId]="tenantDetails.id"
                (pageChange)="onTrainerPageChange($event)"
                (trainerDeleted)="loadTrainers(tenantDetails.id)">
              </app-trainer-list>
            </div>
          </mat-tab>

          <mat-tab [label]="'dashboard.tabs.clients' | translate">
            <div class="tab-content">
              <app-clients [tenantId]="tenantDetails.id"></app-clients>
            </div>
          </mat-tab>

          <mat-tab [label]="'dashboard.tabs.tariffs' | translate">
            <div class="tab-content">
              <app-tariffs [tenantId]="tenantDetails.id"></app-tariffs>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      padding: 40px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .dashboard-content {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 1200px;
      margin: 0 auto;

      p {
        color: #7f8c8d;
        font-size: 18px;
        margin: 0;
      }
    }

    .fitness-club {
      margin: 0 0 2rem;

      .label {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
        display: block;
      }

      h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.5rem;
      }
    }

    .tab-content {
      padding: 24px 0;
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
      padding: 1rem;
      color: #6c757d;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;
      font-size: 16px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tenantService = inject(TenantService);
  private readonly trainerService = inject(TrainerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  userDetails: UserDetailsResponse | null = null;
  tenantDetails: TenantResponse | null = null;
  trainers: any[] = [];
  isLoadingTrainers = false;
  currentTrainerPage = 0;
  totalTrainerPages = 0;

  activeTab = 'locations';

  tabs = [
    { id: 'locations', label: 'dashboard.tabs.locations' },
    { id: 'workouts', label: 'dashboard.tabs.workouts' },
    { id: 'trainers', label: 'dashboard.tabs.trainers' },
    { id: 'clients', label: 'dashboard.tabs.clients' },
    { id: 'tariffs', label: 'dashboard.tabs.tariffs' }
  ];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userDetails = this.authService.getCurrentUser();

    this.tenantService.getAllForAuthenticatedUser()
      .subscribe(tenants => {
        if (tenants.length > 0) {
          this.tenantService.getById(tenants[0].id)
            .subscribe(tenant => {
              this.tenantDetails = tenant;
              const tab = this.route.snapshot.queryParams['tab'];
              if (tab && this.tabs.some(t => t.id === tab)) {
                this.setActiveTab(tab, true);
              } else {
                this.setActiveTab('locations', false); // Don't update URL during initialization
              }
            });
        }
      });
  }

  getSelectedTabIndex(): number {
    const tab = this.route.snapshot.queryParams['tab'];
    const index = this.tabs.findIndex(t => t.id === tab);
    return index >= 0 ? index : 0;
  }

  onTabChange(index: number): void {
    const tabId = this.tabs[index].id;
    this.setActiveTab(tabId, true);
  }

  setActiveTab(tabId: string, updateUrl: boolean = true): void {
    this.activeTab = tabId;
    if (this.tenantDetails) {
      if (tabId === 'trainers' && !this.trainers.length) {
        this.loadTrainers(this.tenantDetails.id);
      }
    }
    // Update URL with the new tab only when requested
    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: tabId },
        queryParamsHandling: 'merge'
      });
    }
  }

  async loadTrainers(tenantId: string, page: number = 0): Promise<void> {
    this.isLoadingTrainers = true;
    try {
      const response = await firstValueFrom(this.trainerService.getTrainers(tenantId, page));
      this.trainers = response.content;
      this.currentTrainerPage = response.number;
      this.totalTrainerPages = response.totalPages;
    } catch (error) {
      console.error('Failed to load trainers:', error);
    } finally {
      this.isLoadingTrainers = false;
    }
  }

  onTrainerPageChange(page: number): void {
    if (this.tenantDetails) {
      this.loadTrainers(this.tenantDetails.id, page);
    }
  }

  onAddTrainer(): void {
    if (this.tenantDetails) {
      const dialogRef = this.dialog.open(TrainerDialogComponent, {
        data: { tenantId: this.tenantDetails.id },
        width: '500px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result?.success && this.tenantDetails) {
          this.snackBar.open(
            this.translate.instant('trainer.create.success'),
            this.translate.instant('common.close'),
            { duration: 3000 }
          );
          this.loadTrainers(this.tenantDetails.id);
        }
      });
    }
  }
}
