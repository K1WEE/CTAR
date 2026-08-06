import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontScale, FontScaleService } from '../../services/font-scale.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-font-scale-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="inline
      ? 'font-scale-control relative z-40'
      : 'font-scale-control fixed top-[12px] right-[12px] z-50 sm:top-[16px] sm:right-[16px]'">
      <button
        type="button"
        (click)="toggleOpen()"
        [attr.aria-expanded]="isOpen()"
        aria-controls="font-scale-options"
        [attr.aria-label]="i18n.t('accessibility.fontSize')"
        [class.rounded-xl]="inline"
        [class.rounded-full]="!inline"
        class="h-11 min-w-11 border border-slate-300/80 bg-slate-100/95 px-3 text-[16px] font-black text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-200 dark:border-slate-600/80 dark:bg-slate-800/95 dark:text-slate-100 dark:hover:bg-slate-700">
        <span aria-hidden="true" class="sm:mr-1">Aa</span>
        <span class="hidden sm:inline">{{ i18n.t('accessibility.fontSize') }}</span>
      </button>

      <div
        *ngIf="isOpen()"
        id="font-scale-options"
        role="group"
        [attr.aria-label]="i18n.t('accessibility.fontSize')"
        class="absolute right-0 z-50 mt-2 min-w-[190px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          *ngFor="let option of options"
          type="button"
          data-font-preset
          [attr.data-font-preset]="option"
          [attr.aria-pressed]="fontScale.fontScale() === option"
          (click)="selectScale(option)"
          class="mb-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-left text-label font-bold transition-colors last:mb-0"
          [ngClass]="fontScale.fontScale() === option
            ? 'bg-blue-600 text-white'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'">
          {{ labelFor(option) }}
        </button>
      </div>
      <p role="status" aria-live="polite" class="sr-only">{{ statusMessage() }}</p>
    </div>
  `,
})
export class FontScaleControlComponent {
  @Input() inline = false;
  public readonly fontScale = inject(FontScaleService);
  public readonly i18n = inject(I18nService);
  public readonly isOpen = signal(false);
  public readonly statusMessage = signal('');
  public readonly options: FontScale[] = ['normal', 'large', 'xlarge'];

  toggleOpen(): void {
    this.isOpen.update(open => !open);
  }

  selectScale(scale: FontScale): void {
    this.fontScale.setFontScale(scale);
    this.statusMessage.set(this.i18n.t('accessibility.fontSizeApplied')
      .replace('{0}', this.labelFor(scale)));
    this.isOpen.set(false);
  }

  labelFor(scale: FontScale): string {
    const key: Record<FontScale, string> = {
      normal: 'accessibility.fontSizeNormal',
      large: 'accessibility.fontSizeLarge',
      xlarge: 'accessibility.fontSizeXLarge',
    };
    return this.i18n.t(key[scale]);
  }
}
