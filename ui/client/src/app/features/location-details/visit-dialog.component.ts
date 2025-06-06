import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SchedulePageItemResponse, VisitResponse } from '../../core/models/schedule.model';
import { VisitService } from '../../core/services/visit.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

export interface VisitDialogData {
  schedule: SchedulePageItemResponse;
  visits: VisitResponse[];
  tenantId: string;
  locationId: string;
  selectedDay: string;
  selectedDate?: Date;
}

@Component({
  selector: 'app-visit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatIconModule
  ],
  providers: [
    provideNativeDateAdapter(),
    {
      provide: MAT_DATE_LOCALE,
      useFactory: (translate: TranslateService) => translate.currentLang || 'en',
      deps: [TranslateService]
    }
  ],
  template: `
    <div class="visit-dialog">
      <h2 mat-dialog-title>{{ schedule.trainingName }}</h2>

      <mat-dialog-content>
        <div class="schedule-details">
          <p class="time">{{ schedule.startTime | slice:0:5 }} - {{ schedule.endTime | slice:0:5 }}</p>
          <p class="trainer" *ngIf="schedule.defaultTrainerFullName">
            {{ 'schedules.trainer' | translate }}: {{ schedule.defaultTrainerFullName }}
          </p>
          <p class="capacity">
            {{ 'schedules.capacity' | translate }}: {{ schedule.clientCapacity }}
          </p>
          @if (isCalendarMode && selectedDate) {
            <p class="selected-date">
              {{ selectedDate | date:'fullDate':undefined:translate.currentLang }}
            </p>
          }
        </div>

        @if (errorMessage) {
          <div class="error-message">{{ errorMessage }}</div>
        }

        <!-- If there are no existing visits, show date picker -->
        @if (!hasVisits()) {
          @if (isCalendarMode) {
            <p class="availability-message">{{ 'schedules.no_visits_booked' | translate }}</p>
          } @else {
            <mat-form-field appearance="fill" class="date-picker">
              <mat-label>{{ 'schedules.choose_date' | translate }}</mat-label>
              <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate"
                     [min]="minDate" [max]="maxDate"
                     [matDatepickerFilter]="dateFilter">
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          }
        }

        <!-- If there are visits, show them in a list -->
        @if (hasVisits()) {
          <div class="visits-list">
            <h3>{{ 'schedules.your_visits' | translate }}</h3>
            <mat-list>
              @for (visit of visits; track visit.id) {
                <div class="visit-list-row">
                  <span class="visit-date">{{ visit.date | date:'longDate':undefined:translate.currentLang }}</span>
                  <button mat-icon-button color="warn"
                          [disabled]="cancellingVisitId === visit.id"
                          (click)="cancelVisit(visit.id)">
                    @if (cancellingVisitId === visit.id) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>delete</mat-icon>
                    }
                  </button>
                </div>
                <mat-divider></mat-divider>
              }
            </mat-list>
          </div>

          <!-- Option to book more dates - only show in weekly view -->
          <div class="book-more-container" *ngIf="!isCalendarMode">
            <button mat-button color="primary" (click)="onBookMoreDates()" *ngIf="!showDatePicker">
              {{ 'schedules.book_more_dates' | translate }}
            </button>

            @if (showDatePicker) {
              <mat-form-field appearance="fill" class="date-picker">
                <mat-label>{{ 'schedules.choose_date' | translate }}</mat-label>
                <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate"
                      [min]="minDate" [max]="maxDate"
                      [matDatepickerFilter]="dateFilter">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="null">
          {{ 'common.close' | translate }}
        </button>

        @if ((!hasVisits() || showDatePicker) && selectedDate) {
          <button mat-raised-button color="primary"
                  [disabled]="isCreating || !selectedDate"
                  (click)="createVisit()">
            @if (isCreating) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              {{ 'schedules.book_visit' | translate }}
            }
          </button>
        }
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .visit-dialog {
      min-width: 400px;
      padding: 16px;
    }

    .schedule-details {
      margin-bottom: 24px;

      .time {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .trainer, .capacity {
        color: #666;
        margin: 4px 0;
      }

      .selected-date {
        margin-top: 12px;
        font-weight: 500;
        color: #2196f3;
        padding: 4px 8px;
        background: #e3f2fd;
        border-radius: 4px;
        display: inline-block;
      }
    }

    .date-picker {
      width: 100%;
    }

    .visits-list {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 10px;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .visit-list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      min-height: 48px;
      width: 100%;
      box-sizing: border-box;

      .visit-date {
        font-size: 14px;
        color: #2c3e50;
        flex: 1;
      }

      button[mat-icon-button] {
        margin-left: 8px;
      }
    }

    .error-message {
      background-color: #fdecea;
      color: #d32f2f;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    mat-divider {
      margin: 0;
    }

    .book-more-container {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    mat-dialog-actions {
      padding-top: 16px;

      button {
        min-width: 120px;

        mat-spinner {
          margin: 0 auto;
        }
      }
    }

    .availability-message {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #555;
      text-align: center;
      margin-bottom: 16px;
    }
  `]
})
export class VisitDialogComponent {
  private visitService = inject(VisitService);
  private dialogRef = inject(MatDialogRef<VisitDialogComponent>);
  private dateAdapter = inject(DateAdapter<Date>);
  protected translate = inject(TranslateService);

  schedule: SchedulePageItemResponse;
  visits: VisitResponse[] = [];
  tenantId: string;
  locationId: string;
  selectedDay: string;

