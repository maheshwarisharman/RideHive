import { calculateExactSplit, formatPaise, formatDistance, formatDuration } from '../formatters';

describe('formatters', () => {
  describe('formatPaise', () => {
    it('formats integer rupees without decimals', () => {
      expect(formatPaise(5000)).toBe('₹50');
      expect(formatPaise(11200)).toBe('₹112');
    });

    it('formats rupees with fractional paise', () => {
      expect(formatPaise(11250)).toBe('₹112.50');
      expect(formatPaise(33)).toBe('₹0.33');
    });
  });

  describe('formatDistance', () => {
    it('formats meters when less than 1km', () => {
      expect(formatDistance(450)).toBe('450 m');
    });

    it('formats kilometers when 1km or more', () => {
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(12345)).toBe('12.3 km');
    });
  });

  describe('formatDuration', () => {
    it('formats minutes', () => {
      expect(formatDuration(1800)).toBe('30 min');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1 hr');
      expect(formatDuration(4500)).toBe('1 hr 15 min');
    });
  });

  describe('calculateExactSplit', () => {
    it('splits evenly when divisible', () => {
      const split = calculateExactSplit(40000, 4); // ₹400 for 4 people
      expect(split).toEqual([10000, 10000, 10000, 10000]);
      expect(split.reduce((a, b) => a + b, 0)).toBe(40000);
    });

    it('distributes remainder paise correctly', () => {
      const split = calculateExactSplit(10001, 3); // 10001 paise split 3 ways
      expect(split).toEqual([3334, 3334, 3333]);
      expect(split.reduce((a, b) => a + b, 0)).toBe(10001);
    });

    it('handles 1 member', () => {
      expect(calculateExactSplit(5500, 1)).toEqual([5500]);
    });

    it('returns empty array for 0 or negative members', () => {
      expect(calculateExactSplit(5500, 0)).toEqual([]);
    });
  });
});
