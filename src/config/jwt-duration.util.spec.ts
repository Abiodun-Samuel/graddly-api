import { parseDurationToSeconds } from './jwt-duration.util.js';

describe('parseDurationToSeconds', () => {
  it('parses minutes', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
  });

  it('parses days', () => {
    expect(parseDurationToSeconds('7d')).toBe(604_800);
  });

  it('returns fallback for invalid input', () => {
    expect(parseDurationToSeconds('invalid', 42)).toBe(42);
  });
});
