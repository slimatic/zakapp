import { formatPercentage } from '../formatters';

describe('formatters', () => {
  it('formats decimal input correctly when isDecimal=true', () => {
    expect(formatPercentage(0.7, 1, true)).toBe('70.0%');
    expect(formatPercentage(0.3333, 1, true)).toBe('33.3%');
  });

  it('formats percentage input correctly when isDecimal=false', () => {
    expect(formatPercentage(70, 1, false)).toBe('70.0%');
  });
});