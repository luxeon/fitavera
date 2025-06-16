import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WeeklySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  activityType: string;
}

export interface Booking {
  date: Date;
  timeSlot: string;
  bookedCount: number;
  maxCapacity: number;
  activityType: string;
}

export interface CapacityInfo {
  totalCapacity: number;
  currentBookings: number;
  utilizationPercentage: number;
}

interface ScheduleViewRequest {
  dateFrom: string;
  dateTo: string;
}

interface ScheduleViewResponse {
  schedules: {
    id: string;
    startTime: string;
    endTime: string;
    clientCapacity: number;
    defaultTrainer: {
      id: string;
      firstName: string;
      lastName: string;
    };
    training: {
      id: string;
      name: string;
      description: string;
      durationMinutes: number;
    };
    sessions: {
      date: string;
      registeredClientsCount: number;
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getWeeklySchedule(): Observable<WeeklySchedule[]> {
    return this.http.get<WeeklySchedule[]>(`${this.apiUrl}/schedules/weekly`);
  }

  getCurrentBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings/current`).pipe(
      map(bookings => bookings.map(booking => ({
        ...booking,
        date: new Date(booking.date)
      })))
    );
  }

  updateSchedule(schedule: WeeklySchedule[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/schedules/weekly`, schedule);
  }

  getCapacityInfo(): Observable<CapacityInfo> {
    return this.http.get<CapacityInfo>(`${this.apiUrl}/bookings/capacity`);
  }

  getScheduleView(tenantId: string, locationId: string, startDate: Date, endDate: Date): Observable<Booking[]> {
    // Ensure the date range doesn't exceed 7 days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      // Adjust end date to be within 7 days of start date
      endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000));
    }

    const params = {
      dateFrom: this.formatDateForBackend(startDate),
      dateTo: this.formatDateForBackend(endDate)
    };

    const url = `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/schedules/view`;
    console.log('API Request:', { url, params, tenantId, locationId });

    return this.http.get<ScheduleViewResponse>(url, { params }).pipe(
      map(response => {
        console.log('API Response:', response);
        return this.convertToBookings(response);
      }),
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
  }

  private convertToBookings(response: ScheduleViewResponse): Booking[] {
    const bookings: Booking[] = [];
    
    response.schedules.forEach(schedule => {
      schedule.sessions.forEach(session => {
        bookings.push({
          date: new Date(session.date),
          timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
          bookedCount: session.registeredClientsCount,
          maxCapacity: schedule.clientCapacity,
          activityType: schedule.training.name
        });
      });
    });
    
    return bookings;
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('Date formatting:', { original: date, formatted });
    return formatted;
  }

  calculateCapacityInfo(bookings: Booking[]): CapacityInfo {
    const totalCapacity = bookings.reduce((sum, booking) => sum + booking.maxCapacity, 0);
    const currentBookings = bookings.reduce((sum, booking) => sum + booking.bookedCount, 0);
    const utilizationPercentage = totalCapacity > 0 ? (currentBookings / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      currentBookings,
      utilizationPercentage
    };
  }
} 