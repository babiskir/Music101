import { describe, expect, it } from 'vitest';
import { comboBonus, starsFor, starText } from './scoring';

describe('starsFor', () => {
  it('maps accuracy to stars', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.9)).toBe(3);
    expect(starsFor(0.75)).toBe(2);
    expect(starsFor(0.4)).toBe(1);
    expect(starsFor(0.2)).toBe(0);
    expect(starsFor(0)).toBe(0);
  });
  it('never gives stars for nonsense', () => {
    expect(starsFor(NaN)).toBe(0);
  });
});

describe('comboBonus', () => {
  it('grows by 10 per hit and stops at 100', () => {
    expect(comboBonus(0)).toBe(0);
    expect(comboBonus(3)).toBe(30);
    expect(comboBonus(25)).toBe(100);
    expect(comboBonus(-2)).toBe(0);
  });
});

describe('starText', () => {
  it('always shows three stars', () => {
    expect(starText(2)).toBe('★★☆');
    expect(starText(0)).toBe('☆☆☆');
  });
});
