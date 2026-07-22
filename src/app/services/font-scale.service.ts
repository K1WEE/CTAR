import { Injectable, signal } from '@angular/core';

export type FontScale = 'normal' | 'large' | 'xlarge';

const FONT_SCALE_PERCENT: Record<FontScale, number> = {
  normal: 100,
  large: 112.5,
  xlarge: 125,
};

const FONT_SCALE_STORAGE_KEY = 'ctar_font_scale';

@Injectable({
  providedIn: 'root',
})
export class FontScaleService {
  public readonly fontScale = signal<FontScale>(this.readSavedScale());

  constructor() {
    this.applyScale(this.fontScale());
  }

  setFontScale(scale: FontScale): void {
    this.fontScale.set(scale);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
    this.applyScale(scale);
  }

  scalePercent(scale: FontScale): number {
    return FONT_SCALE_PERCENT[scale];
  }

  private readSavedScale(): FontScale {
    const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  }

  private applyScale(scale: FontScale): void {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${this.scalePercent(scale)}%`;
    }
  }
}
