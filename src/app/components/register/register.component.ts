import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { z } from 'zod';
import { I18nService } from '../../services/i18n.service';
import { FontScaleControlComponent } from '../font-scale-control/font-scale-control.component';

export const UserSchema = z.object({
  firstName: z.string().min(1, 'register.error.firstName'),
  lastName: z.string().min(1, 'register.error.lastName'),
  email: z.string().min(1, 'register.error.email'),
  password: z.string()
    .min(1, 'register.error.passwordRequired')
    .min(6, 'register.error.passwordLength')
    .refine(
      (val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /[0-9]/.test(val),
      { message: 'register.error.passwordComplexity' }
    ),
  role: z.literal('user').default('user'),
});
export type User = z.infer<typeof UserSchema>;
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontScaleControlComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 relative z-10 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div class="bg-white dark:bg-brand-card border border-slate-200 dark:border-slate-700 rounded-3xl shadow-md p-8 w-full max-w-md relative transition-colors duration-300">
        <!-- Language toggle -->
        <div class="flex justify-end items-center gap-2 mb-2 relative z-30">
          <app-font-scale-control [inline]="true"></app-font-scale-control>
          <button (click)="i18n.toggleLang()" class="min-h-12 text-base font-semibold px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-accent transition-colors border border-slate-200 dark:border-slate-700">
            {{ i18n.currentLang() === 'th' ? 'EN' : 'TH' }}
          </button>
        </div>
        
        <div class="text-center mb-8 relative z-10">
          <div class="w-20 h-20 bg-slate-100 dark:bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-300">
            <i class="fa-solid fa-user-plus text-4xl text-emerald-500 dark:text-emerald-400"></i>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 transition-colors duration-300">{{ i18n.t('register.title') }}</h1>
          <p class="text-slate-600 dark:text-slate-300 text-lg">{{ i18n.t('register.subtitle') }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-5 relative z-10">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="register-first-name" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('register.firstName') }}</label>
              <input 
                id="register-first-name"
                type="text" 
                [(ngModel)]="firstName" 
                name="firstName"
                autocomplete="given-name"
                required
                class="w-full px-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="สมชาย">
            </div>
            <div>
              <label for="register-last-name" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('register.lastName') }}</label>
              <input 
                id="register-last-name"
                type="text" 
                [(ngModel)]="lastName" 
                name="lastName"
                autocomplete="family-name"
                required
                class="w-full px-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="ใจดี">
            </div>
          </div>

          <div>
            <label for="register-email" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.email') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-regular fa-envelope text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="register-email"
                type="email" 
                [(ngModel)]="email" 
                name="email"
                autocomplete="email"
                required
                class="w-full pl-10 pr-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="name@example.com">
            </div>
          </div>

          <div>
            <label for="register-password" class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.password') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                id="register-password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password" 
                name="password"
                autocomplete="new-password"
                required
                class="w-full pl-10 pr-16 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="••••••••">
              <button
                type="button"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? i18n.t('accessibility.hidePassword') : i18n.t('accessibility.showPassword')"
                [attr.aria-pressed]="showPassword"
                class="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-white focus-visible:outline-none">
                <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div *ngIf="error" role="alert" class="text-rose-700 dark:text-rose-300 text-base bg-rose-50 dark:bg-rose-500/10 p-4 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-center transition-colors duration-300">
            <i class="fa-solid fa-circle-exclamation mr-2 text-lg" aria-hidden="true"></i> {{ error }}
          </div>

          <div *ngIf="notice" role="status" class="text-emerald-800 dark:text-emerald-200 text-base bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-lg border border-emerald-200 dark:border-emerald-500/20 flex items-center transition-colors duration-300">
            <i class="fa-solid fa-envelope-circle-check mr-2 text-lg" aria-hidden="true"></i> {{ notice }}
          </div>

          <button 
            type="submit" 
            [disabled]="loading"
            class="w-full min-h-[58px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xl rounded-xl transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2">
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
            {{ loading ? i18n.t('register.loading') : i18n.t('register.submit') }}
          </button>
        </form>

        <div class="mt-6 text-center text-lg text-slate-600 dark:text-slate-300 relative z-10 transition-colors duration-300">
          {{ i18n.t('register.hasAccount') }} 
          <a routerLink="/login" class="inline-flex min-h-12 items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white font-bold transition-colors">{{ i18n.t('register.signIn') }}</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  role: 'user' = 'user';
  loading = false;
  error = '';
  notice = '';
  showPassword = false;
  public i18n = inject(I18nService);

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    const validationResult = UserSchema.safeParse({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      role: 'user'
    });

    if (!validationResult.success) {
      // Get the first error message and translate it
      this.error = this.i18n.t(validationResult.error.issues[0].message);
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.notice = '';

    try {
      const { data, error } = await this.supabase.signUp(this.email, this.password, {
        first_name: this.firstName,
        last_name: this.lastName,
        role: 'user'
      });
      
      if (error) throw error;
      
      // Supabase returns a user without a session when email confirmation is
      // required. The user is not authenticated in that state, so an insert
      // into the RLS-protected patients table would fail and must be deferred.
      if (!data.session) {
        this.notice = this.i18n.t('register.confirmEmail');
        return;
      }

      if (data.user && data.session.user.id === data.user.id) {
         const { error: dbError } = await this.supabase.client
           .from('patients')
           .insert([{
             id: data.user.id,
             first_name: this.firstName,
             last_name: this.lastName,
             role: 'user'
           }]);
           
         if (dbError) {
            console.error("Failed to insert into public.patients:", dbError);
         }
      }
      
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = this.friendlyError(e);
    } finally {
      this.loading = false;
    }
  }

  private friendlyError(error: unknown): string {
    const message = String((error as { message?: string })?.message ?? '').toLowerCase();
    if (message.includes('already registered') || message.includes('already been registered')) {
      return this.i18n.t('error.emailInUse');
    }
    if (message.includes('network') || message.includes('fetch')) {
      return this.i18n.t('error.network');
    }
    return this.i18n.t('error.generic');
  }
}
