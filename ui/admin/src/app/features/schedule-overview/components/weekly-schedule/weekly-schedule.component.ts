import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

interface WeeklySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  activityType: string;
}

@Component({
  selector: 'app-weekly-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="weekly-schedule">
      <table mat-table [dataSource]="schedule" class="mat-elevation-z8">
        <!-- Day Column -->
        <ng-container matColumnDef="day">
          <th mat-header-cell *matHeaderCellDef>Day</th>
          <td mat-cell *matCellDef="let element">{{ getDayName(element.dayOfWeek) }}</td>
        </ng-container>

        <!-- Time Slot Column -->
        <ng-container matColumnDef="timeSlot">
          <th mat-header-cell *matHeaderCellDef>Time Slot</th>
          <td mat-cell *matCellDef="let element">
            {{ element.startTime }} - {{ element.endTime }}
          </td>
        </ng-container>

        <!-- Activity Type Column -->
        <ng-container matColumnDef="activityType">
          <th mat-header-cell *matHeaderCellDef>Activity Type</th>
          <td mat-cell *matCellDef="let element">
            <mat-form-field>
              <mat-select [(ngModel)]="element.activityType" (selectionChange)="onScheduleChange()">
                <mat-option value="training">Training</mat-option>
                <mat-option value="class">Class</mat-option>
                <mat-option value="consultation">Consultation</mat-option>
              </mat-select>
            </mat-form-field>
          </td>
        </ng-container>

        <!-- Capacity Column -->
        <ng-container matColumnDef="capacity">
          <th mat-header-cell *matHeaderCellDef>Max Capacity</th>
          <td mat-cell *matCellDef="let element">
            <mat-form-field>
              <input matInput type="number" [(ngModel)]="element.maxCapacity" 
                     (ngModelChange)="onScheduleChange()" min="1">
            </mat-form-field>
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let element">
            <button mat-icon-button color="warn" (click)="removeSchedule(element)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="addNewSchedule()">
          <mat-icon>add</mat-icon>
          Add Schedule
        </button>
      </div>
    </div>
  `,
  styles: [`
    .weekly-schedule {
      padding: 20px;
    }

    table {
      width: 100%;
    }

    .mat-column-actions {
      width: 80px;
      text-align: center;
    }

    .actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class WeeklyScheduleComponent {
  @Input() schedule: WeeklySchedule[] = [];
  @Output() scheduleUpdate = new EventEmitter<WeeklySchedule[]>();

  displayedColumns: string[] = ['day', 'timeSlot', 'activityType', 'capacity', 'actions'];

  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  addNewSchedule() {
    const newSchedule: WeeklySchedule = {
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:00',
      maxCapacity: 10,
      activityType: 'training'
    };
    this.schedule = [...this.schedule, newSchedule];
    this.onScheduleChange();
  }

  removeSchedule(schedule: WeeklySchedule) {
    this.schedule = this.schedule.filter(s => s !== schedule);
    this.onScheduleChange();
  }

  onScheduleChange() {
    this.scheduleUpdate.emit(this.schedule);
  }
} 