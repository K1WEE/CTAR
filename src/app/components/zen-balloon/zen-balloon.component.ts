import { Component, Input, Output, EventEmitter, effect, Signal, NgZone, OnDestroy, OnInit, HostListener, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BiofeedbackService } from '../../services/biofeedback.service';
import { BleService } from '../../services/ble.service';
import { I18nService } from '../../services/i18n.service';
import { ChinTuckDemoComponent } from '../chin-tuck-demo/chin-tuck-demo.component';

import { FontScaleControlComponent } from '../font-scale-control/font-scale-control.component';

type FeedbackState = 'squeeze' | 'hold' | 'holdAlmost' | 'tooHard' | 'release' | 'success';

const FEEDBACK_ROTATE_MS = 5000;
const GAME_CUE_COOLDOWN_MS = 4000;

@Component({
  selector: 'app-zen-balloon',
  standalone: true,
  imports: [CommonModule, ChinTuckDemoComponent, FontScaleControlComponent],
  animations: [
    // Re-pops the countdown digit on every value change, then stays fully
    // visible — unlike animate-ping which fades the number out while it shows
    trigger('countdownPop', [
      transition('* => *', [
        style({ transform: 'scale(1.35)', opacity: 0.4 }),
        animate('250ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
  template: `
    <div [@.disabled]="prefersReducedMotion" class="game-card bg-white dark:bg-brand-card rounded-3xl shadow-md p-4 sm:p-6 w-full flex flex-col items-center border border-slate-200 dark:border-slate-700 min-h-[450px] h-full relative overflow-hidden transition-colors duration-300">

      <!-- Ready state: give the patient a calm, explicit starting point. -->
      <div *ngIf="gameFlowState() === 'ready'" class="game-overlay absolute inset-0 bg-slate-950/55 z-30 flex items-center justify-center p-5 rounded-3xl animate-fade-in">
        <div role="dialog" aria-modal="true" data-dialog="start" aria-labelledby="game-start-title" aria-describedby="game-start-description" class="game-dialog w-full max-w-[340px] bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
            <i class="fa-solid fa-parachute-box text-2xl" aria-hidden="true"></i>
          </div>
          <h2 id="game-start-title" class="text-xl sm:text-2xl font-black text-center text-slate-900 dark:text-white leading-tight">
            {{ i18n.t('game.start.title') }}
          </h2>
          <p id="game-start-description" class="mt-2 text-center text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ i18n.t('game.start.instructions') }}
          </p>
          <div class="mt-4 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3">
            <p class="text-center text-base font-black text-amber-800 dark:text-amber-300">
              {{ i18n.t('game.targetReps') }} {{ targetReps }} {{ i18n.currentLang() === 'th' ? 'ครั้ง' : 'reps' }}
            </p>
          </div>
          <ol class="mt-4 space-y-3 text-left" [attr.aria-label]="i18n.currentLang() === 'th' ? 'ขั้นตอนการฝึก' : 'Training steps'">
            <li class="flex items-start gap-3 text-base font-bold text-slate-700 dark:text-slate-200">
              <span class="w-7 h-7 shrink-0 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-black" aria-hidden="true">1</span>
              <span>{{ i18n.t('game.start.step1') }}</span>
            </li>
            <li class="flex items-start gap-3 text-base font-bold text-slate-700 dark:text-slate-200">
              <span class="w-7 h-7 shrink-0 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-black" aria-hidden="true">2</span>
              <span>{{ i18n.t('game.start.step2') }}</span>
            </li>
            <li class="flex items-start gap-3 text-base font-bold text-slate-700 dark:text-slate-200">
              <span class="w-7 h-7 shrink-0 rounded-full bg-cyan-600 text-white flex items-center justify-center text-sm font-black" aria-hidden="true">3</span>
              <span>{{ i18n.t('game.start.step3') }}</span>
            </li>
          </ol>
          <button type="button" (click)="beginSession()"
            class="mt-5 w-full min-h-[56px] px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg rounded-2xl shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {{ i18n.t('game.start.button') }}
          </button>
        </div>
      </div>
      
      <!-- Countdown State Overlay -->
      <div *ngIf="gameFlowState() === 'countdown'" class="game-overlay absolute inset-0 bg-slate-950/55 z-30 flex flex-col items-center justify-center p-6 rounded-3xl animate-fade-in text-center">
        <span class="text-white font-bold uppercase tracking-widest text-sm xs:text-base sm:text-lg mb-4 drop-shadow-md">
          {{ countdownInstruction() }}
        </span>
        <!-- Massive number: pops in per digit, stays readable (no ping fade-out) -->
        <div [@countdownPop]="countdownValue()" class="text-8xl xs:text-9xl font-black text-amber-400 tabular-nums select-none drop-shadow-lg" role="status" aria-live="assertive">
          {{ countdownValue() }}
        </div>
      </div>

      <!-- Disconnected State Overlay -->
      <div *ngIf="gameFlowState() === 'disconnected'" class="game-overlay absolute inset-0 bg-slate-950/65 z-40 flex flex-col items-center justify-center p-6 rounded-3xl animate-fade-in">
        <div role="alert" class="game-dialog bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-[320px] border border-slate-200 dark:border-white/10 text-center flex flex-col items-center space-y-4 animate-scale-up">
          <div class="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <i class="fa-brands fa-bluetooth-b text-2xl text-red-500" aria-hidden="true"></i>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {{ i18n.currentLang() === 'th' ? 'การเชื่อมต่อหลุด' : 'Connection Lost' }}
          </h2>
          <p class="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ i18n.currentLang() === 'th' ? 'กรุณาเชื่อมต่ออุปกรณ์ใหม่อีกครั้ง เพื่อฝึกต่อ' : 'Please reconnect the device to continue training.' }}
          </p>
          <button (click)="goToConnect()"
            class="px-6 min-h-[52px] w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md transition-all duration-300 text-base cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            <i class="fa-solid fa-link mr-2" aria-hidden="true"></i>{{ i18n.currentLang() === 'th' ? 'เชื่อมต่อใหม่' : 'Reconnect' }}
          </button>
        </div>
      </div>

      <!-- Stale sensor data overlay: keep the last force from being mistaken
           for a live reading while notifications are temporarily paused. -->
      <div *ngIf="sensorDataStale() && gameFlowState() === 'playing'" class="game-overlay absolute inset-0 bg-slate-950/65 z-40 flex flex-col items-center justify-center p-6 rounded-3xl animate-fade-in">
        <div role="alert" class="game-dialog bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-[320px] border border-slate-200 dark:border-white/10 text-center flex flex-col items-center space-y-4 animate-scale-up">
          <div class="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <i class="fa-solid fa-wave-square text-2xl text-amber-600 dark:text-amber-400" aria-hidden="true"></i>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {{ i18n.currentLang() === 'th' ? 'กำลังรอสัญญาณเซนเซอร์' : 'Sensor signal paused' }}
          </h2>
          <p class="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ i18n.currentLang() === 'th' ? 'ระบบหยุดนับชั่วคราว กรุณารอสัญญาณใหม่จากอุปกรณ์' : 'Training is paused until a new reading arrives from the device.' }}
          </p>
        </div>
      </div>

      <!-- Exit Confirmation Overlay -->
      <div *ngIf="showExitConfirm()" class="game-overlay absolute inset-0 bg-slate-950/65 z-40 flex items-center justify-center p-6 rounded-3xl animate-fade-in">
        <div role="alertdialog" aria-modal="true" data-dialog="exit" aria-labelledby="exit-dialog-title" aria-describedby="exit-dialog-description" class="game-dialog bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-[320px] border border-slate-200 dark:border-white/10 text-center flex flex-col items-center space-y-3 animate-scale-up">
          <h2 id="exit-dialog-title" class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {{ i18n.currentLang() === 'th' ? 'ออกจากการฝึก?' : 'Leave training?' }}
          </h2>
          <p id="exit-dialog-description" class="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ i18n.currentLang() === 'th'
              ? (currentRepVal > 0
                  ? 'ฝึกไปแล้ว ' + currentRepVal + ' ครั้ง ถ้าออกตอนนี้ความคืบหน้าจะไม่ถูกบันทึก'
                  : 'ต้องการออกจากการฝึกใช่หรือไม่?')
              : (currentRepVal > 0
                  ? 'You completed ' + currentRepVal + ' reps. Leaving now will not save your progress.'
                  : 'Are you sure you want to leave training?') }}
          </p>
          <button type="button" (click)="cancelExit()"
            class="px-6 min-h-[52px] w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md transition-all duration-300 text-base cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {{ i18n.currentLang() === 'th' ? 'ฝึกต่อ' : 'Keep training' }}
          </button>
          <button type="button" (click)="confirmExit()"
            class="px-6 min-h-[44px] w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300 text-sm cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {{ i18n.currentLang() === 'th' ? 'ออกจากการฝึก' : 'Leave' }}
          </button>
        </div>
      </div>

      <!-- Finish-Early Confirmation Overlay -->
      <div *ngIf="showFinishConfirm()" class="game-overlay absolute inset-0 bg-slate-950/65 z-40 flex items-center justify-center p-6 rounded-3xl animate-fade-in">
        <div role="alertdialog" aria-modal="true" data-dialog="finish" aria-labelledby="finish-dialog-title" aria-describedby="finish-dialog-description" class="game-dialog bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-[320px] border border-slate-200 dark:border-white/10 text-center flex flex-col items-center space-y-3 animate-scale-up">
          <h2 id="finish-dialog-title" class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {{ i18n.currentLang() === 'th' ? 'จบการฝึกตอนนี้?' : 'Finish now?' }}
          </h2>
          <p id="finish-dialog-description" class="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ i18n.currentLang() === 'th'
              ? 'ฝึกไปแล้ว ' + currentRepVal + ' จาก ' + targetReps + ' ครั้ง ระบบจะบันทึกผลเท่าที่ทำได้'
              : 'You completed ' + currentRepVal + ' of ' + targetReps + ' reps. We will save your progress so far.' }}
          </p>
          <button type="button" (click)="cancelFinish()"
            class="px-6 min-h-[52px] w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md transition-all duration-300 text-base cursor-pointer border-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {{ i18n.currentLang() === 'th' ? 'ฝึกต่อ' : 'Keep training' }}
          </button>
          <button type="button" (click)="confirmFinish()"
            class="px-6 min-h-[44px] w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300 text-sm cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            {{ i18n.currentLang() === 'th' ? 'จบและดูผล' : 'Finish and view results' }}
          </button>
        </div>
      </div>

      <!-- Integrated Top Header Bar -->
      <div class="game-header w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10 relative z-10">
        <div class="game-header-main flex items-center space-x-3 min-w-0">
          <button (click)="goBack()"
            [attr.aria-label]="i18n.currentLang() === 'th' ? 'ออกจากการฝึก' : 'Leave training'"
            class="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
            <i class="fa-solid fa-arrow-left text-lg" aria-hidden="true"></i>
          </button>
          <div class="text-left min-w-0">
            <h3 class="font-black text-base sm:text-xl text-slate-800 dark:text-white leading-tight whitespace-nowrap overflow-hidden text-ellipsis">{{ i18n.t('game.activeSession') }}</h3>
            <!-- Rep count lives only in the centered pill below to avoid two competing counters -->
            <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-tight font-semibold">
              {{ i18n.t('game.targetReps') }} {{ targetReps }}
            </p>
          </div>
        </div>
        <div class="game-header-actions flex flex-wrap items-center gap-2">
          <app-font-scale-control class="mr-auto" [inline]="true"></app-font-scale-control>
          <button 
            (click)="toggleMute()" 
            class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 border bg-white dark:bg-slate-800"
            [ngClass]="isMuted ? 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400' : 'border-amber-300 text-amber-700 dark:border-amber-500/30 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5'"
            [title]="isMuted ? (i18n.currentLang() === 'th' ? 'เปิดเสียงพากย์' : 'Unmute Voice') : (i18n.currentLang() === 'th' ? 'ปิดเสียงพากย์' : 'Mute Voice')"
            [attr.aria-label]="isMuted ? (i18n.currentLang() === 'th' ? 'เปิดเสียงพากย์' : 'Unmute Voice') : (i18n.currentLang() === 'th' ? 'ปิดเสียงพากย์' : 'Mute Voice')"
            [attr.aria-pressed]="isMuted">
            <i class="fa-solid" [ngClass]="isMuted ? 'fa-volume-xmark' : 'fa-volume-high'"></i>
          </button>
          
          <button 
            (click)="finishSession()"
            class="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base rounded-xl transition-all duration-300 flex items-center space-x-1.5 shadow-sm">
            <i class="fa-solid fa-flag-checkered"></i>
            <span>{{ i18n.t('game.finish') }}</span>
          </button>
        </div>
      </div>

      <div class="game-title-container flex flex-col items-center mb-6 relative z-10 mt-1 w-full text-center">
         <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 border border-amber-100 dark:border-transparent transition-colors duration-300">
               <i class="fa-solid fa-parachute-box text-lg xs:text-xl"></i>
            </div>
            <h2 class="text-2xl xs:text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-wide transition-colors duration-300">{{ i18n.t('game.title') }}</h2>
         </div>
         
         <!-- Reps Pill Badge (Centered) -->
         <div class="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 rounded-full text-amber-800 dark:text-amber-400 font-extrabold text-sm sm:text-base shadow-sm">
            <i class="fa-solid fa-dumbbell text-amber-600 dark:text-amber-500"></i>
            <span>{{ i18n.t('game.hud.reps') }}:</span>
            <span class="text-lg sm:text-xl font-black tabular-nums">{{ currentRepVal }}</span>
            <span class="text-sm sm:text-base text-amber-700 dark:text-amber-500">/ {{ targetReps }}</span>
         </div>
      </div>

      <!-- Main Game Area (Centered Single Column) -->
      <div class="game-main-area w-full flex-1 relative flex justify-center items-center z-20 min-h-0">

        <!-- Live force readout: a large, glanceable % of the patient's calibrated
             max. Turns amber in-zone to reinforce the balloon's own colour cue.
             Anchored to the side so it never shifts the centred tube. -->
        <div *ngIf="gameFlowState() === 'playing'"
             class="force-readout absolute right-1 xs:right-3 top-1/2 -translate-y-1/2 flex flex-col items-center text-center select-none pointer-events-none transition-colors duration-200"
             aria-hidden="true">
          <span class="text-xs xs:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ i18n.currentLang() === 'th' ? 'แรงกด' : 'Force' }}</span>
          <span class="text-4xl xs:text-5xl font-black tabular-nums leading-none"
                [ngClass]="inTargetZone ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'">
            {{ forcePercent() }}<span class="text-lg xs:text-2xl align-top">%</span>
          </span>
        </div>

        <!-- The Balloon Track (Centered & Dynamically Sized to fill parent container height) -->
        <div class="game-track relative w-24 xs:w-28 h-[85%] xs:h-[90%] bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner flex flex-col justify-end z-10 transition-colors duration-300">
          
          <!-- Target Zone Overlay (Elderly-Friendly High-Contrast Amber/Orange with indicators) -->
          <div #targetZone *ngIf="!isReleasing"
               class="absolute w-full bg-amber-500/30 dark:bg-amber-500/40 border-y-4 border-amber-600 dark:border-amber-400 transition-all flex items-center justify-between px-1.5 xs:px-2"
               [style.bottom.%]="targetZoneVisualBottom"
               [style.height.%]="targetZoneVisualHeight">
             <i class="fa-solid fa-chevron-right text-amber-700 dark:text-amber-300 text-xs"></i>
             <span class="text-xs xs:text-sm font-black text-amber-950 dark:text-amber-100 uppercase tracking-tight whitespace-nowrap pointer-events-none select-none">{{ i18n.t('game.zone.target') }}</span>
             <i class="fa-solid fa-chevron-left text-amber-700 dark:text-amber-300 text-xs"></i>
          </div>

          <!-- Release Green Zone Overlay (Visible only when releasing for relaxation below 4.0N) -->
          <div *ngIf="isReleasing"
               class="absolute w-full bg-emerald-500/20 dark:bg-emerald-500/35 border-t-4 border-emerald-500/80 transition-all flex flex-col items-center justify-center px-1"
               style="bottom: 0;"
               [style.height.%]="restZoneVisualPercent">
             <i class="fa-solid fa-chevron-down text-emerald-600 dark:text-emerald-400 text-xs mb-0.5"></i>
             <span class="text-xs xs:text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tight whitespace-nowrap pointer-events-none select-none">{{ i18n.t('game.zone.rest') }}</span>
          </div>

          <!-- The Floating Balloon (Raised offset slightly to prevent bottom clipping) -->
          <div class="absolute w-full flex justify-center transition-all duration-75 ease-linear"
               [style.bottom.%]="balloonPosition * 0.85 + 6">
            <div #balloonBody class="w-14 h-18 xs:w-16 xs:h-20 bg-gradient-to-tr from-rose-600 to-pink-500 rounded-[50%] shadow-md relative flex items-center justify-center
                        before:content-[''] before:absolute before:-bottom-2 before:w-0 before:h-0
                        before:border-l-[5px] before:border-l-transparent before:border-r-[5px] before:border-r-transparent
                        before:border-b-[7px] before:border-b-rose-700
                        transition-transform duration-300"
                  [ngClass]="{'ring-2 ring-amber-400': inTargetZone}">
               <i class="fa-solid fa-face-smile text-white text-xl xs:text-2xl drop-shadow-md animate-pulse" *ngIf="inTargetZone"></i>
               <i class="fa-solid fa-wind text-white text-xl xs:text-2xl opacity-80" *ngIf="!inTargetZone"></i>
            </div>
            <!-- String -->
            <div class="absolute top-18 xs:top-20 w-px h-[500px] bg-gradient-to-b from-slate-300 dark:from-white/50 to-transparent"></div>
          </div>
        </div>

      </div>

      <!-- Hold/Release Progress Indicator -->
      <div class="mt-8 w-full max-w-xs xs:max-w-sm relative z-10 progress-container">
        <div class="flex justify-between text-sm xs:text-base font-bold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider transition-colors duration-300">
          <span>{{ isReleasing ? i18n.t('game.hud.releaseStatus') : i18n.t('game.hud.holdTimer') }}</span>
          <span class="text-brand-accent">{{ holdProgress | number:'1.0-0' }}%</span>
        </div>
        <div class="h-3 xs:h-4 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-white/5 transition-colors duration-300" role="progressbar" [attr.aria-valuenow]="holdProgress" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full transition-all duration-100 relative"
               [ngClass]="isReleasing ? 'bg-sky-500' : 'bg-amber-500'"
               [style.width.%]="holdProgress">
          </div>
        </div>
      </div>
      
      <!-- Feedback Text -->
      <div class="mt-4 text-center font-bold text-xl xs:text-2xl h-8 xs:h-10 transition-colors duration-300 relative z-10 feedback-container"
           [ngClass]="isReleasing ? 'text-sky-600 dark:text-sky-400' : (inTargetZone ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300')"
           role="status" aria-live="polite">
        {{ feedbackMessage }}
      </div>
    </div>
  `,
  styles: [`
    .game-card {
      box-sizing: border-box;
    }

    .game-header {
      flex-wrap: wrap;
      row-gap: 0.75rem;
    }

    .game-header-main,
    .game-header-actions {
      width: 100%;
    }

    .game-header-actions {
      justify-content: flex-end;
    }

    @media (max-height: 800px) {
      .game-card {
        padding: 0.75rem 1rem !important;
        min-height: 0 !important;
      }
      .game-header {
        padding-bottom: 0.5rem !important;
        margin-bottom: 0.5rem !important;
      }
      .game-title-container {
        margin-bottom: 0.5rem !important;
        margin-top: 0 !important;
      }
      .game-title-container h2 {
        font-size: 1.25rem !important;
      }
      .game-title-container .w-10 {
        width: 1.75rem !important;
        height: 1.75rem !important;
      }
      .game-title-container i {
        font-size: 0.875rem !important;
      }
      .progress-container {
        margin-top: 0.75rem !important;
      }
      .feedback-container {
        margin-top: 0.25rem !important;
        font-size: 1.125rem !important;
        height: auto !important;
      }
    }

    /* Landscape phones have too little vertical space for the instructional
       and confirmation content to remain centered inside the game card. Keep
       the overlay reachable and scroll only its dialog when it is taller than
       the viewport. */
    @media (orientation: landscape) and (max-height: 600px) {
      .game-overlay {
        align-items: center !important;
        justify-content: flex-start !important;
        overflow-y: auto;
        padding: 0.5rem !important;
      }

      .game-dialog {
        max-height: calc(100dvh - 2rem);
        overflow-y: auto;
        margin-block: auto;
      }
    }

    @media (max-height: 680px) {
      .game-title-container {
        margin-bottom: 0.25rem !important;
      }
      .game-title-container h2 {
        font-size: 1.125rem !important;
      }
      .game-title-container .w-10 {
        width: 1.5rem !important;
        height: 1.5rem !important;
      }
      .progress-container {
        margin-top: 0.5rem !important;
      }
      .feedback-container {
        font-size: 1rem !important;
      }
    }

    .game-card {
      height: auto !important;
      min-height: calc(100dvh - 1rem) !important;
    }

    .game-main-area {
      min-height: 18rem;
    }

    .game-track {
      height: clamp(16rem, 45dvh, 32rem);
      min-height: 16rem;
    }

    @media (prefers-reduced-motion: reduce) {
      :host ::ng-deep .animate-pulse { animation: none !important; }
      :host ::ng-deep [class*="transition"] { transition-duration: 0.01ms !important; }
      :host ::ng-deep .animate-\\[slide_1s_linear_infinite\\] { animation: none !important; }
    }
  `]
})
export class ZenBalloonComponent implements OnInit, OnDestroy {
  public i18n = inject(I18nService);
  public bleService = inject(BleService);
  public gameFlowState = signal<'ready' | 'countdown' | 'playing' | 'disconnected'>('ready');
  public countdownValue = signal<number>(3);
  public showExitConfirm = signal<boolean>(false);
  public showFinishConfirm = signal<boolean>(false);
  private countdownTimer: any;
  private voiceTimeout: any;
  private progressionPaused = false;
  private pausedFlow: 'countdown' | 'playing' | null = null;
  private router = inject(Router);
  private dialogReturnFocus: HTMLElement | null = null;
  private dialogFocusTimer: ReturnType<typeof setTimeout> | null = null;

  public isMuted = false;
  private lastVoicePlayTime = 0;
  private activeAudio: HTMLAudioElement | null = null;
  private lastGameCueAt = 0;
  private feedbackState: FeedbackState | null = null;
  private feedbackLastChangedAt = 0;
  private successFeedbackUntil = 0;
  private readonly feedbackIndices: Record<FeedbackState, number> = {
    squeeze: -1,
    hold: -1,
    holdAlmost: -1,
    tooHard: -1,
    release: -1,
    success: -1,
  };
  private readonly feedbackMessageKeys: Record<FeedbackState, string[]> = {
    squeeze: ['game.feedback.squeeze1', 'game.feedback.squeeze2', 'game.feedback.squeeze3', 'game.feedback.squeeze4'],
    hold: ['game.feedback.hold1', 'game.feedback.hold2', 'game.feedback.hold3', 'game.feedback.hold4'],
    holdAlmost: ['game.feedback.hold4', 'game.feedback.hold2', 'game.feedback.hold1'],
    tooHard: ['game.feedback.tooHard1', 'game.feedback.tooHard2', 'game.feedback.tooHard3', 'game.feedback.tooHard4'],
    release: ['game.feedback.release1', 'game.feedback.release2', 'game.feedback.release3', 'game.feedback.release4'],
    success: ['game.feedback.success1', 'game.feedback.success2', 'game.feedback.success3', 'game.feedback.success4'],
  };
  // Sustained-violation accumulator for the rest phase (see game loop)
  private restViolationMs = 0;
  // Angular animations run via WAAPI; the CSS reduced-motion rules can't stop them
  public prefersReducedMotion = typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Driven strictly by the hardware BLE signal internally
  @Input({ required: true }) currentForce!: Signal<number>;
  @Input({ required: true }) peakForce!: Signal<number>;
  
  // Dynamic scale from calibration
  @Input({ required: true }) maxForceLimit!: number;
  @Input({ required: true }) targetReps!: number;
  
  // Current rep to increase difficulty
  @Input() set currentRep(rep: number) {
    if (rep !== this.currentRepVal) {
      this.currentRepVal = rep;
      // Re-randomize target zone and increase time when rep completes
      if (rep > 0) {
        this.updateDifficulty();
      }
    }
  }
  public currentRepVal = 0;

  // Emitted safely upwards to the logic service so we avoid mutating service internals here
  @Output() repCompleted = new EventEmitter<void>();

  // Configurable Target Zone in Newtons
  public targetMin = 20;
  public targetMax = 35;

  // Visual positions in percentages
  public targetMinPercent = 0;
  public targetMaxPercent = 0;
  public releaseThresholdPercent = 0;
  public balloonPosition = 0;

  public inTargetZone = false;
  public isReleasing = false;
  private readonly releaseThreshold = 4.0; // 4.0 Newtons constant safe release threshold
  private currentRestMs = 0; // Track rest duration in milliseconds

  public holdProgress = 0; // 0 to 100 scale for progress bar
  @Input() requiredHoldTimeMs = 2000; // Configurable hold time, defaults to 2.0s
  private currentHoldMs = 0;

  public feedbackMessage = '';
  private gameloop: any;
  public sensorDataStale = signal(false);

  // Visual maximum scale of the tube, anchored to the *active* target zone.
  //
  // Anchoring to targetMax (not the raw calibrated max with a fixed 50N floor)
  // keeps the target band sitting ~⅔ up the tube for every patient. A weakly
  // calibrated user used to get a band compressed onto the floor, where the
  // resting balloon's 22%-tall body already overlapped it — so they scored a
  // hold without squeezing at all. Tying the scale to targetMax guarantees the
  // balloon must always travel a real distance to reach the zone (the track
  // also has a minimum height so text scaling cannot collapse it), while the
  // /0.78 factor leaves headroom above the band for over-press ("too hard").
  private get maxScale() {
    return Math.max(this.targetMax / 0.78, 10);
  }

  // Force needed to deliberately kick off the countdown from the ready screen.
  // Scaled to the patient's own calibration so a frail user (low max) isn't
  // made to spend most of their strength just to *start*; floored at 3N so
  // sensor noise / resting weight can't auto-start the session.
  private get startThreshold(): number {
    return Math.max(3, this.maxForceLimit * 0.25);
  }

  // Percentage display for elderly users (instead of Newton)
  public forcePercent(): number {
    if (this.maxForceLimit <= 0) return 0;
    return Math.min(999, Math.round((this.currentForce() / this.maxForceLimit) * 100));
  }

  public peakPercent(): number {
    if (this.maxForceLimit <= 0) return 0;
    return Math.min(999, Math.round((this.peakForce() / this.maxForceLimit) * 100));
  }

  getTriggerProgressPercent(): number {
    return Math.min(100, Math.round((this.currentForce() / this.startThreshold) * 100));
  }

  // The balloon is drawn at (pos * 0.85 + 6)% from the bottom, so every zone
  // must use the same mapping — otherwise the visuals drift away from the
  // in-zone logic as positions get higher.
  public get targetZoneVisualBottom(): number {
    return this.targetMinPercent * 0.85 + 6;
  }

  public get targetZoneVisualHeight(): number {
    return (this.targetMaxPercent - this.targetMinPercent) * 0.85;
  }

  // Ensure rest zone has minimum visual height of 15% for readability
  public get restZoneVisualPercent(): number {
    return Math.max(15, this.releaseThresholdPercent * 0.85 + 6);
  }

  constructor(private ngZone: NgZone, private biofeedback: BiofeedbackService, private host: ElementRef<HTMLElement>) {
    // Angular 17 Effect strictly subscribes to the hardware force stream natively
    effect(() => {
      const force = this.currentForce();

      // Calculate balloon height bounds avoiding top clipping
      let pos = (force / this.maxScale) * 100;
      if (pos > 85) pos = 85;
      if (pos < 0) pos = 0;

      this.balloonPosition = pos;

      // Update Target Zone visual percentages
      this.targetMinPercent = (this.targetMin / this.maxScale) * 100;
      this.targetMaxPercent = (this.targetMax / this.maxScale) * 100;
      this.releaseThresholdPercent = (this.releaseThreshold / this.maxScale) * 100;

      // Logic check and transition biofeedback
      
      // Guard: Do not trigger feedback or target zone evaluation if not actively playing
      if (this.gameFlowState() !== 'playing' || this.sensorDataStale() || this.progressionPaused) {
        this.inTargetZone = false;
        return;
      }
      

    }, { allowSignalWrites: true });

    // A stale-sensor overlay is a safety pause. Resume only after a fresh
    // sample arrives; opening a user confirmation dialog never auto-resumes.
    effect(() => {
      const lastSampleAt = this.bleService.lastSampleAt();
      if (lastSampleAt === null || !this.sensorDataStale() || this.progressionPaused
        || this.gameFlowState() !== 'playing' || !this.bleService.isSampleFresh()) {
        return;
      }

      this.ngZone.run(() => {
        if (!this.sensorDataStale() || this.progressionPaused || this.gameFlowState() !== 'playing') return;
        this.sensorDataStale.set(false);
        this.updateFeedback();
        this.startGameLoop();
      });
    }, { allowSignalWrites: true });

    // Freeze the session if the BLE device drops mid-game — otherwise the
    // balloon silently sticks at the last force value and the user keeps
    // pressing with no response. Resumes to the ready screen on reconnect.
    effect(() => {
      const connection = this.bleService.connectionState();
      const flow = this.gameFlowState();
      if (connection !== 'Connected' && (flow === 'playing' || flow === 'countdown')) {
        this.ngZone.run(() => this.handleDisconnect());
      } else if (connection === 'Connected' && flow === 'disconnected') {
        this.ngZone.run(() => this.startCountdown());
      }
    }, { allowSignalWrites: true });
  }

  @ViewChild('balloonBody') private balloonBody?: ElementRef<HTMLElement>;
  @ViewChild('targetZone') private targetZone?: ElementRef<HTMLElement>;

  private updateTargetContact(): void {
    // Use the rendered body so contact agrees with what the patient sees,
    // including font scaling, viewport changes and the movement transition.
    // The decorative string and knot are outside this body's bounds.
    const balloon = this.balloonBody?.nativeElement.getBoundingClientRect();
    const target = this.targetZone?.nativeElement.getBoundingClientRect();
    const touching = !this.isReleasing && !!balloon && !!target
      && balloon.height > 0 && target.height > 0
      && balloon.bottom >= target.top && balloon.top <= target.bottom
      && balloon.right >= target.left && balloon.left <= target.right;

    if (touching === this.inTargetZone) return;
    this.ngZone.run(() => {
      this.inTargetZone = touching;
      if (touching) {
        this.biofeedback.playEnterZone();
        this.biofeedback.startVibrationLoop();
      } else {
        this.biofeedback.stopVibrationLoop();
        if (this.currentHoldMs > 50) this.biofeedback.playExitZone();
      }
      this.updateFeedback();
    });
  }

  private handleDisconnect() {
    this.stopGameLoop();
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.progressionPaused = false;
    this.pausedFlow = null;
    this.showExitConfirm.set(false);
    this.showFinishConfirm.set(false);
    this.restoreDialogFocus();
    this.stopActiveFeedback();
    this.biofeedback.stopVibrationLoop();
    this.inTargetZone = false;
    this.sensorDataStale.set(false);
    this.gameFlowState.set('disconnected');
    this.playVoice('cue_disconnected.mp3', true);
  }

  goToConnect() {
    // Reconnect in place and preserve the current calibration/session.
    this.bleService.connect();
  }

  ngOnInit() {
    this.isMuted = localStorage.getItem('zen_balloon_muted') === 'true';
    // Initialize visuals for rep 0
    this.isReleasing = false;
    this.feedbackState = null;
    this.feedbackMessage = this.i18n.t('game.start.instructions');
    this.updateDifficulty();
    this.gameFlowState.set('ready');
    this.focusDialog('start');
  }

  beginSession() {
    // This click is the user gesture that safely unlocks audio on mobile browsers.
    this.playGameCue('game_intro', 'intro.mp3', true);
    this.startCountdown();
  }

  countdownInstruction(): string {
    const key = this.countdownValue() === 3
      ? 'game.countdown.three'
      : (this.countdownValue() === 2 ? 'game.countdown.two' : 'game.countdown.one');
    return this.i18n.t(key);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('zen_balloon_muted', String(this.isMuted));
    if (this.isMuted && this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
      this.biofeedback.feedbackVolumeMultiplier = 1.0;
    }
  }

  private setVoiceTimeout(callback: () => void, delay: number) {
    if (this.voiceTimeout) {
      clearTimeout(this.voiceTimeout);
    }
    this.voiceTimeout = setTimeout(callback, delay);
  }

  private stopGameLoop() {
    if (this.gameloop) {
      clearInterval(this.gameloop);
      this.gameloop = null;
    }
  }

  private stopActiveFeedback() {
    if (this.voiceTimeout) {
      clearTimeout(this.voiceTimeout);
      this.voiceTimeout = null;
    }
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    this.biofeedback.feedbackVolumeMultiplier = 1.0;
  }

  private pauseProgressionForDialog() {
    if (!this.progressionPaused) {
      const flow = this.gameFlowState();
      this.pausedFlow = flow === 'countdown' || flow === 'playing' ? flow : null;
    }
    this.progressionPaused = true;
    this.stopGameLoop();
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.inTargetZone = false;
    this.biofeedback.stopVibrationLoop();
    this.stopActiveFeedback();
  }

  private resumeProgressionAfterDialog() {
    if (!this.progressionPaused || this.gameFlowState() === 'disconnected') return;
    const pausedFlow = this.pausedFlow;
    this.progressionPaused = false;
    this.pausedFlow = null;

    if (pausedFlow === 'countdown' && this.bleService.connectionState() === 'Connected') {
      this.startCountdown(false);
    } else if (pausedFlow === 'playing'
      && this.bleService.connectionState() === 'Connected'
      && !this.sensorDataStale()
      && this.bleService.isSampleFresh()) {
      this.startGameLoop();
      this.updateFeedback();
    }
  }

  /** Plays a new game-specific cue when available, then falls back to the existing cue pack. */
  private playGameCue(cueKey: string, fallbackFilename?: string, bypassCooldown = false) {
    if (this.isMuted || this.progressionPaused || !this.i18n.voiceLanguage()) return;

    const now = Date.now();
    if (!bypassCooldown && now - this.lastGameCueAt < GAME_CUE_COOLDOWN_MS) return;
    this.lastGameCueAt = now;

    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }

    const lang = this.i18n.voiceLanguage();
    if (!lang) return;
    const path = `/assets/audio/${lang}/game/${cueKey}.mp3`;
    const audio = new Audio(path);
    this.activeAudio = audio;
    let fallbackUsed = false;

    const cleanup = () => {
      if (this.activeAudio === audio) {
        this.biofeedback.feedbackVolumeMultiplier = 1.0;
        this.activeAudio = null;
      }
    };

    const fallback = () => {
      if (!fallbackUsed && fallbackFilename) {
        fallbackUsed = true;
        this.playVoice(fallbackFilename, true);
      }
    };

    audio.onended = cleanup;
    audio.onpause = cleanup;
    audio.onerror = () => {
      cleanup();
      fallback();
    };
    this.biofeedback.feedbackVolumeMultiplier = 0.2;
    audio.play().then(() => {
      this.lastGameCueAt = Date.now();
    }).catch(() => {
      cleanup();
      fallback();
    });
  }

  private playVoice(filename: string, bypassThrottle = false) {
    if (this.isMuted || this.progressionPaused) return;

    if (!bypassThrottle && Date.now() - this.lastVoicePlayTime < 3000) {
      return;
    }

    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }

    const lang = this.i18n.voiceLanguage();
    if (!lang) return;
    const path = `/assets/audio/${lang}/${filename}`;
    const audio = new Audio(path);
    this.activeAudio = audio;

    // Duck the tone feedback volume
    this.biofeedback.feedbackVolumeMultiplier = 0.2;

    const cleanup = () => {
      if (this.activeAudio === audio) {
        this.biofeedback.feedbackVolumeMultiplier = 1.0;
        this.activeAudio = null;
      }
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    audio.onpause = cleanup;

    audio.play().then(() => {
      // Consume the throttle window only when playback actually starts —
      // a missing/failed file must not silence the next 3s of real cues
      this.lastVoicePlayTime = Date.now();
    }).catch(err => {
      console.warn(`Voice playback failed for ${path}:`, err);
      cleanup();
    });
  }

  /**
   * Run a local logic interval outside of Angular Zone to prevent memory leaks / jitter
   * Updates only sync back when visually relevant.
   */
  private startGameLoop() {
    this.stopGameLoop();
    this.ngZone.runOutsideAngular(() => {
      this.gameloop = setInterval(() => {
        if (this.progressionPaused || this.gameFlowState() !== 'playing') return;
        if (!this.bleService.isSampleFresh()) {
          this.stopGameLoop();
          this.ngZone.run(() => {
            if (!this.sensorDataStale()) {
              this.sensorDataStale.set(true);
              this.inTargetZone = false;
              this.biofeedback.stopVibrationLoop();
            }
          });
          return;
        }

        if (this.sensorDataStale()) {
          this.ngZone.run(() => {
            this.sensorDataStale.set(false);
            this.updateFeedback();
          });
          return;
        }

        const force = this.currentForce();
        this.updateTargetContact();

        if (this.isReleasing) {
          // Release phase: Wait for force to drop below threshold (4.0 Newtons)
          if (force < this.releaseThreshold) {
            this.restViolationMs = 0;
            this.currentRestMs += 50;
            const newProgress = (this.currentRestMs / 2000) * 100;
            
            this.ngZone.run(() => {
              this.holdProgress = newProgress;
              this.updateFeedback();

              if (this.currentRestMs >= 2000) {
                this.isReleasing = false;
                this.repCompleted.emit();
                this.triggerSuccessAnimation();
                this.biofeedback.playSuccess();
                this.currentHoldMs = 0;
                this.holdProgress = 0;
                this.currentRestMs = 0;
                this.updateFeedback();

              }
            });
          } else {
            // Squeezed during rest. Elderly users commonly tremor around the
            // threshold, so a momentary spike only pauses the rest counter —
            // progress resets only after a sustained (300ms) violation.
            this.restViolationMs += 50;
            if (this.restViolationMs >= 300 && (this.currentRestMs !== 0 || this.holdProgress !== 0)) {
              this.ngZone.run(() => {
                this.currentRestMs = 0;
                this.holdProgress = 0;
                this.updateFeedback();

                // Warn about squeezing during rest
                this.playVoice('cue_rest_warning.mp3');
              });
            }
          }
        } else {
          // Squeeze & Hold phase
          if (this.inTargetZone) {
            this.currentHoldMs += 50;

            if (this.currentHoldMs >= this.requiredHoldTimeMs) {
              this.ngZone.run(() => {
                this.isReleasing = true;
                this.inTargetZone = false;
                this.biofeedback.playHoldComplete();
                this.holdProgress = 0; // Starts at 0 for rest progress
                this.currentRestMs = 0;
                this.updateFeedback();

              });
            }
          } else {
            // Normal depletion if balloon exits target zone
            this.currentHoldMs -= 50;
            if (this.currentHoldMs < 0) this.currentHoldMs = 0;

            // Warn if exceeding the target zone
            // The too-hard feedback state owns its own throttled cue.
          }

          if (!this.isReleasing) {
            // Calculate view progress
            const newProgress = (this.currentHoldMs / this.requiredHoldTimeMs) * 100;

            // Sync graphics only if distinct changes occurred
            if (Math.abs(this.holdProgress - newProgress) > 1 || newProgress === 0) {
              this.ngZone.run(() => {
                this.holdProgress = newProgress;
                this.updateFeedback();
              });
            }
          }
        }
      }, 50); // 20 frames per second check aligns gracefully with 20Hz hardware rate
    });
  }

  private updateDifficulty() {
    // Hold time is kept at the configured settings value (no longer hardcoded)

    // Randomize target zone position in the range 65% - 95% of PEAK
    // Let's use a 15% width target zone.
    // targetMin is randomized between 65% and 80% (so targetMax will be 80% to 95%)
    const minPercent = 0.65;
    const maxPercent = 0.80; // 0.95 - 0.15 width = 0.80
    const randMultiplier = minPercent + Math.random() * (maxPercent - minPercent);

    this.targetMin = this.maxForceLimit * randMultiplier;
    this.targetMax = this.targetMin + (this.maxForceLimit * 0.15);

    // Ensure values don't go below minimum safe threshold (e.g. 5 Newtons)
    if (this.targetMin < 5) {
      this.targetMin = 5;
      this.targetMax = Math.max(10, this.targetMax);
    }

    // Update visuals
    this.targetMinPercent = (this.targetMin / this.maxScale) * 100;
    this.targetMaxPercent = (this.targetMax / this.maxScale) * 100;
    this.releaseThresholdPercent = (this.releaseThreshold / this.maxScale) * 100;
  }

  private updateFeedback() {
    if (this.feedbackState === 'success' && Date.now() < this.successFeedbackUntil) return;

    let state: FeedbackState;
    let replacement: string | undefined;

    if (this.isReleasing) {
      const restTimeSec = Math.max(0, Math.ceil((2000 - this.currentRestMs) / 1000));
      if (this.currentForce() >= this.releaseThreshold) {
        state = 'release';
      } else {
        state = 'release';
        replacement = String(restTimeSec);
      }
    } else if (this.inTargetZone && this.holdProgress > 50) {
      state = 'holdAlmost';
    } else if (this.inTargetZone) {
      state = 'hold';
    } else if (this.currentForce() < this.targetMin) {
      state = 'squeeze';
    } else {
      state = 'tooHard';
    }

    this.applyFeedbackState(state, replacement, true);
  }

  private applyFeedbackState(state: FeedbackState, replacement?: string, announce = false) {
    const now = Date.now();
    const stateChanged = state !== this.feedbackState;
    if (!stateChanged && now - this.feedbackLastChangedAt < FEEDBACK_ROTATE_MS) return;

    const choices = this.feedbackMessageKeys[state];
    let nextIndex = (this.feedbackIndices[state] + 1) % choices.length;
    const previousMessage = this.feedbackMessage;
    let nextMessage = this.i18n.t(choices[nextIndex]);
    if (choices.length > 1 && nextMessage === previousMessage) {
      nextIndex = (nextIndex + 1) % choices.length;
      nextMessage = this.i18n.t(choices[nextIndex]);
    }

    this.feedbackIndices[state] = nextIndex;
    this.feedbackState = state;
    this.feedbackLastChangedAt = now;
    this.feedbackMessage = replacement ? nextMessage.replace('{0}', replacement) : nextMessage;

    if (announce && stateChanged) {
      const cueMap: Record<FeedbackState, { prefix: string; fallback?: string }> = {
        squeeze: { prefix: 'game_squeeze', fallback: 'cue_squeeze.mp3' },
        hold: { prefix: 'game_hold', fallback: 'cue_hold.mp3' },
        holdAlmost: { prefix: 'game_hold', fallback: 'cue_hold.mp3' },
        tooHard: { prefix: 'game_too_hard', fallback: 'cue_too_hard.mp3' },
        release: { prefix: 'game_release', fallback: 'cue_release.mp3' },
        success: { prefix: 'game_success', fallback: 'cue_rep_success.mp3' },
      };
      const cue = cueMap[state];
      const cueNumber = String(this.feedbackIndices[state] + 1).padStart(2, '0');
      this.playGameCue(`${cue.prefix}_${cueNumber}`, cue.fallback);
    }
  }

  private triggerSuccessAnimation() {
    this.successFeedbackUntil = Date.now() + 1800;
    this.applyFeedbackState('success', undefined, true);
    this.holdProgress = 100;
  }

  goBack() {
    // Leaving abandons the current training session, so always confirm first.
    this.pauseProgressionForDialog();
    this.rememberDialogFocus();
    this.showExitConfirm.set(true);
    this.focusDialog('exit');
  }

  confirmExit() {
    this.router.navigate(['/dashboard']);
  }

  cancelExit() {
    this.showExitConfirm.set(false);
    this.resumeProgressionAfterDialog();
    this.restoreDialogFocus();
  }

  finishSession() {
    // Mid-session early-finish discards nothing (it saves to /summary), but a
    // stray tap before reaching the target still surprises the patient — so
    // confirm whenever they finish short.
    if (this.gameFlowState() === 'playing' && this.currentRepVal < this.targetReps) {
      this.pauseProgressionForDialog();
      this.rememberDialogFocus();
      this.showFinishConfirm.set(true);
      this.focusDialog('finish');
      return;
    }
    this.router.navigate(['/summary']);
  }

  confirmFinish() {
    this.showFinishConfirm.set(false);
    this.router.navigate(['/summary']);
  }

  cancelFinish() {
    this.showFinishConfirm.set(false);
    this.resumeProgressionAfterDialog();
    this.restoreDialogFocus();
  }

  /** Keep keyboard and switch-control users inside the active confirmation dialog. */
  @HostListener('document:keydown', ['$event'])
  onDialogKeydown(event: KeyboardEvent) {
    const dialog = this.getActiveDialog();
    if (!dialog) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.showExitConfirm()) this.cancelExit();
      else if (this.showFinishConfirm()) this.cancelFinish();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getActiveDialog(): HTMLElement | null {
    const dialogType = this.showExitConfirm()
      ? 'exit'
      : (this.showFinishConfirm() ? 'finish' : (this.gameFlowState() === 'ready' ? 'start' : null));
    return dialogType ? this.host.nativeElement.querySelector(`[data-dialog="${dialogType}"]`) : null;
  }

  private rememberDialogFocus() {
    if (!this.getActiveDialog() && document.activeElement instanceof HTMLElement) {
      this.dialogReturnFocus = document.activeElement;
    }
  }

  private focusDialog(dialogType: 'exit' | 'finish' | 'start') {
    if (this.dialogFocusTimer) clearTimeout(this.dialogFocusTimer);
    this.dialogFocusTimer = setTimeout(() => {
      const dialog = this.host.nativeElement.querySelector<HTMLElement>(`[data-dialog="${dialogType}"]`);
      const firstButton = dialog?.querySelector<HTMLElement>('button:not([disabled])');
      firstButton?.focus();
      this.dialogFocusTimer = null;
    });
  }

  private restoreDialogFocus() {
    const returnFocus = this.dialogReturnFocus;
    this.dialogReturnFocus = null;
    if (this.dialogFocusTimer) {
      clearTimeout(this.dialogFocusTimer);
      this.dialogFocusTimer = null;
    }
    setTimeout(() => returnFocus?.focus());
  }

  startCountdown(resetCountdown = true) {
    this.progressionPaused = false;
    this.pausedFlow = null;
    this.gameFlowState.set('countdown');
    if (resetCountdown) this.countdownValue.set(3);
    // Audible tick per second so the start moment registers even with eyes
    // on the chin movement; a higher tone marks the actual start
    this.biofeedback.playTone(659.25, 'sine', 150, 0.1);

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    this.countdownTimer = setInterval(() => {
      this.ngZone.run(() => {
        const currentVal = this.countdownValue();
        if (currentVal <= 1) {
          clearInterval(this.countdownTimer);
          this.biofeedback.playTone(880, 'sine', 300, 0.12);
          this.startGame();
        } else {
          this.countdownValue.set(currentVal - 1);
          this.biofeedback.playTone(659.25, 'sine', 150, 0.1);
        }
      });
    }, 1000);
  }

  startGame() {
    this.progressionPaused = false;
    this.pausedFlow = null;
    this.gameFlowState.set('playing');
    this.isReleasing = false;
    this.holdProgress = 0;
    this.currentHoldMs = 0;
    this.feedbackState = null;
    this.sensorDataStale.set(!this.bleService.isSampleFresh());
    this.updateFeedback();
    
    this.startGameLoop();
  }

  ngOnDestroy() {
    this.stopGameLoop();
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.voiceTimeout) clearTimeout(this.voiceTimeout);
    if (this.dialogFocusTimer) {
      clearTimeout(this.dialogFocusTimer);
    }
    this.biofeedback.stopVibrationLoop();
    this.stopActiveFeedback();
  }
}
