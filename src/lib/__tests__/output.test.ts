import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { print } from '../output.js';

describe('print', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('in jsonMode outputs JSON as single line', () => {
    print({ foo: 'bar', n: 1 }, true);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('{"foo":"bar","n":1}');
  });

  it('without jsonMode outputs text (multiple log calls)', () => {
    print({ a: 1, b: 'two' }, false);
    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls.some((s: unknown) => String(s).includes('a:') && String(s).includes('1'))).toBe(true);
    expect(calls.some((s: unknown) => String(s).includes('b:') && String(s).includes('two'))).toBe(true);
  });

  it('array in jsonMode serializes to JSON', () => {
    print([1, 2, 3], true);
    expect(logSpy).toHaveBeenCalledWith('[1,2,3]');
  });
});
