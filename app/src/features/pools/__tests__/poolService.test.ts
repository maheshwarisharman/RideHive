import { poolService } from '../poolService';

describe('poolService', () => {
  describe('calculateFareEstimate', () => {
    it('calculates estimate based on distance in meters', () => {
      // 20 km = 20,000 meters
      // Base: ₹50 (5000 paise) + 20 * ₹14 (28000 paise) = 33000 paise (₹330)
      const fare = poolService.calculateFareEstimate(20000, 4);

      expect(fare.estimatedPaise).toBe(33000);
      expect(fare.minPaise).toBe(Math.round(33000 * 0.9));
      expect(fare.maxPaise).toBe(Math.round(33000 * 1.15));
      expect(fare.perPersonPaise).toBe(Math.round(33000 / 4));
    });

    it('handles zero or negative distance with 1km floor', () => {
      const fare = poolService.calculateFareEstimate(0, 4);
      expect(fare.estimatedPaise).toBeGreaterThan(0);
    });

    it('divides fare per person correctly across seats', () => {
      const fare = poolService.calculateFareEstimate(40000, 5); // 40 km, 5 people
      expect(fare.perPersonPaise).toBe(Math.round(fare.estimatedPaise / 5));
    });
  });
});
