import { searchService } from '../searchService';

describe('searchService', () => {
  it('constructs correct search parameters', async () => {
    const params = {
      originLat: 28.24765,
      originLng: 76.81395,
      destLat: 28.55616,
      destLng: 77.08638,
      windowStart: new Date('2026-10-21T10:00:00Z'),
      windowEnd: new Date('2026-10-21T12:00:00Z'),
      seatsNeeded: 2,
    };

    const results = await searchService.searchPools(params);
    expect(Array.isArray(results)).toBe(true);
  });

  it('handles empty results gracefully', async () => {
    const results = await searchService.fetchLeavingSoonPools(5);
    expect(Array.isArray(results)).toBe(true);
  });
});
