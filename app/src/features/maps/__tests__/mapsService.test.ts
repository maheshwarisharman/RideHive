import { mapsService } from '../mapsService';

describe('mapsService', () => {
  describe('haversineDistance', () => {
    it('calculates approximate distance between campus and IGI Airport', () => {
      // BMU campus: ~28.2476, 76.8139
      // IGI Airport T3: ~28.5561, 77.0863
      const distance = mapsService.haversineDistance(
        28.24765,
        76.81395,
        28.55616,
        77.08638
      );

      // Should be around ~43-46 km in direct line
      expect(distance).toBeGreaterThan(40000);
      expect(distance).toBeLessThan(50000);
    });

    it('returns 0 for identical points', () => {
      const distance = mapsService.haversineDistance(28.24, 76.81, 28.24, 76.81);
      expect(distance).toBe(0);
    });
  });

  describe('decodePolyline', () => {
    it('decodes google encoded polyline string into coordinates', () => {
      // Standard google polyline example: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      const sample = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
      const points = mapsService.decodePolyline(sample);

      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toHaveProperty('latitude');
      expect(points[0]).toHaveProperty('longitude');
      expect(typeof points[0].latitude).toBe('number');
      expect(typeof points[0].longitude).toBe('number');
    });

    it('returns empty array for empty string', () => {
      expect(mapsService.decodePolyline('')).toEqual([]);
    });
  });
});
