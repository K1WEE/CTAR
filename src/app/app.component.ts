import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SupabaseService } from './services/supabase.service';
import { FontScaleControlComponent } from './components/font-scale-control/font-scale-control.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FontScaleControlComponent],
  template: `
    <app-font-scale-control *ngIf="showGlobalFontControl()"></app-font-scale-control>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  public readonly showGlobalFontControl = signal(true);

  constructor(private supabase: SupabaseService, private router: Router) {
    this.updateGlobalFontControl(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateGlobalFontControl(event.urlAfterRedirects));

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

  private updateGlobalFontControl(url: string): void {
    // Pages with a visible header render the control beside the language toggle.
    const hasInlineControl = ['/patient-portal', '/clinic', '/login', '/register']
      .some(path => url.startsWith(path));
    this.showGlobalFontControl.set(!hasInlineControl);
  }
}
