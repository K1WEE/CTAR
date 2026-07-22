import { TestBed } from '@angular/core/testing';
import { FontScaleService } from './font-scale.service';

describe('FontScaleService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = '';
    TestBed.resetTestingModule();
  });

  it('starts at normal when there is no saved preference', () => {
    const service = TestBed.inject(FontScaleService);

    expect(service.fontScale()).toBe('normal');
    expect(document.documentElement.style.fontSize).toBe('100%');
  });

  it('restores and applies a saved preset', () => {
    localStorage.setItem('ctar_font_scale', 'xlarge');
    const service = TestBed.inject(FontScaleService);

    expect(service.fontScale()).toBe('xlarge');
    expect(document.documentElement.style.fontSize).toBe('125%');
  });

  it('persists and applies a newly selected preset', () => {
    const service = TestBed.inject(FontScaleService);

    service.setFontScale('large');

    expect(service.fontScale()).toBe('large');
    expect(localStorage.getItem('ctar_font_scale')).toBe('large');
    expect(document.documentElement.style.fontSize).toBe('112.5%');
  });
});
