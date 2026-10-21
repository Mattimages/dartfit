import { describe, expect, it } from 'vitest';
import { formatDate, formatNum } from '../src/format';

describe('formatNum', () => {
  it('keeps the zeros of whole numbers', () => {
    expect(formatNum(20.04, 0, 'nl')).toBe('20');
    expect(formatNum(30, 0, 'en')).toBe('30');
    expect(formatNum(100.2, 0, 'en')).toBe('100');
    expect(formatNum(9.96, 1, 'en')).toBe('10');
    expect(formatNum(50, 1, 'nl')).toBe('50');
  });
  it('drops trailing decimal zeros only', () => {
    expect(formatNum(6.5, 2, 'en')).toBe('6.5');
    expect(formatNum(22.0, 1, 'en')).toBe('22');
    expect(formatNum(6.55, 2, 'en')).toBe('6.55');
  });
  it('uses a decimal comma in Dutch', () => {
    expect(formatNum(45.54, 1, 'nl')).toBe('45,5');
    expect(formatNum(-0.04, 1, 'nl')).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats ISO dates per language', () => {
    expect(formatDate('2026-10-20', 'nl')).toBe('20 okt 2026');
    expect(formatDate('2026-10-20', 'en')).toBe('20 Oct 2026');
    expect(formatDate('soon', 'en')).toBe('soon');
  });
});
