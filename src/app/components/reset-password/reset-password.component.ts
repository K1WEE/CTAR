import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { I18nService } from '../../services/i18n.service';
import { z } from 'zod';

export const ResetPasswordSchema = z.object({
  password: z.string()
    .min(1, 'register.error.passwordRequired')
    .min(6, 'register.error.passwordLength')
    .refine(
      (val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /[0-9]/.test(val),
      { message: 'register.error.passwordComplexity' }
    )
});

@Component({
  selector: 'app-reset-password',
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
            <i class="fa-solid fa-lock-open text-4xl text-brand-accent"></i>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 transition-colors duration-300">{{ i18n.t('reset.title') }}</h1>
          <p class="text-slate-600 dark:text-slate-300 text-lg">{{ i18n.t('reset.subtitle') }}</p>
        </div>

        <form *ngIf="!success && sessionChecked" (ngSubmit)="onSubmit()" class="space-y-6 relative z-10">
          <div>
            <label for="reset-password" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('reset.newPassword') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="reset-password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password" 
                name="password"
                autocomplete="new-password"
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
          </div>

          <div>
            <label for="reset-confirm-password" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('reset.confirmPassword') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="reset-confirm-password"
                [type]="showConfirmPassword ? 'text' : 'password'"
                [(ngModel)]="confirmPassword" 
                name="confirmPassword"
                autocomplete="new-password"
                required
                class="w-full pl-10 pr-16 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="••••••••">
              <button
                type="button"
                (click)="showConfirmPassword = !showConfirmPassword"
                [attr.aria-label]="showConfirmPassword ? i18n.t('accessibility.hidePassword') : i18n.t('accessibility.showPassword')"
                [attr.aria-pressed]="showConfirmPassword"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg text-slate-500 hover:text-brand-accent dark:text-slate-400 dark:hover:text-white focus-visible:outline-none">
                <i class="fa-solid" [ngClass]="showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
              </button>
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
            {{ loading ? i18n.t('login.loading') : i18n.t('reset.submit') }}
          </button>
        </form>

        <div *ngIf="!sessionChecked" class="text-center py-8 relative z-10">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-brand-accent mb-4"></i>
          <p class="text-slate-600 dark:text-slate-300 text-lg">Validating access token...</p>
        </div>

        <div *ngIf="success" class="space-y-6 relative z-10 text-center">
          <div class="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex flex-col items-center">
            <i class="fa-regular fa-circle-check text-4xl mb-2"></i>
            <p class="font-medium text-lg">{{ i18n.t('reset.success') }}</p>
          </div>
        </div>

        <div *ngIf="sessionChecked && error && !supabase.currentUser()" class="mt-6 text-center text-lg relative z-10 transition-colors duration-300">
          <a routerLink="/login" class="inline-flex min-h-12 items-center text-lg text-brand-accent hover:text-blue-700 dark:hover:text-white font-bold transition-colors">
            <i class="fa-solid fa-arrow-left mr-1.5 text-sm" aria-hidden="true"></i>{{ i18n.t('forgot.back') }}
          </a>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  loading = false;
  success = false;
  sessionChecked = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;
  public i18n = inject(I18nService);

  constructor(public supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.supabase.sessionReady;
    
    // Give Supabase a brief moment to parse the hash fragment if needed
    if (!this.supabase.currentUser()) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Ensure there is a user session. Clicking a recovery link in email 
    // redirects to /reset-password, which has the token fragment. Supabase parses this
    // and automatically logs the user in.
    if (!this.supabase.currentUser()) {
      this.error = this.i18n.t('error.invalidResetSession');
    }
    this.sessionChecked = true;
  }

  async onSubmit() {
    if (!this.password || !this.confirmPassword) return;

    if (this.password !== this.confirmPassword) {
      this.error = this.i18n.t('reset.error.match');
      return;
    }

    const validationResult = ResetPasswordSchema.safeParse({
      password: this.password
    });

    if (!validationResult.success) {
      this.error = this.i18n.t(validationResult.error.issues[0].message);
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const { error } = await this.supabase.updatePassword(this.password);
      if (error) throw error;

      this.success = true;
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
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
