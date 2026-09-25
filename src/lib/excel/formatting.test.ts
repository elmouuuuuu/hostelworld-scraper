import { describe, it, expect } from 'vitest';
import { sanitizeForExcel } from './formatting';

describe('sanitizeForExcel', () => {
  it('prefixes a string starting with = (formula trigger)', () => {
    expect(sanitizeForExcel('=HYPERLINK("http://evil.com")')).toBe('\'=HYPERLINK("http://evil.com")');
  });

  it('prefixes a string starting with @', () => {
    expect(sanitizeForExcel('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });

  it('prefixes a string starting with +', () => {
    expect(sanitizeForExcel('+1 234 555')).toBe("'+1 234 555");
  });

  it('prefixes a string starting with -', () => {
    expect(sanitizeForExcel('-1+1')).toBe("'-1+1");
  });

  it('leaves a normal hostel name untouched', () => {
    expect(sanitizeForExcel('Sun & Moon Hostel')).toBe('Sun & Moon Hostel');
  });

  it('leaves a normal city name untouched', () => {
    expect(sanitizeForExcel('Barcelona')).toBe('Barcelona');
  });

  it('leaves an empty string untouched', () => {
    expect(sanitizeForExcel('')).toBe('');
  });

  it('does not affect a dangerous character that is not at the start', () => {
    expect(sanitizeForExcel('Hostel = The Best')).toBe('Hostel = The Best');
  });
});
