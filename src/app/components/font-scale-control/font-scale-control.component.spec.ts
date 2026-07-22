import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontScaleControlComponent } from './font-scale-control.component';
import { FontScaleService } from '../../services/font-scale.service';

describe('FontScaleControlComponent', () => {
  let fixture: ComponentFixture<FontScaleControlComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FontScaleControlComponent],
      providers: [FontScaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(FontScaleControlComponent);
    fixture.detectChanges();
  });

  it('opens three labeled font-size presets', () => {
    const trigger = fixture.nativeElement.querySelector('button');
    trigger.click();
    fixture.detectChanges();

    const presetButtons = fixture.nativeElement.querySelectorAll('[data-font-preset]');
    expect(presetButtons.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('ปกติ');
    expect(fixture.nativeElement.textContent).toContain('ใหญ่');
    expect(fixture.nativeElement.textContent).toContain('ใหญ่มาก');
  });

  it('marks the selected preset and announces the change', () => {
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    const largeButton = fixture.nativeElement.querySelector('[data-font-preset="large"]');
    largeButton.click();
    fixture.detectChanges();

    expect(largeButton.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent)
      .toContain('ใหญ่');
  });
});
