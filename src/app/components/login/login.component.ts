import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { FontScaleControlComponent } from '../font-scale-control/font-scale-control.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontScaleControlComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 relative z-10 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div class="bg-white dark:bg-brand-card border border-slate-200 dark:border-slate-700 rounded-3xl shadow-md p-8 w-full max-w-md relative transition-colors duration-300">
        <!-- Language toggle -->
        <div class="flex flex-wrap justify-end items-center gap-2 mb-4 relative z-30">
          <app-font-scale-control [inline]="true"></app-font-scale-control>
          <button (click)="i18n.toggleLang()" class="min-h-12 text-base font-semibold px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-accent transition-colors border border-slate-200 dark:border-slate-700">
            {{ i18n.currentLang() === 'th' ? 'EN' : 'TH' }}
          </button>
        </div>
        
        <div class="text-center mb-8 relative z-10">
          <div class="w-20 h-20 bg-slate-100 dark:bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-300">
            <i class="fa-solid fa-staff-snake text-4xl text-brand-accent"></i>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 transition-colors duration-300">{{ i18n.t('login.welcome') }}</h1>
          <p class="text-slate-600 dark:text-slate-300 text-lg">{{ i18n.t('login.subtitle') }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6 relative z-10">
          <div>
            <label for="login-email" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.email') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-regular fa-envelope text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="login-email"
                type="email" 
                [(ngModel)]="email" 
                name="email"
                autocomplete="email"
                required
                class="w-full pl-10 pr-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="name@example.com">
            </div>
          </div>

          <div>
            <label for="login-password" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.password') }}</label>
            <div class="relative mb-2">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="login-password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password" 
                name="password"
                autocomplete="current-password"
                required
                class="w-full pl-10 pr-16 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="••••••••">
              <button
                type="button"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? i18n.t('accessibility.hidePassword') : i18n.t('accessibility.showPassword')"
                [attr.aria-pressed]="showPassword"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg text-slate-500 hover:text-brand-accent dark:text-slate-400 dark:hover:text-white focus-visible:outline-none">
                <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
              </button>
            </div>
            <div class="flex justify-end">
              <a routerLink="/forgot-password" class="inline-flex min-h-12 items-center text-base sm:text-lg text-brand-accent hover:text-blue-700 dark:hover:text-white font-bold transition-colors">{{ i18n.t('login.forgotPassword') }}</a>
            </div>
          </div>

          <div *ngIf="error" role="alert" class="text-rose-700 dark:text-rose-300 text-base bg-rose-50 dark:bg-rose-500/10 p-4 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-center transition-colors duration-300">
            <i class="fa-solid fa-circle-exclamation mr-2 text-lg" aria-hidden="true"></i> {{ error }}
          </div>

          <button 
            type="submit" 
            [disabled]="loading"
            class="w-full min-h-[58px] bg-brand-accent hover:bg-blue-700 text-white font-bold text-xl rounded-xl transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
            {{ loading ? i18n.t('login.loading') : i18n.t('login.submit') }}
          </button>
        </form>

        <div class="mt-6 text-center text-lg text-slate-600 dark:text-slate-300 relative z-10 transition-colors duration-300">
          {{ i18n.t('login.noAccount') }} 
          <a routerLink="/register" class="inline-flex min-h-12 items-center text-brand-accent hover:text-blue-700 dark:hover:text-white font-bold transition-colors">{{ i18n.t('login.createOne') }}</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';
  public i18n = inject(I18nService);

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    if (!this.email || !this.password) return;
    
    this.loading = true;
    this.error = '';

    try {
      const { error } = await this.supabase.signIn(this.email, this.password);
      if (error) throw error;
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = this.friendlyError(e);
    } finally {
      this.loading = false; 
    }
  }

  private friendlyError(error: unknown): string {
    const message = String((error as { message?: string })?.message ?? '').toLowerCase();
    if (message.includes('invalid login') || message.includes('invalid credentials')) {
      return this.i18n.t('error.invalidCredentials');
    }
    if (message.includes('network') || message.includes('fetch')) {
      return this.i18n.t('error.network');
    }
    return this.i18n.t('error.generic');
  }
}
