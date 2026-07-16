import { Component, OnInit, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CtarLogicService } from '../../services/ctar-logic.service';
import { ZenBalloonComponent } from '../zen-balloon/zen-balloon.component';
import { I18nService } from '../../services/i18n.service';
import { SupabaseService } from '../../services/supabase.service';
import { DataSyncService } from '../../services/data-sync.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, ZenBalloonComponent],
  template: `
    <div class="game-layout-root h-screen max-h-screen overflow-hidden flex flex-col relative z-10 text-slate-800 dark:text-slate-200 p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
      <div class="max-w-[460px] mx-auto w-full h-full flex flex-col min-h-0 justify-center">
        <app-zen-balloon 
          class="w-full h-full block min-h-0"
          [currentForce]="ctar.currentForce" 
          [peakForce]="ctar.peakForce"
          [maxForceLimit]="ctar.calibrationMaxForce()"
          [currentRep]="ctar.repCount()"
          [targetReps]="targetReps()"
          [requiredHoldTimeMs]="holdDurationMs()"
          (repCompleted)="onGameRep()">
        </app-zen-balloon>
      </div>
    </div>
  `,
  styles: [`
    @media (max-height: 800px) {
      .game-layout-root {
        padding: 0.5rem !important;
      }
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  public targetReps = signal<number>(15);
  public holdDurationMs = signal<number>(2000);
  public i18n = inject(I18nService);

  private sessionEnding = false;
  private endTimer: any;
  private supabase = inject(SupabaseService);
  private dataSync = inject(DataSyncService);

  constructor(public ctar: CtarLogicService, private router: Router) {
    effect(() => {
      if (this.ctar.repCount() >= this.targetReps() && !this.sessionEnding) {
        this.sessionEnding = true;
        // Let the final rep's success chime + voice cue and the celebration
        // message play out before yanking the user to the summary page
        this.endTimer = setTimeout(() => this.finishSession(), 2500);
      }
    });
  }

  async ngOnInit() {
    this.ctar.resetSession();
    if (this.ctar.calibrationMaxForce() === 0) {
      this.router.navigate(['/calibrate']);
      return;
    }

    // Fetch custom settings for this patient
    const user = this.supabase.currentUser();
    if (user) {
      const profile = await this.dataSync.fetchPatientProfile(user.id);
      if (profile) {
        if (profile.target_reps !== undefined && profile.target_reps !== null) {
          this.targetReps.set(profile.target_reps);
        }
        if (profile.hold_duration_ms !== undefined && profile.hold_duration_ms !== null) {
          this.holdDurationMs.set(profile.hold_duration_ms);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.endTimer) {
      clearTimeout(this.endTimer);
    }
  }

  onGameRep() {
    this.ctar.repCount.update((count: number) => count + 1);
  }

  finishSession() {
    this.router.navigate(['/summary']);
  }
}
