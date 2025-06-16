import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocaleInitService {
  private translateService = inject(TranslateService);
  private router = inject(Router);

  private readonly SUPPORTED_LOCALES = ['en', 'uk'];
  private readonly DEFAULT_LOCALE = 'en';
  private readonly LOCALE_STORAGE_KEY = 'user_preferred_locale';

  /**
   * Initializes the application locale.
   * Priority: 1) URL query parameter, 2) Stored user preference, 3) Browser language, 4) Default
   */
  initializeLocale(): Observable<string> {
    const locale = this.getLocaleFromUrl() ||
                   this.getStoredLocale() ||
                   this.getDefaultLocaleFromBrowser();

    this.applyLocale(locale);
    return of(locale);
  }

  /**
   * Sets a new locale and persists the user's choice
   */
  setLocale(locale: string): Observable<string> {
    if (this.isLocaleSupported(locale)) {
      this.storeLocale(locale);
      this.applyLocale(locale);
      return of(locale);
    }
    return of(this.translateService.currentLang || this.DEFAULT_LOCALE);
  }

  private getLocaleFromUrl(): string | null {
    try {
      const urlTree = this.router.parseUrl(this.router.url);
      const localeParam = urlTree.queryParams['locale'];

      if (localeParam && this.isLocaleSupported(localeParam)) {
        // Store this as user preference since they came via invitation
        this.storeLocale(localeParam);
        return localeParam;
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL for locale:', error);
      return null;
    }
  }

  private getStoredLocale(): string | null {
    try {
      const stored = localStorage.getItem(this.LOCALE_STORAGE_KEY);
      if (stored && this.isLocaleSupported(stored)) {
        return stored;
      }
    } catch (error) {
      console.error('Error reading stored locale:', error);
    }
    return null;
  }

  private storeLocale(locale: string): void {
    try {
      localStorage.setItem(this.LOCALE_STORAGE_KEY, locale);
    } catch (error) {
      console.error('Error storing locale preference:', error);
    }
  }

  private getDefaultLocaleFromBrowser(): string {
    const browserLang = this.translateService.getBrowserLang();
    return this.isLocaleSupported(browserLang) ? browserLang! : this.DEFAULT_LOCALE;
  }

  private isLocaleSupported(locale?: string): boolean {
    return locale ? this.SUPPORTED_LOCALES.includes(locale) : false;
  }

  private applyLocale(locale: string): void {
    this.translateService.setDefaultLang(this.DEFAULT_LOCALE);
    this.translateService.use(locale);
    this.translateService.addLangs(this.SUPPORTED_LOCALES);
  }
}
