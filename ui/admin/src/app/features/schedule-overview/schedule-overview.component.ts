import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BookingCalendarComponent } from './components/booking-calendar/booking-calendar.component';
import { ScheduleService } from './services/schedule.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
  selector: 'app-schedule-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    BookingCalendarComponent
  ],
  template: `
    <div class="schedule-overview">
      <div class="header-section">
        <button class="return-button" (click)="onBack()">
          <mat-icon>arrow_back</mat-icon>
          <span>{{ 'common.back' | translate }}</span>
        </button>
        <h2>{{ 'location.schedule.pageTitle' | translate }}</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <app-booking-calendar
            [bookings]="currentBookings()"
            [capacity]="capacityInfo()"
            (monthChange)="onMonthChange($event)">
          </app-booking-calendar>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .schedule-overview {
      padding: 20px;
    }

    .header-section {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      gap: 24px;
      border-bottom: 1px solid #eee;
      padding-bottom: 24px;

      h2 {
        color: #2c3e50;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
    }

    .return-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      color: #3498db;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: transform 0.2s ease;
      }

      &:hover {
        background: rgba(52, 152, 219, 0.1);

        mat-icon {
          transform: translateX(-4px);
        }
      }
    }
  `]
})
export class ScheduleOverviewComponent {
  private scheduleService = inject(ScheduleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  currentBookings = signal<Booking[]>([]);
  capacityInfo = signal<CapacityInfo>({
    totalCapacity: 0,
    currentBookings: 0,
    utilizationPercentage: 0
  });

  constructor() {
    this.loadScheduleData(new Date());
  }

  private loadScheduleData(date: Date) {
    // Get all weeks in the month
    const weekRanges = this.getWeekRangesForMonth(date);
    
    console.log('Loading schedule data for month:', { date, weekRanges });

    this.route.params.subscribe(params => {
      const { tenantId, locationId } = params;
      console.log('Route params:', { tenantId, locationId });
      
      if (!tenantId || !locationId) {
        console.error('Missing tenantId or locationId in route params');
        return;
      }

      // Make parallel requests for each week in the month
      const weekRequests = weekRanges.map(({ startDate, endDate }) => 
        this.scheduleService.getScheduleView(tenantId, locationId, startDate, endDate)
      );

      forkJoin(weekRequests).subscribe({
        next: (weeklyBookings) => {
          // Combine all weekly bookings into one array
          const allBookings = weeklyBookings.flat();
          console.log('All bookings received:', allBookings);
          
          this.currentBookings.set(allBookings);
          this.capacityInfo.set(this.scheduleService.calculateCapacityInfo(allBookings));
        },
        error: (error) => {
          console.error('Error loading schedule data:', error);
        }
      });
    });
  }

  private getWeekRangesForMonth(date: Date): { startDate: Date; endDate: Date }[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Get first Monday of the calendar view (might be in previous month)
    const firstMonday = new Date(firstDayOfMonth);
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 system
    firstMonday.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    // Get last Sunday of the calendar view (might be in next month)
    const lastSunday = new Date(lastDayOfMonth);
    const lastDayOfWeek = (lastDayOfMonth.getDay() + 6) % 7;
    lastSunday.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfWeek));
    
    const weekRanges: { startDate: Date; endDate: Date }[] = [];
    const currentWeekStart = new Date(firstMonday);
    
    while (currentWeekStart <= lastSunday) {
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weekRanges.push({
        startDate: weekStart,
        endDate: weekEnd
      });
      
      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weekRanges;
  }

  onMonthChange(date: Date) {
    this.loadScheduleData(date);
  }

  onBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
