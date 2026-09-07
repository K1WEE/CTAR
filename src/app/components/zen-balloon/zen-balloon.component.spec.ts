import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ZenBalloonComponent } from './zen-balloon.component';
import { BleService } from '../../services/ble.service';
import { BiofeedbackService } from '../../services/biofeedback.service';

describe('ZenBalloonComponent target contact', () => {
  let fixture: ComponentFixture<ZenBalloonComponent>;
  let component: ZenBalloonComponent;
  let force = signal(0);
  let balloonRect: DOMRect;
  let fresh = true;
  let feedback: jasmine.SpyObj<BiofeedbackService>;

  beforeEach(async () => {
    localStorage.setItem('zen_balloon_muted', 'true');
    force = signal(10);
    fresh = true;
    feedback = jasmine.createSpyObj('BiofeedbackService', [
      'playEnterZone', 'startVibrationLoop', 'stopVibrationLoop', 'playExitZone',
      'playHoldComplete', 'playSuccess', 'playTone',
    ]);
    await TestBed.configureTestingModule({
      imports: [ZenBalloonComponent, NoopAnimationsModule],
      providers: [provideRouter([]),
        { provide: BiofeedbackService, useValue: feedback },
        { provide: BleService, useValue: {
          connectionState: signal('Connected'), lastSampleAt: signal(1),
          isSampleFresh: () => fresh,
        } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ZenBalloonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentForce', force);
    fixture.componentRef.setInput('peakForce', signal(20));
    fixture.componentRef.setInput('maxForceLimit', 20);
    fixture.componentRef.setInput('targetReps', 10);
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.game-track > div:last-child > div');
    const target = fixture.nativeElement.querySelector('.game-track > div:first-child');
    balloonRect = new DOMRect(20, 151, 60, 80);
    spyOn(body, 'getBoundingClientRect').and.callFake(() => balloonRect);
    spyOn(target, 'getBoundingClientRect').and.returnValue(new DOMRect(0, 100, 100, 50));
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.removeItem('zen_balloon_muted');
  });

  it('counts either edge or any overlap, and stops when fully outside', fakeAsync(() => {
    component.startGame();
    fixture.detectChanges();
    // Force is below the target; the rendered body's contact is what counts.
    expect(force()).toBeLessThan(component.targetMin);
    tick(50);
    expect(component.inTargetZone).toBeFalse();
    for (const top of [150, 125, 70, 20]) {
      balloonRect = new DOMRect(20, top, 60, 80);
      tick(50);
      expect(component.inTargetZone).withContext(`balloon top ${top}`).toBeTrue();
    }
    balloonRect = new DOMRect(20, 19, 60, 80);
    tick(50);
    expect(component.inTargetZone).toBeFalse();
    expect(feedback.playEnterZone).toHaveBeenCalledTimes(1);
    expect(feedback.stopVibrationLoop).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('requires two seconds of contact then two seconds of released force for a rep', fakeAsync(() => {
    const completed = spyOn(component.repCompleted, 'emit');
    balloonRect = new DOMRect(20, 150, 60, 80);
    component.startGame();
    fixture.detectChanges();
    tick(1950);
    expect(component.isReleasing).toBeFalse();
    expect(completed).not.toHaveBeenCalled();
    tick(50);
    expect(component.isReleasing).toBeTrue();
    force.set(0);
    fixture.detectChanges();
    tick(1950);
    expect(completed).not.toHaveBeenCalled();
    tick(50);
    expect(completed).toHaveBeenCalledTimes(1);
    component.ngOnDestroy();
  }));

  it('preserves the configured hold duration when starting a round', fakeAsync(() => {
    fixture.componentRef.setInput('requiredHoldTimeMs', 3000);
    balloonRect = new DOMRect(20, 150, 60, 80);
    component.startGame();
    fixture.detectChanges();
    tick(2000);
    expect(component.isReleasing).toBeFalse();
    tick(1000);
    expect(component.isReleasing).toBeTrue();
    component.ngOnDestroy();
  }));

  it('does not progress while paused or receiving stale sensor data', fakeAsync(() => {
    balloonRect = new DOMRect(20, 150, 60, 80);
    component.startGame();
    fixture.detectChanges();
    tick(500);
    component.goBack();
    fixture.detectChanges();
    const progress = component.holdProgress;
    tick(2500);
    expect(component.holdProgress).toBe(progress);
    expect(component.isReleasing).toBeFalse();
    component.cancelExit();
    fresh = false;
    tick(50);
    expect(component.sensorDataStale()).toBeTrue();
    expect(component.inTargetZone).toBeFalse();
    tick(2500);
    expect(component.isReleasing).toBeFalse();
    component.ngOnDestroy();
  }));
});
