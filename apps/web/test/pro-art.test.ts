import { describe, expect, it } from 'vitest';
import { monogram } from '../src/draw/pro-art';

describe('pro monogram', () => {
  it('writes initials the way darts fans do', () => {
    expect(monogram('Michael van Gerwen')).toBe('MvG');
    expect(monogram('Raymond van Barneveld')).toBe('RvB');
    expect(monogram('Dirk van Duijvenbode')).toBe('DvD');
    expect(monogram('Luke Littler')).toBe('LL');
    expect(monogram('Jesús Noguera')).toBe('JN');
  });
});
