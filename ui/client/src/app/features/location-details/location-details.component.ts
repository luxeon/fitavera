import { Component, OnInit, inject, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { ScheduleService } from '../../core/services/schedule.service';
import { SchedulePageItemResponse, VisitResponse, ScheduleViewResponse } from '../../core/models/schedule.model';
import { ActivatedRoute } from '@angular/router';
import { LocationService } from '../../core/services/location.service';
import { LocationPageItemResponse } from '../../core/models/location.model';
import { combineLatest, map } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VisitDialogComponent } from './visit-dialog.component';
import { VisitService } from '../../core/services/visit.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter, DateAdapter } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { MatCalendarCellCssClasses } from '@angular/material/datepicker';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PaymentHistoryComponent } from './payment-history.component';
import { TrainingService } from '../../core/services/training.service';
import { AuthService } from '../../core/services/auth.service';
import { CustomCalendarHeaderComponent } from '../../shared/components/custom-calendar-header/custom-calendar-header.component';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatCardModule,
    BreadcrumbComponent,
    PaymentHistoryComponent
  ],
  providers: [
    provideNativeDateAdapter()
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
    <div class="schedules-container">
      <app-breadcrumb
        [tenantId]="tenantId"
        [locationName]="location?.address ?? null"
      ></app-breadcrumb>

      <div class="header-section" @fadeInOut>
        <div class="location-header" *ngIf="location">
          <h2 class="schedules-title">{{ 'locationDetails.title' | translate }}</h2>
          <div class="location-info">
            <div class="address">{{ location.address }}</div>
            <div class="city-state">{{ location.city }}, {{ location.state }} {{ location.postalCode }}</div>
          </div>
        </div>

        <app-payment-history></app-payment-history>

        <div class="view-controls">
          <mat-button-toggle-group
            [value]="viewMode"
            (valueChange)="onViewModeChange($event)">
            <mat-button-toggle value="calendar">
              {{ 'schedules.calendar_view' | translate }}
            </mat-button-toggle>
            <mat-button-toggle value="weekly">
              {{ 'schedules.weekly_view' | translate }}
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <!-- Weekly View -->
      <div class="weekly-view" *ngIf="!isLoading && schedules?.length && viewMode === 'weekly'" @fadeInOut>
        <div class="day-columns">
          @for (day of daysOfWeek; track day) {
            <div class="day-column">
              <div class="day-header">{{ 'schedules.days.' + day | translate }}</div>
              <div class="day-schedules">
                @if (getDaySchedules(day).length) {
                  @for (schedule of getDaySchedules(day); track schedule.id) {
                    <div class="schedule-card"
                         [class.has-visit]="hasVisit(schedule.id)"
                         [class.purchase-required]="!hasVisitOnDate(schedule.id, selectedDate) && isPurchaseRequired(schedule)"
                         [class.no-available-slots]="hasNoAvailableSlotsForDay(schedule.id, day) && !hasVisit(schedule.id)"
                         [class.disabled]="isScheduleDisabledForDay(schedule, day)"
                         (click)="!isScheduleDisabledForDay(schedule, day) && openVisitDialog(schedule, day)">
                      <div class="schedule-info">
                        <div class="time-slot">
                          {{ schedule.startTime | slice:0:5 }} - {{ schedule.endTime | slice:0:5 }}
                        </div>
                        <div class="workout-name" *ngIf="schedule.trainingName">
                          {{ schedule.trainingName }}
                        </div>
                        <div class="trainer-name" *ngIf="schedule.defaultTrainerFullName">
                          {{ schedule.defaultTrainerFullName }}
                        </div>
                        <div class="capacity">
                          {{ 'schedules.capacity' | translate }}: {{ schedule.clientCapacity }}
                        </div>

                        <!-- Available slots information -->
                        <div class="available-slots" *ngIf="scheduleViewData">
                          <div class="slots-info">
                            <span class="available" [class.no-slots]="hasNoAvailableSlotsForDay(schedule.id, day) && !hasVisit(schedule.id)">
                              {{ 'schedules.available_slots' | translate }}: {{ getAvailableSlotsForDay(schedule.id, day).available }}
                            </span>
                            <span class="registered" *ngIf="getAvailableSlotsForDay(schedule.id, day).registered > 0">
                              {{ 'schedules.registered' | translate }}: {{ getAvailableSlotsForDay(schedule.id, day).registered }}
                            </span>
                          </div>
                        </div>

                        @if (!hasVisitOnDate(schedule.id, selectedDate) && isPurchaseRequired(schedule)) {
                          <div class="purchase-required-badge">
                            <mat-icon color="warn">shopping_cart</mat-icon>
                            {{ 'schedules.purchase_required' | translate }}
                          </div>
                        }

                        @if (hasNoAvailableSlotsForDay(schedule.id, day) && !hasVisit(schedule.id)) {
                          <div class="no-slots-badge">
                            <mat-icon color="warn">event_busy</mat-icon>
                            {{ 'schedules.no_available_slots' | translate }}
                          </div>
                        }

                        <!-- Show booked dates for this schedule and day -->
                        @if (getBookedDates(schedule.id, day).length) {
                          <div class="visit-info">
                            <div class="visit-badge">
                              <mat-icon color="primary">event_available</mat-icon>
                              {{ 'schedules.booked' | translate }}
                            </div>
                            <div class="booked-dates">
                              @for (date of getBookedDates(schedule.id, day); track date) {
                                <div class="booked-date">{{ date | date:'MMM d, yyyy':undefined:translate.currentLang }}</div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                } @else {
                  <div class="no-schedules">
                    {{ 'schedules.no_schedules_for_day' | translate }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Calendar View -->
      <div class="calendar-view" *ngIf="!isLoading && schedules?.length && viewMode === 'calendar'" @fadeInOut>
        <mat-card class="calendar-card">
          <mat-calendar
            *ngIf="showCalendar"
            [selected]="selectedDate"
            (selectedChange)="onDateSelected($event)"
            [dateClass]="dateClass"
            [dateFilter]="dateFilter"
            [headerComponent]="customHeader">
          </mat-calendar>
        </mat-card>

        <div class="selected-date-schedules">
          <h3 class="selected-date-header">
            {{ selectedDate | date:'fullDate':undefined:translate.currentLang }}
          </h3>
          <div class="schedules-list">
            @if (getSchedulesForDate(selectedDate).length) {
              @for (schedule of getSchedulesForDate(selectedDate); track schedule.id) {
                <div class="schedule-card"
                     [class.has-visit]="hasVisitOnDate(schedule.id, selectedDate)"
                     [class.purchase-required]="!hasVisitOnDate(schedule.id, selectedDate) && isPurchaseRequired(schedule)"
                     [class.no-available-slots]="hasNoAvailableSlots(schedule.id, selectedDate) && !hasVisitOnDate(schedule.id, selectedDate)"
                     [class.disabled]="isScheduleDisabled(schedule, selectedDate)"
                     (click)="!isScheduleDisabled(schedule, selectedDate) && openVisitDialog(schedule, getDayName(selectedDate.getDay()))">
                  <div class="schedule-info">
                    <div class="time-slot">
                      {{ schedule.startTime | slice:0:5 }} - {{ schedule.endTime | slice:0:5 }}
                    </div>
                    <div class="workout-name" *ngIf="schedule.trainingName">
                      {{ schedule.trainingName }}
                    </div>
                    <div class="trainer-name" *ngIf="schedule.defaultTrainerFullName">
                      {{ schedule.defaultTrainerFullName }}
                    </div>
                    <div class="capacity">
                      {{ 'schedules.capacity' | translate }}: {{ schedule.clientCapacity }}
                    </div>

                    <!-- Available slots information -->
                    <div class="available-slots" *ngIf="scheduleViewData">
                      <div class="slots-info">
                        <span class="available" [class.no-slots]="hasNoAvailableSlots(schedule.id, selectedDate) && !hasVisitOnDate(schedule.id, selectedDate)">
                          {{ 'schedules.available_slots' | translate }}: {{ getAvailableSlots(schedule.id, selectedDate) }}
                        </span>
                        <span class="registered" *ngIf="getRegisteredClientsCount(schedule.id, selectedDate) > 0">
                          {{ 'schedules.registered' | translate }}: {{ getRegisteredClientsCount(schedule.id, selectedDate) }}
                        </span>
                      </div>
                    </div>

                    @if (!hasVisitOnDate(schedule.id, selectedDate) && isPurchaseRequired(schedule)) {
                      <div class="purchase-required-badge">
                        <mat-icon color="warn">shopping_cart</mat-icon>
                        {{ 'schedules.purchase_required' | translate }}
                      </div>
                    }

                    @if (hasNoAvailableSlots(schedule.id, selectedDate) && !hasVisitOnDate(schedule.id, selectedDate)) {
                      <div class="no-slots-badge">
                        <mat-icon color="warn">event_busy</mat-icon>
                        {{ 'schedules.no_available_slots' | translate }}
                      </div>
                    }

                    @if (hasVisitOnDate(schedule.id, selectedDate)) {
                      <div class="visit-info">
                        <div class="visit-badge">
                          <mat-icon color="primary">event_available</mat-icon>
                          {{ 'schedules.booked' | translate }}
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            } @else {
              <div class="no-schedules">
                {{ 'schedules.no_schedules_for_day' | translate }}
              </div>
            }
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && !schedules?.length" @fadeInOut>
        {{ 'schedules.noSchedules' | translate }}
      </div>

      <div class="loading" *ngIf="isLoading">
        {{ 'schedules.loading' | translate }}
      </div>
    </div>
  `,
  styles: [`
    .schedules-container {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px 8px;
      }
    }

    .header-section {
      margin-bottom: 24px;

      @media (max-width: 768px) {
        margin-bottom: 16px;
      }
    }

    .location-header {
      margin-bottom: 24px;

      .schedules-title {
        margin: 0 0 16px;
        color: #2c3e50;
        font-size: 24px;
        font-weight: 500;

        @media (max-width: 768px) {
          font-size: 20px;
          margin-bottom: 12px;
        }
      }

      .location-info {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;

        @media (max-width: 768px) {
          padding: 12px;
        }

        .address {
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 4px;
          font-size: 16px;

          @media (max-width: 768px) {
            font-size: 14px;
          }
        }

        .city-state {
          color: #495057;
          font-size: 14px;

          @media (max-width: 768px) {
            font-size: 12px;
          }
        }
      }
    }

    .view-controls {
      margin-bottom: 24px;
      display: flex;
      justify-content: flex-start;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;

      @media (max-width: 768px) {
        margin-bottom: 16px;
        justify-content: center;
      }

      ::ng-deep {
        .mat-button-toggle-group {
          border: none;
          background: #f8f9fa;
          border-radius: 4px;
          overflow: hidden;
          white-space: nowrap;
        }

        .mat-button-toggle {
          background: transparent;
          border: none;
          color: #6c757d;
          line-height: 32px;
          height: 32px;

          .mat-button-toggle-label-content {
            line-height: 32px;
            padding: 0 16px;

            @media (max-width: 768px) {
              padding: 0 12px;
              font-size: 14px;
            }
          }

          &.mat-button-toggle-checked {
            background: #3498db;
            color: white;
          }
        }
      }
    }

    .weekly-view {
      .day-columns {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 16px;
        margin-bottom: 24px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;

        @media (max-width: 1024px) {
          grid-template-columns: repeat(4, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .day-column {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          min-width: 0;

          @media (max-width: 768px) {
            padding: 12px;
          }

          .day-header {
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 16px;
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 2px solid #e9ecef;

            @media (max-width: 768px) {
              margin-bottom: 12px;
              font-size: 14px;
            }
          }

          .day-schedules {
            display: flex;
            flex-direction: column;
            gap: 12px;

            @media (max-width: 768px) {
              gap: 8px;
            }
          }
        }
      }

      .schedule-card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        word-break: break-word;

        @media (max-width: 768px) {
          padding: 12px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        &.has-visit {
          border: 2px solid #2196f3;
        }

        &.purchase-required {
          border: 2px solid #f44336;
        }

        &.no-available-slots {
          border: 2px solid #ff9800;
          background-color: #fff3e0;
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;

          &:hover {
            transform: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
        }

        .schedule-info {
          .time-slot {
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.3;

            @media (max-width: 768px) {
              font-size: 13px;
              margin-bottom: 6px;
            }
          }

          .workout-name {
            color: #2c3e50;
            margin-bottom: 4px;
            font-size: 14px;

            @media (max-width: 768px) {
              font-size: 13px;
            }
          }

          .trainer-name {
            color: #6c757d;
            font-size: 13px;
            margin-bottom: 4px;

            @media (max-width: 768px) {
              font-size: 12px;
            }
          }

          .capacity {
            color: #6c757d;
            font-size: 13px;

            @media (max-width: 768px) {
              font-size: 12px;
            }
          }

          .available-slots {
            margin-top: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #28a745;

            @media (max-width: 768px) {
              margin-top: 6px;
              padding: 6px;
            }

            .slots-info {
              display: flex;
              flex-direction: column;
              gap: 4px;

              .available {
                color: #28a745;
                font-weight: 500;
                font-size: 13px;

                @media (max-width: 768px) {
                  font-size: 12px;
                }

                &.no-slots {
                  color: #f44336;
                }
              }

              .registered {
                color: #6c757d;
                font-size: 12px;

                @media (max-width: 768px) {
                  font-size: 11px;
                }
              }
            }
          }
        }
      }

      .no-schedules {
        text-align: center;
        color: #6c757d;
        padding: 16px;
        background: white;
        border-radius: 8px;
        font-size: 14px;

        @media (max-width: 768px) {
          padding: 12px;
          font-size: 13px;
        }
      }
    }

    .visit-info {
      margin-top: 10px;
      border-top: 1px solid #eee;
      padding-top: 8px;

      @media (max-width: 768px) {
        margin-top: 8px;
        padding-top: 6px;
      }
    }

    .visit-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2196f3;
      font-size: 13px;

      @media (max-width: 768px) {
        font-size: 12px;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;

        @media (max-width: 768px) {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .purchase-required-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f44336;
      font-size: 13px;
      margin-top: 8px;
      padding: 4px 8px;
      background-color: #ffebee;
      border-radius: 4px;

      @media (max-width: 768px) {
        font-size: 12px;
        margin-top: 6px;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;

        @media (max-width: 768px) {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .booked-dates {
      margin-top: 4px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .booked-date {
      font-size: 13px;
      color: #2196f3;
      background: #e3f2fd;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
      width: 100%;

      @media (max-width: 768px) {
        font-size: 12px;
        padding: 3px 6px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;

      @media (max-width: 768px) {
        padding: 24px;
        font-size: 14px;
      }
    }

    .loading {
      text-align: center;
      padding: 32px;
      color: #6c757d;

      @media (max-width: 768px) {
        padding: 24px;
        font-size: 14px;
      }
    }

    .calendar-view {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 24px;
      margin-top: 24px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .calendar-card {
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background: white;
        width: fit-content;
        height: fit-content;

        @media (max-width: 768px) {
          width: 100%;
        }

        ::ng-deep {
          .mat-calendar {
            width: 100%;
            min-width: 280px;
          }

          .mat-calendar-body-label {
            display: none;
          }

          .mat-calendar-body-cell.has-events::after {
            background-color: #2196f3;
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }

          .mat-calendar-body-cell.has-visits::after {
            background-color: #4caf50;
            width: 8px;
            height: 8px;
          }

          .mat-calendar-body-selected {
            background-color: #2196f3;
            color: white;
          }

          .mat-calendar-body-today:not(.mat-calendar-body-selected) {
            border-color: #2196f3;
          }
        }
      }

      .selected-date-schedules {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        height: fit-content;

        .selected-date-header {
          margin: 0 0 16px;
          color: #2c3e50;
          font-size: 20px;
          font-weight: 500;
          padding-bottom: 12px;
          border-bottom: 2px solid #e9ecef;
        }

        .schedules-list {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
      }

      .schedule-card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e9ecef;
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        &.has-visit {
          border: 2px solid #2196f3;
        }

        &.purchase-required {
          border: 2px solid #f44336;
        }

        &.no-available-slots {
          border: 2px solid #ff9800;
          background-color: #fff3e0;
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;

          &:hover {
            transform: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
        }

        .schedule-info {
          .time-slot {
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.3;
          }

          .workout-name {
            color: #2c3e50;
            margin-bottom: 4px;
            font-size: 14px;
          }

          .trainer-name {
            color: #6c757d;
            font-size: 13px;
            margin-bottom: 4px;
          }

          .capacity {
            color: #6c757d;
            font-size: 13px;
          }

          .available-slots {
            margin-top: 8px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #28a745;

            @media (max-width: 768px) {
              margin-top: 6px;
              padding: 6px;
            }

            .slots-info {
              display: flex;
              flex-direction: column;
              gap: 4px;

              .available {
                color: #28a745;
                font-weight: 500;
                font-size: 13px;

                @media (max-width: 768px) {
                  font-size: 12px;
                }

                &.no-slots {
                  color: #f44336;
                }
              }

              .registered {
                color: #6c757d;
                font-size: 12px;

                @media (max-width: 768px) {
                  font-size: 11px;
                }
              }
            }
          }
        }

        .visit-info {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e9ecef;
        }

        .visit-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #2196f3;
          font-size: 13px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .no-schedules {
        text-align: center;
        color: #6c757d;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        font-size: 14px;
      }
    }

    .no-slots-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f44336;
      font-size: 13px;
      margin-top: 8px;
      padding: 4px 8px;
      background-color: #ffebee;
      border-radius: 4px;

      @media (max-width: 768px) {
        font-size: 12px;
        margin-top: 6px;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;

        @media (max-width: 768px) {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }
  `]
})
export class LocationDetailsComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private locationService = inject(LocationService);
  private visitService = inject(VisitService);
  private trainingService = inject(TrainingService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  protected translate = inject(TranslateService);
  private dateAdapter = inject(DateAdapter<any>);
  private cdr = inject(ChangeDetectorRef);

  customHeader = CustomCalendarHeaderComponent;
  showCalendar = true;

  schedules: SchedulePageItemResponse[] | null = null;
  scheduleViewData: ScheduleViewResponse | null = null;
  location: LocationPageItemResponse | null = null;
  visits: VisitResponse[] = [];
  isLoading = false;
  tenantId = '';
  locationId = '';
  clientId = '';
  @Input() viewMode: 'weekly' | 'calendar' = 'calendar';
  @Output() viewModeChange = new EventEmitter<'weekly' | 'calendar'>();
  @ViewChild(MatCalendar) calendar!: MatCalendar<Date>;

  // Map to track which trainings require purchase
  trainingsPurchaseRequired: { [trainingId: string]: boolean } = {};

  // Date filter to prevent selecting past dates
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  readonly daysOfWeek = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ];

  private currentDay: string = '';

  selectedDate: Date = new Date();

  ngOnInit(): void {
    this.setCalendarLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.setCalendarLocale(event.lang);
      // Force calendar to re-render to apply new locale for day/month names
      this.showCalendar = false;
      this.cdr.detectChanges();
      this.showCalendar = true;
    });

    this.route.params.subscribe(params => {
      this.tenantId = params['tenantId'];
      this.locationId = params['locationId'];

      // Get the current user's ID
      const userClaims = this.authService.getUserClaims();
      if (userClaims) {
        this.clientId = userClaims.id;
      }

      this.loadData();
    });
  }

  loadData(): void {
    this.isLoading = true;

    const currentYear = this.selectedDate.getFullYear();
    const currentMonth = this.selectedDate.getMonth() + 1;

    combineLatest([
      this.locationService.getLocations(this.tenantId).pipe(
        map(response => response.content.find(loc => loc.id === this.locationId) || null)
      ),
      this.scheduleService.getSchedules(this.tenantId, this.locationId),
      this.visitService.getUserVisits(this.tenantId, this.locationId),
      this.visitService.getSchedulesViewForMonth(this.tenantId, this.locationId, currentYear, currentMonth)
    ]).subscribe({
      next: ([location, schedules, visits, scheduleViewData]) => {
        this.location = location;
        this.schedules = schedules || [];
        this.visits = visits;
        this.scheduleViewData = scheduleViewData;
        // Clear the cache when visits are updated
        this.bookedDatesCache = {};

        // Fetch training details for each schedule
        if (this.schedules.length > 0) {
          this.fetchTrainingDetails();
        }

        // Check credits for each training if client ID is available
        if (this.clientId && this.schedules.length > 0) {
          this.checkTrainingCredits();
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Handle error - you might want to show a snackbar/toast here
      }
    });
  }

  /**
   * Fetch training details for each schedule to get the training name
   */
  private fetchTrainingDetails(): void {
    if (!this.schedules) return;

    // Get unique training IDs from schedules
    const trainingIds = new Set<string>();
    this.schedules.forEach(schedule => {
      if (schedule.trainingId) {
        trainingIds.add(schedule.trainingId);
      }
    });

    // Fetch training details for each unique training ID
    trainingIds.forEach(trainingId => {
      this.trainingService.getTraining(this.tenantId, trainingId)
        .subscribe({
          next: (training) => {
            // Update trainingName for all schedules with this trainingId
            this.schedules?.forEach(schedule => {
              if (schedule.trainingId === trainingId) {
                schedule.trainingName = training.name;
              }
            });
          },
          error: (error) => {
            console.error(`Error fetching training details for training ID ${trainingId}:`, error);
          }
        });
    });
  }

  /**
   * Check if the user has credits for each training
   */
  private checkTrainingCredits(): void {
    if (!this.schedules || !this.clientId) return;

    // Get unique training IDs from schedules
    const trainingIds = new Set<string>();
    this.schedules.forEach(schedule => {
      if (schedule.trainingId) {
        trainingIds.add(schedule.trainingId);
      }
    });

    // Reset the purchase required map
    this.trainingsPurchaseRequired = {};

    // Check credits for each training
    trainingIds.forEach(trainingId => {
      this.trainingService.getTrainingCreditsSummary(this.tenantId, this.clientId, trainingId)
        .subscribe({
          next: (response) => {
            // If expiresAt is null or remainingTrainings is 0, purchase is required
            this.trainingsPurchaseRequired[trainingId] = !response.expiresAt || response.remainingTrainings <= 0;
          },
          error: () => {
            // If there's an error, assume purchase is required
            this.trainingsPurchaseRequired[trainingId] = true;
          }
        });
    });
  }

  onViewModeChange(mode: 'weekly' | 'calendar'): void {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  onDateSelected(date: Date | null): void {
    if (date) {
      this.selectedDate = date;

      // Load schedule view data for the new month if it's different
      const newYear = date.getFullYear();
      const newMonth = date.getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (newYear !== currentYear || newMonth !== currentMonth) {
        this.loadScheduleViewDataForMonth(newYear, newMonth);
      }
    }
  }

  dateClass = (date: Date): MatCalendarCellCssClasses => {
    const dayName = this.getDayName(date.getDay());
    const hasSchedules = this.getDaySchedules(dayName).length > 0;

    // Mark days that have visits for the user
    const hasVisit = this.visits.some(visit => {
      const visitDate = new Date(visit.date);
      return this.isSameDay(visitDate, date);
    });

    if (hasVisit) {
      return 'has-events has-visits';
    } else if (hasSchedules) {
      return 'has-events';
    }

    return '';
  }

  getSchedulesForDate(date: Date): SchedulePageItemResponse[] {
    if (!date || !this.schedules) return [];

    const dayName = this.getDayName(date.getDay());
    this.currentDay = dayName; // Set the current day based on the selected date
    return this.getDaySchedules(dayName);
  }

  getDaySchedules(day: string): SchedulePageItemResponse[] {
    if (!this.schedules) return [];
    this.currentDay = day;
    return this.schedules
      .filter(schedule => schedule.daysOfWeek.includes(day.toUpperCase()))
      .sort((a, b) => {
        // First sort by start time
        const startTimeComparison = a.startTime.localeCompare(b.startTime);
        // If start times are equal, sort by end time
        if (startTimeComparison === 0) {
          return a.endTime.localeCompare(b.endTime);
        }
        return startTimeComparison;
      });
  }

  hasVisit(scheduleId: string): boolean {
    if (!this.visits || !this.schedules) return false;

    const dayName = this.currentDay.toUpperCase();

    return this.visits.some(visit => {
      if (visit.scheduleId !== scheduleId) return false;

      const visitDate = new Date(visit.date);
      const visitDayName = this.getDayName(visitDate.getDay());

      return visitDayName === dayName;
    });
  }

  /**
   * Checks if a schedule has a booked visit on a specific date
   * Used specifically for calendar view to ensure accurate display of booked status
   */
  hasVisitOnDate(scheduleId: string, date: Date): boolean {
    if (!this.visits || !this.schedules) return false;

    return this.visits.some(visit => {
      if (visit.scheduleId !== scheduleId) return false;

      const visitDate = new Date(visit.date);
      return this.isSameDay(visitDate, date);
    });
  }

  /**
   * Utility method to compare if two dates represent the same day
   * regardless of time component
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Cache for booked dates to prevent ExpressionChangedAfterItHasBeenCheckedError
  private bookedDatesCache: { [key: string]: Date[] } = {};

  getBookedDates(scheduleId: string, day: string): Date[] {
    // Create a cache key using scheduleId and day
    const cacheKey = `${scheduleId}_${day}`;

    // Return cached result if available
    if (this.bookedDatesCache[cacheKey]) {
      return this.bookedDatesCache[cacheKey];
    }

    if (!this.visits) {
      this.bookedDatesCache[cacheKey] = [];
      return [];
    }

    const dayName = day.toUpperCase();

    let dates = this.visits
      .filter(visit => {
        if (visit.scheduleId !== scheduleId) return false;

        const visitDate = new Date(visit.date);
        const visitDayName = this.getDayName(visitDate.getDay());

        return visitDayName === dayName;
      })
      .map(visit => new Date(visit.date))
      .sort((a, b) => a.getTime() - b.getTime());

    // Cache the result
    this.bookedDatesCache[cacheKey] = dates;

    return dates;
  }

  getDayName(dayIndex: number): string {
    // Convert JavaScript day index (0=Sunday, 1=Monday, etc.) to our Monday-first format
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dayMap[dayIndex];
  }

  getVisit(scheduleId: string): VisitResponse | undefined {
    return this.visits.find(visit =>
      visit.scheduleId === scheduleId && visit.status === 'CONFIRMED'
    );
  }

  getVisitsForSchedule(scheduleId: string): VisitResponse[] {
    if (!this.visits) return [];
    return this.visits.filter(visit => visit.scheduleId === scheduleId);
  }

  /**
   * Check if a schedule requires purchase (no credits available)
   */
  isPurchaseRequired(schedule: SchedulePageItemResponse): boolean {
    if (!schedule.trainingId) return false;
    return this.trainingsPurchaseRequired[schedule.trainingId];
  }

  openVisitDialog(schedule: SchedulePageItemResponse, selectedDay: string): void {
    const dialogData: any = {
      schedule,
      tenantId: this.tenantId,
      locationId: this.locationId,
      selectedDay
    };

    if (this.viewMode === 'calendar') {
      // In calendar view, we want to only show/book visits for the specific selected date
      dialogData.selectedDate = new Date(this.selectedDate);
      // Filter visits to only include the ones for this specific schedule and date
      dialogData.visits = this.visits.filter(visit => {
        if (visit.scheduleId !== schedule.id) return false;
        const visitDate = new Date(visit.date);
        return this.isSameDay(visitDate, this.selectedDate);
      });
    } else {
      // In weekly view, show all visits for the day of week
      dialogData.visits = this.getBookedDates(schedule.id, selectedDay).map(date => {
        const visit = this.visits.find(v =>
          v.scheduleId === schedule.id &&
          new Date(v.date).getTime() === date.getTime()
        );
        return visit!;
      });
    }

    const dialogRef = this.dialog.open(VisitDialogComponent, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // Refresh visits after successful booking/cancellation
        this.visitService.getUserVisits(this.tenantId, this.locationId).subscribe(
          visits => {
            this.visits = visits;
            // Clear the cache when visits are updated
            this.bookedDatesCache = {};

            // Force refresh the calendar view by creating a new date object
            // This ensures the calendar markers update immediately
            if (this.viewMode === 'calendar') {
              const currentDate = new Date(this.selectedDate.getTime());
              setTimeout(() => {
                this.selectedDate = currentDate;
                this.refreshCalendar();
              });
            }
          }
        );
      }
    });
  }

  private refreshCalendar(): void {
    // Wait for the next change detection cycle
    setTimeout(() => {
      if (this.calendar) {
        // Force the calendar to re-render
        this.calendar.updateTodaysDate();
      }
    });
  }

  private setCalendarLocale(lang: string): void {
    const materialLocale = lang === 'en' ? 'en-GB' : lang;
    this.dateAdapter.setLocale(materialLocale);
  }

  /**
   * Get available slots for a specific schedule on a specific date
   */
  getAvailableSlots(scheduleId: string, date: Date): number {
    if (!this.scheduleViewData) return 0;

    const schedule = this.scheduleViewData.schedules.find(s => s.id === scheduleId);
    if (!schedule) return 0;

    const dateString = this.formatDateForComparison(date);
    const session = schedule.sessions.find(s => s.date === dateString);

    if (!session) {
      // No sessions for this date, all slots are available
      return schedule.clientCapacity;
    }

    return Math.max(0, schedule.clientCapacity - session.registeredClientsCount);
  }

  /**
   * Get available slots for a specific schedule on a specific day of the week
   * This is used for weekly view to show average availability
   */
  getAvailableSlotsForDay(scheduleId: string, day: string): { available: number; total: number; registered: number } {
    if (!this.scheduleViewData) return { available: 0, total: 0, registered: 0 };

    const schedule = this.scheduleViewData.schedules.find(s => s.id === scheduleId);
    if (!schedule) return { available: 0, total: 0, registered: 0 };

    // Get all sessions for this schedule
    const sessions = schedule.sessions;
    let totalRegistered = 0;
    let sessionCount = 0;

    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const sessionDay = this.getDayName(sessionDate.getDay());

      if (sessionDay === day) {
        totalRegistered += session.registeredClientsCount;
        sessionCount++;
      }
    });

    const totalCapacity = schedule.clientCapacity * sessionCount;
    const available = Math.max(0, totalCapacity - totalRegistered);

    return {
      available,
      total: totalCapacity,
      registered: totalRegistered
    };
  }

  /**
   * Get registered clients count for a specific schedule on a specific date
   */
  getRegisteredClientsCount(scheduleId: string, date: Date): number {
    if (!this.scheduleViewData) return 0;

    const schedule = this.scheduleViewData.schedules.find(s => s.id === scheduleId);
    if (!schedule) return 0;

    const dateString = this.formatDateForComparison(date);
    const session = schedule.sessions.find(s => s.date === dateString);

    return session?.registeredClientsCount || 0;
  }

  /**
   * Check if a schedule has sessions on a specific date
   */
  hasSessionsOnDate(scheduleId: string, date: Date): boolean {
    if (!this.scheduleViewData) return false;

    const schedule = this.scheduleViewData.schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const dateString = this.formatDateForComparison(date);
    return schedule.sessions.some(s => s.date === dateString);
  }

  /**
   * Format date for comparison with backend date format (yyyy-MM-dd)
   */
  private formatDateForComparison(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Load schedule view data for a specific month
   */
  loadScheduleViewDataForMonth(year: number, month: number): void {
    this.visitService.getSchedulesViewForMonth(this.tenantId, this.locationId, year, month)
      .subscribe({
        next: (scheduleViewData) => {
          this.scheduleViewData = scheduleViewData;
        },
        error: (error) => {
          console.error('Error loading schedule view data:', error);
        }
      });
  }

  /**
   * Check if a schedule has no available slots on a specific date
   */
  hasNoAvailableSlots(scheduleId: string, date: Date): boolean {
    return this.getAvailableSlots(scheduleId, date) === 0;
  }

  /**
   * Check if a schedule has no available slots on a specific day of the week
   */
  hasNoAvailableSlotsForDay(scheduleId: string, day: string): boolean {
    return this.getAvailableSlotsForDay(scheduleId, day).available === 0;
  }

  /**
   * Check if a schedule should be disabled (no available slots or purchase required)
   */
  isScheduleDisabled(schedule: SchedulePageItemResponse, date: Date): boolean {
    // Allow clicking if user has already booked this schedule on this date (for cancellation)
    if (this.hasVisitOnDate(schedule.id, date)) {
      return false;
    }
    
    // Disable if no available slots or purchase required
    return this.hasNoAvailableSlots(schedule.id, date) || this.isPurchaseRequired(schedule);
  }

  /**
   * Check if a schedule should be disabled for weekly view
   */
  isScheduleDisabledForDay(schedule: SchedulePageItemResponse, day: string): boolean {
    // Allow clicking if user has already booked this schedule on this day (for cancellation)
    if (this.hasVisit(schedule.id)) {
      return false;
    }
    
    // Disable if no available slots or purchase required
    return this.hasNoAvailableSlotsForDay(schedule.id, day) || this.isPurchaseRequired(schedule);
  }
}
