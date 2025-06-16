import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { LocaleInitService } from './core/services/locale-init.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, AppHeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private localeInitService = inject(LocaleInitService);

  ngOnInit(): void {
    // Initialize locale only once on app start
    // LocaleInitService now handles persistence, so we don't need to re-initialize on every navigation
    this.localeInitService.initializeLocale();
  }
}
