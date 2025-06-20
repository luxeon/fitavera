import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, expand, reduce, map, forkJoin, of } from 'rxjs';
import {
  VisitRequest,
  VisitResponse,
  UserVisit,
  PageResponse,
  ScheduleViewResponse
} from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  createVisit(tenantId: string, locationId: string, scheduleId: string, request: VisitRequest): Observable<VisitResponse> {
    return this.http.post<VisitResponse>(
      `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/schedules/${scheduleId}/visits`,
      request
    );
  }

  cancelVisit(tenantId: string, locationId: string, scheduleId: string, visitId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/schedules/${scheduleId}/visits/${visitId}`
    );
  }

  getUserVisits(tenantId: string, locationId: string): Observable<UserVisit[]> {
    return this.http.get<PageResponse<UserVisit>>(
      `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/visits`
    ).pipe(
      map(response => response.content)
    );
  }

  getScheduleVisits(scheduleId: string, date: string): Observable<VisitResponse[]> {
    return this.http.get<PageResponse<VisitResponse>>(`${this.apiUrl}/visits/schedule/${scheduleId}`, {
      params: { date }
    }).pipe(
      map(response => response.content)
    );
  }

  findAllVisits(
    tenantId: string,
    locationId: string,
    dateFrom: string,
    dateTo: string,
    pageSize: number = 20
  ): Observable<VisitResponse[]> {
    // Initial request
    return this.getVisitsPage(tenantId, locationId, dateFrom, dateTo, 0, pageSize).pipe(
      // Use expand to handle pagination
      expand((response) => {
        // If this is the last page, stop
        if (response.last) {
          return [];
        }
        // Otherwise, get the next page
        return this.getVisitsPage(tenantId, locationId, dateFrom, dateTo, response.number + 1, pageSize);
      }),
      // Reduce all pages into a single array of visits
      reduce((acc: VisitResponse[], page) => {
        return [...acc, ...page.content];
      }, [] as VisitResponse[])
    );
  }

  private getVisitsPage(
    tenantId: string,
    locationId: string,
    dateFrom: string,
    dateTo: string,
    page: number,
    size: number
  ): Observable<PageResponse<VisitResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);

    return this.http.get<PageResponse<VisitResponse>>(
      `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/visits`,
      { params }
    );
  }

  getSchedulesView(
    tenantId: string,
    locationId: string,
    dateFrom: string,
    dateTo: string
  ): Observable<ScheduleViewResponse> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);

    return this.http.get<ScheduleViewResponse>(
      `${this.apiUrl}/tenants/${tenantId}/locations/${locationId}/schedules/view`,
      { params }
    );
  }

  getSchedulesViewForMonth(
    tenantId: string,
    locationId: string,
    year: number,
    month: number
  ): Observable<ScheduleViewResponse> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    const requests: Observable<ScheduleViewResponse>[] = [];
    let currentDate = new Date(startDate);

    // Create requests for 7-day chunks
    while (currentDate <= endDate) {
      const chunkEndDate = new Date(currentDate);
      chunkEndDate.setDate(chunkEndDate.getDate() + 6);

      // Ensure we don't exceed the end of the month
      if (chunkEndDate > endDate) {
        chunkEndDate.setTime(endDate.getTime());
      }

      const dateFrom = this.formatDate(currentDate);
      const dateTo = this.formatDate(chunkEndDate);

      requests.push(this.getSchedulesView(tenantId, locationId, dateFrom, dateTo));

      // Move to next chunk
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // If no requests, return empty response
    if (requests.length === 0) {
      return of({ schedules: [] });
    }

    // Combine all responses
    return forkJoin(requests).pipe(
      map(responses => {
        // Merge all schedules, combining sessions for the same schedule
        const scheduleMap = new Map<string, any>();

        responses.forEach(response => {
          response.schedules.forEach(schedule => {
            if (scheduleMap.has(schedule.id)) {
              // Merge sessions
              const existingSchedule = scheduleMap.get(schedule.id);
              const existingSessionDates = new Set(existingSchedule.sessions.map((s: any) => s.date));

              schedule.sessions.forEach((session: any) => {
                if (!existingSessionDates.has(session.date)) {
                  existingSchedule.sessions.push(session);
                }
              });
            } else {
              scheduleMap.set(schedule.id, { ...schedule });
            }
          });
        });

        return {
          schedules: Array.from(scheduleMap.values())
        };
      })
    );
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
