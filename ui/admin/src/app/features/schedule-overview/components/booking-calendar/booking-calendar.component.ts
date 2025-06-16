import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Booking {
  date: Date;
  timeSlot: string;
  bookedCount: number;
  maxCapacity: number;
  activityType: string;
}

interface CapacityInfo {
  totalCapacity: number;
  currentBookings: number;
  utilizationPercentage: number;
}

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule
  ],
  template: `
    <div class="booking-calendar">
      <div class="calendar-header">
        <button mat-icon-button (click)="previousMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="calendar-grid">
        <div class="weekday-header" *ngFor="let day of weekDays">
          {{ day | translate }}
        </div>

        <div class="calendar-day"
             *ngFor="let day of calendarDays"
             [class.other-month]="!day.isCurrentMonth"
             [class.has-bookings]="getBookingsForDay(day.date).length > 0">
          <div class="day-number">{{ day.date.getDate() }}</div>

          <div class="booking-slots" *ngIf="getBookingsForDay(day.date).length > 0">
            <div class="booking-slot" *ngFor="let booking of getBookingsForDay(day.date)"
                 [matTooltip]="getBookingTooltip(booking)">
              <div class="time">{{ booking.timeSlot }}</div>
              <mat-progress-bar mode="determinate"
                              [value]="(booking.bookedCount / booking.maxCapacity) * 100"
                              [color]="getCapacityColor(booking)">
              </mat-progress-bar>
              <div class="capacity">
                {{ booking.bookedCount }}/{{ booking.maxCapacity }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="capacity-summary">
        <h3>{{ 'location.schedule.capacity.utilization' | translate }}</h3>
        <mat-progress-bar mode="determinate"
                        [value]="capacity.utilizationPercentage"
                        [color]="getOverallCapacityColor()">
        </mat-progress-bar>
        <div class="summary-details">
          <span>{{ 'location.schedule.capacity.booked' | translate }}: {{ capacity.currentBookings }}</span>
          <span>{{ 'location.schedule.capacity.total' | translate }}: {{ capacity.totalCapacity }}</span>
          <span>{{ 'location.schedule.capacity.utilization' | translate }}: {{ capacity.utilizationPercentage | number:'1.0-1' }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-calendar {
      padding: 20px;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }

    .weekday-header {
      text-align: center;
      font-weight: bold;
      padding: 8px;
    }

    .calendar-day {
      min-height: 120px;
      border: 1px solid #ddd;
      padding: 8px;
      position: relative;
    }

    .calendar-day.other-month {
      background-color: #f5f5f5;
      opacity: 0.7;
    }

    .calendar-day.has-bookings {
      background-color: #e3f2fd;
    }

    .day-number {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .booking-slots {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .booking-slot {
      background-color: white;
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    .time {
      font-size: 0.8em;
      color: #666;
    }

    .capacity {
      font-size: 0.8em;
      text-align: right;
      margin-top: 4px;
    }

    .capacity-summary {
      margin-top: 20px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .summary-details {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.9em;
    }
  `]
})
export class BookingCalendarComponent {
  @Input() bookings: Booking[] = [];
  @Input() capacity: CapacityInfo = {
    totalCapacity: 0,
    currentBookings: 0,
    utilizationPercentage: 0
  };
  @Output() monthChange = new EventEmitter<Date>();

  weekDays = [
    'schedule.days.monday',
    'schedule.days.tuesday',
    'schedule.days.wednesday',
    'schedule.days.thursday',
    'schedule.days.friday',
    'schedule.days.saturday',
    'schedule.days.sunday'
  ];
  currentDate = new Date();
  calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  constructor(private translateService: TranslateService) {
    this.generateCalendarDays();
  }

  get currentMonthName(): string {
    const currentLang = this.translateService.currentLang || 'en';
    return this.currentDate.toLocaleString(currentLang, { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
    this.monthChange.emit(new Date(this.currentDate));
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
    this.monthChange.emit(new Date(this.currentDate));
  }

  private generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Add days from previous month
    // Convert Sunday=0 to Monday=0 system: (day + 6) % 7
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    this.calendarDays = days;
  }

  getBookingsForDay(date: Date): Booking[] {
    return this.bookings.filter(booking =>
      booking.date.getDate() === date.getDate() &&
      booking.date.getMonth() === date.getMonth() &&
      booking.date.getFullYear() === date.getFullYear()
    );
  }

  getBookingTooltip(booking: Booking): string {
    const bookedText = this.translateService.instant('location.schedule.capacity.booked');
    return `${booking.activityType}\n${booking.timeSlot}\n${booking.bookedCount}/${booking.maxCapacity} ${bookedText}`;
  }

  getCapacityColor(booking: Booking): string {
    const percentage = (booking.bookedCount / booking.maxCapacity) * 100;
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }

  getOverallCapacityColor(): string {
    if (this.capacity.utilizationPercentage >= 90) return 'warn';
    if (this.capacity.utilizationPercentage >= 70) return 'accent';
    return 'primary';
  }
}
