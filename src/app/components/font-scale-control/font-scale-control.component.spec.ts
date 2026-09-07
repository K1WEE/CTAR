import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontScaleControlComponent } from './font-scale-control.component';
import { FontScaleService } from '../../services/font-scale.service';

 describe('FontScaleControlComponent', () => {
  let fixture: ComponentFixture<FontScaleControlComponent>;
  let service: FontScaleService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FontScaleControlComponent],
      providers: [FontScaleService],
    }).compileComponents();
    service = TestBed.inject(FontScaleService);
    fixture = TestBed.createComponent(FontScaleControlComponent);
    fixture.detectChanges();
  });

  afterEach(() => service.setFontScale('normal'));

  it('cycles normal, large, extra large and back using one button', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('ปกติ');
    for (const [scale, label] of [['large', 'ใหญ่'], ['xlarge', 'ใหญ่มาก'], ['normal', 'ปกติ']]) {
      button.click();
      fixture.detectChanges();
      expect(service.fontScale()).toBe(scale);
      expect(localStorage.getItem('ctar_font_scale')).toBe(scale);
      expect(button.textContent).toContain(label);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(label);
      expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
      expect(button.hasAttribute('aria-expanded')).toBeFalse();
    }
  });

  it('continues from the saved setting and keeps keyboard focus', () => {
    service.setFontScale('xlarge');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();
    expect(button.getAttribute('aria-label')).toContain('กดเพื่อเปลี่ยนเป็นปกติ');
    button.click();
    fixture.detectChanges();
    expect(service.fontScale()).toBe('normal');
    expect(document.activeElement).toBe(button);
  });
});
