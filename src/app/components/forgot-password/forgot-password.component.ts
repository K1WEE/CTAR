import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 relative z-10 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div class="bg-white dark:bg-brand-card border border-slate-200 dark:border-slate-700 rounded-3xl shadow-md p-8 w-full max-w-md relative overflow-hidden transition-colors duration-300">
        <!-- Language toggle -->
        <div class="flex justify-end mb-2 relative z-10">
          <button (click)="i18n.toggleLang()" class="min-h-12 text-base font-semibold px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-accent transition-colors border border-slate-200 dark:border-slate-700">
            {{ i18n.currentLang() === 'th' ? 'EN' : 'TH' }}
          </button>
        </div>
        
        <div class="text-center mb-8 relative z-10">
          <div class="w-20 h-20 bg-slate-100 dark:bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-300">
            <i class="fa-solid fa-key text-4xl text-brand-accent"></i>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 transition-colors duration-300">{{ i18n.t('forgot.title') }}</h1>
          <p class="text-slate-600 dark:text-slate-300 text-lg">{{ i18n.t('forgot.subtitle') }}</p>
        </div>

        <form *ngIf="!success" (ngSubmit)="onSubmit()" class="space-y-6 relative z-10">
          <div>
            <label for="forgot-email" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.email') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-regular fa-envelope text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="forgot-email"
                type="email" 
                [(ngModel)]="email" 
                name="email"
                autocomplete="email"
                required
                class="w-full pl-10 pr-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="name@example.com">
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
            {{ loading ? i18n.t('login.loading') : i18n.t('forgot.submit') }}
          </button>
        </form>

        <div *ngIf="success" class="space-y-6 relative z-10 text-center">
          <div class="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex flex-col items-center">
            <i class="fa-regular fa-circle-check text-4xl mb-2"></i>
            <p class="font-medium text-lg">{{ i18n.t('forgot.success') }}</p>
          </div>
        </div>

        <div class="mt-6 text-center text-lg relative z-10 transition-colors duration-300">
          <a routerLink="/login" class="inline-flex min-h-12 items-center text-lg text-brand-accent hover:text-blue-700 dark:hover:text-white font-bold transition-colors">
            <i class="fa-solid fa-arrow-left mr-1.5 text-sm" aria-hidden="true"></i>{{ i18n.t('forgot.back') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  success = false;
  error = '';
  public i18n = inject(I18nService);

  constructor(private supabase: SupabaseService) {}

  async onSubmit() {
    if (!this.email) return;

    this.loading = true;
    this.error = '';

    try {
      const resetRedirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await this.supabase.sendPasswordResetEmail(this.email, resetRedirectUrl);
      if (error) throw error;
      this.success = true;
    } catch (e: any) {
      this.error = this.friendlyError(e);
    } finally {
      this.loading = false;
    }
  }

  private friendlyError(error: unknown): string {
    const message = String((error as { message?: string })?.message ?? '').toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return this.i18n.t('error.network');
    }
    return this.i18n.t('error.generic');
  }
}
