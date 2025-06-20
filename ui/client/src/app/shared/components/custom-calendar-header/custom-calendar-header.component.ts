import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
} from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

/** Custom header for the calendar. */
@Component({
  selector: 'app-custom-calendar-header',
  template: `
    <div class="custom-calendar-header">
      <button mat-icon-button class="nav-button" (click)="previousClicked()">
        <mat-icon>keyboard_arrow_left</mat-icon>
      </button>
      
      <span class="period-label">{{ periodLabel }}</span>
      
      <button mat-icon-button class="nav-button" (click)="nextClicked()">
        <mat-icon>keyboard_arrow_right</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .custom-calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 8px;
    }
    .period-label {
      flex-grow: 1;
      text-align: center;
      font-weight: 500;
    }
    .nav-button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class CustomCalendarHeaderComponent<D> implements OnDestroy {
  private destroyed = new Subject<void>();

  constructor(
    private calendar: MatCalendar<D>,
    private dateAdapter: DateAdapter<D>,
    @Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {
    calendar.stateChanges.pipe(takeUntil(this.destroyed)).subscribe(() => cdr.markForCheck());

    // Re-render the header when the language changes.
    this.translate.onLangChange.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  get periodLabel() {
    return this.dateAdapter
      .format(this.calendar.activeDate, this.dateFormats.display.monthYearLabel)
      .toLocaleUpperCase();
  }

  previousClicked() {
    this.calendar.activeDate = this.dateAdapter.addCalendarMonths(this.calendar.activeDate, -1);
  }

  nextClicked() {
    this.calendar.activeDate = this.dateAdapter.addCalendarMonths(this.calendar.activeDate, 1);
  }
} 