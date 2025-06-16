import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { LocaleInitService } from '../../../core/services/locale-init.service';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  template: `
    <div class="language-switcher">
      <button mat-button [matMenuTriggerFor]="languageMenu" class="language-button">
        <span class="flag">{{ getCurrentLanguage().flag }}</span>
        <span class="lang-code">{{ getCurrentLanguage().code.toUpperCase() }}</span>
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #languageMenu="matMenu" xPosition="before">
        @for (language of languages; track language.code) {
          <button mat-menu-item
            (click)="switchLanguage(language.code)"
            [class.active]="currentLang() === language.code">
            <span class="flag">{{ language.flag }}</span>
            <span class="lang-name">{{ language.name }}</span>
          </button>
        }
      </mat-menu>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: inline-block;
    }

    .language-button {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.2s;
      color: #fff;
      min-width: 0;
      line-height: normal;
      height: 36px;
    }

    .language-button:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .flag {
      font-size: 1.2rem;
      margin-right: 6px;
    }

    .lang-code {
      font-size: 0.9rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .lang-name {
      margin-left: 8px;
      font-weight: 500;
    }

    button.active {
      background: rgba(63, 81, 181, 0.1);
      color: #3f51b5;
      font-weight: 500;
    }

    ::ng-deep .mat-mdc-menu-panel {
      border-radius: 6px !important;
    }

    ::ng-deep .mat-mdc-menu-item {
      display: flex;
      align-items: center;
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  private translate = inject(TranslateService);
  private localeInitService = inject(LocaleInitService);
  private langChangeSubscription?: Subscription;

  currentLang = signal(this.translate.currentLang || 'en');

  languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' }
  ];

  ngOnInit(): void {
    // Subscribe to language changes from any source
    this.langChangeSubscription = this.translate.onLangChange.subscribe(event => {
      this.currentLang.set(event.lang);
    });

    // Also check current language on init in case it was already set
    if (this.translate.currentLang) {
      this.currentLang.set(this.translate.currentLang);
    }
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.currentLang()) || this.languages[0];
  }

  switchLanguage(lang: string): void {
    console.log('Language switcher changing language to:', lang);
    // Use LocaleInitService to persist the user's choice
    this.localeInitService.setLocale(lang).subscribe({
      next: (appliedLocale: string) => {
        this.currentLang.set(appliedLocale);
      },
      error: (error: any) => {
        console.error('Language switcher failed to change language:', error);
      }
    });
  }
}
