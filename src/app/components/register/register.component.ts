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
  role: z.enum(['user', 'doctor']),
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
          <button (click)="i18n.toggleLang()" class="text-sm font-semibold px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-accent transition-colors border border-slate-200 dark:border-slate-700">
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
              <label class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('register.firstName') }}</label>
              <input 
                type="text" 
                [(ngModel)]="firstName" 
                name="firstName"
                required
                class="w-full px-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="สมชาย">
            </div>
            <div>
              <label class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('register.lastName') }}</label>
              <input 
                type="text" 
                [(ngModel)]="lastName" 
                name="lastName"
                required
                class="w-full px-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="ใจดี">
            </div>
          </div>

          <div>
            <label class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.email') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-regular fa-envelope text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                type="email" 
                [(ngModel)]="email" 
                name="email"
                required
                class="w-full pl-10 pr-4 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none shadow-sm dark:shadow-none"
                placeholder="name@example.com">
            </div>
          </div>

          <div>
            <label class="block text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">{{ i18n.t('login.password') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-slate-400 dark:text-slate-500 text-lg"></i>
              </div>
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                [(ngModel)]="password" 
                name="password"
                required
                class="w-full pl-10 pr-12 py-4 text-lg sm:text-xl bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 outline-none shadow-sm dark:shadow-none"
                placeholder="••••••••">
              <button 
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 outline-none border-none bg-transparent cursor-pointer z-10 text-lg">
                <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <div *ngIf="error" class="text-rose-500 dark:text-rose-400 text-base bg-rose-50 dark:bg-rose-500/10 p-4 rounded-lg border border-rose-200 dark:border-rose-500/20 flex items-center transition-colors duration-300">
            <i class="fa-solid fa-circle-exclamation mr-2 text-lg"></i> {{ error }}
          </div>

          <button 
            type="submit" 
            [disabled]="loading"
            class="w-full min-h-[58px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-xl transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2">
            <i *ngIf="loading" class="fa-solid fa-spinner fa-spin mr-2"></i>
            {{ loading ? i18n.t('register.loading') : i18n.t('register.submit') }}
          </button>
        </form>

        <div class="mt-6 text-center text-lg text-slate-600 dark:text-slate-300 relative z-10 transition-colors duration-300">
          {{ i18n.t('register.hasAccount') }} 
          <a routerLink="/login" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white font-bold transition-colors">{{ i18n.t('register.signIn') }}</a>
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
  showPassword = false;
  role: 'user' | 'doctor' = 'user';
  loading = false;
  error = '';
  public i18n = inject(I18nService);

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    const validationResult = UserSchema.safeParse({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      role: this.role
    });

    if (!validationResult.success) {
      // Get the first error message and translate it
      this.error = this.i18n.t(validationResult.error.issues[0].message);
      return;
    }
    
    this.loading = true;
    this.error = '';

    try {
      const { data, error } = await this.supabase.signUp(this.email, this.password, {
        first_name: this.firstName,
        last_name: this.lastName,
        role: this.role
      });
      
      if (error) throw error;
      
      if (data.user) {
         const { error: dbError } = await this.supabase.client
           .from('patients')
           .insert([{
             id: data.user.id,
             first_name: this.firstName,
             last_name: this.lastName,
             role: this.role
           }]);
           
         if (dbError) {
            console.error("Failed to insert into public.patients:", dbError);
         }
      }
      
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
