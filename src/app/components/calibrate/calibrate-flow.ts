export type CalibrationState = 'intro' | 'waiting' | 'pulling' | 'finished';

export function calibrationStepForState(state: CalibrationState): 1 | 2 | 3 {
  if (state === 'intro') return 1;
  if (state === 'finished') return 3;
  return 2;
}
