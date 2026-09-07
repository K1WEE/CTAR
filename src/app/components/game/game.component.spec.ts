import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GameComponent } from './game.component';
import { CtarLogicService } from '../../services/ctar-logic.service';
import { DataSyncService } from '../../services/data-sync.service';
import { SupabaseService } from '../../services/supabase.service';

describe('GameComponent patient settings', () => {
  it('uses the patient target and hold duration while rejecting excess rep events', async () => {
    const repCount = signal(0);
    const fetchPatientProfile = jasmine.createSpy().and.resolveTo({
      target_reps: 3,
      hold_duration_ms: 4000,
    });
    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        provideRouter([]),
        { provide: CtarLogicService, useValue: {
          repCount,
          calibrationMaxForce: signal(20),
          resetSession: () => repCount.set(0),
        } },
        { provide: SupabaseService, useValue: { currentUser: signal({ id: 'patient-1' }) } },
        { provide: DataSyncService, useValue: { fetchPatientProfile } },
      ],
    }).overrideComponent(GameComponent, { set: { template: '', imports: [] } }).compileComponents();

    const fixture = TestBed.createComponent(GameComponent);
    const component = fixture.componentInstance;
    await component.ngOnInit();

    expect(fetchPatientProfile).toHaveBeenCalledWith('patient-1');
    expect(component.targetReps()).toBe(3);
    expect(component.holdDurationMs()).toBe(4000);
    for (let event = 0; event < 5; event++) component.onGameRep();
    expect(repCount()).toBe(3);
    fixture.destroy();
  });
});
