import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private supabase: SupabaseService, private router: Router) {
    effect(() => {
      // Only execute redirection once Supabase initialization has completed
      if (!this.supabase.isInitialized()) return;

      const user = this.supabase.currentUser();
      const currentUrl = this.router.url.split('?')[0].split('#')[0];
      const isPublicPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(currentUrl);

      if (user) {
        // If logged in and on auth pages, redirect to dashboard
        if (currentUrl === '/login' || currentUrl === '/register' || currentUrl === '/forgot-password') {
           this.router.navigate(['/dashboard']);
        }
      } else {
        // Handled mostly by authGuard, but helpful for instant logout reaction
        if (!isPublicPage) {
          this.router.navigate(['/login']);
        }
      }
    });
  }
}