  selectedDate: Date | null = null;
  isCreating = false;
  cancellingVisitId: string | null = null;
  showDatePicker = false;
  errorMessage: string | null = null;

  // Allow visits for next 4 weeks
  minDate = new Date();
  maxDate = new Date(new Date().setDate(new Date().getDate() + 28));

  // Map of day names to day numbers (0 = Sunday, 6 = Saturday to match JavaScript's getDay())
  private readonly dayMap: { [key: string]: number } = {
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6,
    'SUNDAY': 0
  };

  // Flag to determine if we're in calendar view mode
  isCalendarMode = false;

  constructor(@Inject(MAT_DIALOG_DATA) data: VisitDialogData) {
    this.schedule = data.schedule;
    this.visits = data.visits || [];
    this.tenantId = data.tenantId;
    this.locationId = data.locationId;
    this.selectedDay = data.selectedDay;
    this.isCalendarMode = !!data.selectedDate;

    // Set first day of week to Monday
    this.dateAdapter.setLocale('en-GB'); // en-GB uses Monday as first day
    this.dateAdapter.getFirstDayOfWeek = () => 1;

    if (this.isCalendarMode && data.selectedDate) {
      // In calendar mode, we use the exact date selected
      this.selectedDate = data.selectedDate;
    } else if (!this.hasVisits()) {
      // In weekly mode without visits, find the next available date
      this.selectedDate = this.findClosestAvailableDate();
    }
  }

  hasVisits(): boolean {
    return this.visits.length > 0;
  }

  // Filter to only allow selection of days that match the selected day
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;

    // In calendar mode with specific date, we just need the selected date
    if (this.isCalendarMode) {
      // Allow only the specific date
      const currentDate = this.selectedDate;
      if (currentDate) {
        return date.getFullYear() === currentDate.getFullYear() &&
               date.getMonth() === currentDate.getMonth() &&
               date.getDate() === currentDate.getDate();
      }
    }

    // In weekly mode, allow all days that match the day of week
    const dayOfWeek = date.getDay(); // JavaScript's getDay() returns 0-6 (Sunday-Saturday)
    return this.dayMap[this.selectedDay] === dayOfWeek;
  };

  private findClosestAvailableDate(): Date {
    const today = new Date();
    const result = new Date(today);

    // Get the day number for the selected day
    const selectedDayNumber = this.dayMap[this.selectedDay];

    // Find the closest day that matches the selected day
    while (result.getDay() !== selectedDayNumber || result < today) {
      result.setDate(result.getDate() + 1);
      if (result > this.maxDate) {
        // If we've gone past the max date, start over from today
        result.setTime(today.getTime());
        break;
      }
    }

    return result;
  }

  createVisit(): void {
    if (!this.selectedDate) return;

    this.errorMessage = null;
    // Format date for backend and ensure it's in UTC
    const date = new Date(this.selectedDate);
    // Ensure we're working with the local date to match the schedule's day
    const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];

    this.isCreating = true;
    this.visitService.createVisit(
      this.tenantId,
      this.locationId,
      this.schedule.id,
      {
        scheduleId: this.schedule.id,
        date: formattedDate
      }
    ).pipe(
      finalize(() => {
        this.isCreating = false;
        this.showDatePicker = false;
      })
    ).subscribe({
      next: (visit) => {
        this.visits.push(visit);
        this.selectedDate = null;
        this.errorMessage = null;
        // Close dialog with success result to trigger refresh
        this.dialogRef.close({ success: true, action: 'create', visit });
      },
      error: (error) => {
        console.error('Visit creation error:', error);
        if (error.error?.message?.includes('Client training credit not found for client')) {
          this.errorMessage = this.translate.instant('schedules.errors.noCredits');
        } else if (error.error?.message?.includes('Client capacity exceeded')) {
          this.errorMessage = this.translate.instant('schedules.errors.capacityExceeded');
        } else if (error.error?.message?.includes('Date of week doesn\'t match')) {
          this.errorMessage = this.translate.instant('schedules.errors.invalidDate');
        } else if (error.error?.message?.includes('Unable to book visit: you should pay for the training first.')) {
          this.errorMessage = this.translate.instant('schedules.errors.shouldPayFOrVisit');
        } else if (error.error?.message === "Validation failed") {
          this.errorMessage = error.error?.errors[0]?.message ?? this.translate.instant('schedules.errors.generic');
        } else {
          this.errorMessage = this.translate.instant('schedules.errors.generic');
        }
      }
    });
  }

  cancelVisit(visitId: string): void {
    if (!visitId) return;

    this.errorMessage = null;
    this.cancellingVisitId = visitId;
    const visitToCancel = this.visits.find(v => v.id === visitId);

    if (!visitToCancel) {
      this.cancellingVisitId = null;
      return;
    }

    this.visitService.cancelVisit(
      this.tenantId,
      this.locationId,
      this.schedule.id,
      visitId
    ).pipe(
      finalize(() => this.cancellingVisitId = null)
    ).subscribe({
      next: () => {
        // Remove the cancelled visit from the list
        this.visits = this.visits.filter(v => v.id !== visitId);

        // Close dialog with success result to trigger refresh
        this.dialogRef.close({ success: true, action: 'cancel', visitId });
      },
      error: (error) => {
        console.error('Visit cancellation error:', error);
        this.errorMessage = this.translate.instant('schedules.errors.generic');
      }
    });
  }

  onBookMoreDates(): void {
    this.showDatePicker = true;
    this.selectedDate = this.findClosestAvailableDate();
    this.errorMessage = null;
  }
}
