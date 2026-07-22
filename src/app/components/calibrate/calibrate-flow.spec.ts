import { calibrationStepForState } from './calibrate-flow';

describe('calibrationStepForState', () => {
  it('maps connection states to the first wizard step', () => {
    expect(calibrationStepForState('intro')).toBe(1);
  });

  it('keeps the force test states on the second wizard step', () => {
    expect(calibrationStepForState('waiting')).toBe(2);
    expect(calibrationStepForState('pulling')).toBe(2);
  });

  it('moves to the final ready step after calibration completes', () => {
    expect(calibrationStepForState('finished')).toBe(3);
  });
});
