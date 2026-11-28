import { describe, expect, it } from 'vitest';
import { staffFor } from './grand';

describe('the grand staff', () => {
  it('middle Do (C) and up is the right hand, below it the left', () => {
    expect(staffFor(60, 'grand')).toBe('treble');
    expect(staffFor(59, 'grand')).toBe('bass');
    expect(staffFor(72, 'grand')).toBe('treble');
  });

  it('a single staff keeps every note', () => {
    expect(staffFor(40, 'treble')).toBe('treble');
    expect(staffFor(80, 'bass')).toBe('bass');
  });
});
