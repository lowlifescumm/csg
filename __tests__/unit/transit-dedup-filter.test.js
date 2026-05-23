const crypto = require('crypto');

describe('Transit Deduplication and Filtering - GSTA-303', () => {
  let transitsModule;

  beforeAll(async () => {
    transitsModule = await import('../../lib/transits.js');
  });
  let transitEngine;

  beforeAll(async () => {
    transitEngine = await import('../../lib/transit-engine.js');
  });

  describe('generateTransitIdentityHash', () => {
    test('produces a stable SHA-256 hash for same inputs', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      expect(h1).toBe(h2);
    });

    test('produces different hashes for different transit bodies', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Jupiter', 'Sun', 'conjunction');
      expect(h1).not.toBe(h2);
    });

    test('produces different hashes for different natal points', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Moon', 'conjunction');
      expect(h1).not.toBe(h2);
    });

    test('produces different hashes for different aspects', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'opposition');
      expect(h1).not.toBe(h2);
    });

    test('produces different hashes for different users', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user2', 'chart1', 'Saturn', 'Sun', 'conjunction');
      expect(h1).not.toBe(h2);
    });

    test('produces different hashes for different charts', () => {
      const h1 = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      const h2 = transitEngine.generateTransitIdentityHash('user1', 'chart2', 'Saturn', 'Sun', 'conjunction');
      expect(h1).not.toBe(h2);
    });

    test('returns a hex string of expected length', () => {
      const hash = transitEngine.generateTransitIdentityHash('user1', 'chart1', 'Saturn', 'Sun', 'conjunction');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('isTodayOrFuture', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-22T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns true for today', () => {
      expect(transitEngine.isTodayOrFuture(new Date('2026-05-22T10:00:00Z'))).toBe(true);
    });

    test('returns true for a future date', () => {
      expect(transitEngine.isTodayOrFuture(new Date('2026-06-15T00:00:00Z'))).toBe(true);
    });

    test('returns false for a past date', () => {
      expect(transitEngine.isTodayOrFuture(new Date('2025-12-31T00:00:00Z'))).toBe(false);
    });

    test('returns false for dates far in the past', () => {
      expect(transitEngine.isTodayOrFuture(new Date('2023-06-01T00:00:00Z'))).toBe(false);
    });

    test('returns false for null/undefined', () => {
      expect(transitEngine.isTodayOrFuture(null)).toBe(false);
      expect(transitEngine.isTodayOrFuture(undefined)).toBe(false);
    });

    test('returns false for invalid date', () => {
      expect(transitEngine.isTodayOrFuture(new Date('invalid'))).toBe(false);
    });

    test('handles string date input', () => {
      expect(transitEngine.isTodayOrFuture('2026-06-01T00:00:00Z')).toBe(true);
      expect(transitEngine.isTodayOrFuture('2025-01-01T00:00:00Z')).toBe(false);
    });

    test('handles year boundary: Dec 31 vs Jan 1 correctly', () => {
      jest.setSystemTime(new Date('2026-01-02T12:00:00Z'));
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(transitEngine.isTodayOrFuture(yesterday)).toBe(false);
      expect(transitEngine.isTodayOrFuture(today)).toBe(true);
      expect(transitEngine.isTodayOrFuture(tomorrow)).toBe(true);
    });
  });

  describe('generateNotificationHash (existing)', () => {
    test('produces a stable hash', () => {
      const h1 = transitEngine.generateNotificationHash('user1', 'transit1', 'exact');
      const h2 = transitEngine.generateNotificationHash('user1', 'transit1', 'exact');
      expect(h1).toBe(h2);
    });

    test('produces different hashes for different event types', () => {
      const h1 = transitEngine.generateNotificationHash('user1', 'transit1', 'exact');
      const h2 = transitEngine.generateNotificationHash('user1', 'transit1', 'entering');
      expect(h1).not.toBe(h2);
    });
  });

  describe('Transit key uniqueness (frontend pattern)', () => {
    test('transit key should be unique across aspect types', () => {
      const transit1 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'conjunction' };
      const transit2 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'square' };

      const key1 = `${transit1.transitPlanet}-${transit1.natalPlanet}-${transit1.aspect}`;
      const key2 = `${transit2.transitPlanet}-${transit2.natalPlanet}-${transit2.aspect}`;

      expect(key1).not.toBe(key2);
    });

    test('old key format (without aspect) collapses distinct transits', () => {
      const transit1 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'conjunction' };
      const transit2 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'opposition' };

      const oldKey1 = `${transit1.transitPlanet}-${transit1.natalPlanet}`;
      const oldKey2 = `${transit2.transitPlanet}-${transit2.natalPlanet}`;

      expect(oldKey1).toBe(oldKey2);
    });
  });

  describe('isSlowTransitPlanet', () => {
    test('jupiter is a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('jupiter')).toBe(true);
    });

    test('saturn is a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('saturn')).toBe(true);
    });

    test('uranus is a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('uranus')).toBe(true);
    });

    test('neptune is a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('neptune')).toBe(true);
    });

    test('pluto is a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('pluto')).toBe(true);
    });

    test('mars is NOT a slow transit planet', () => {
      expect(transitsModule.isSlowTransitPlanet('mars')).toBe(false);
    });
  });

  describe('getTransitKey', () => {
    test('produces consistent key from transit planet, natal planet, and aspect', () => {
      const transit = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'conjunction' };
      expect(transitsModule.getTransitKey(transit)).toBe('jupiter-venus-conjunction');
    });

    test('produces different keys for different aspects', () => {
      const t1 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'conjunction' };
      const t2 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'square' };
      expect(transitsModule.getTransitKey(t1)).not.toBe(transitsModule.getTransitKey(t2));
    });
  });

  describe('mergeContinuousTransits', () => {
    test('merges duplicate jupiter-venus conjunction keeping tightest orb', () => {
      const t1 = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'conjunction', orb: 3.0, intensity: 7 };
      const t2 = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'conjunction', orb: 1.5, intensity: 8 };
      const result = transitsModule.mergeContinuousTransits([t1, t2]);
      expect(result).toHaveLength(1);
      expect(result[0].orb).toBe(1.5);
      expect(result[0].continuous).toBe(true);
    });

    test('does NOT merge mars transits (fast planet)', () => {
      const t1 = { transitPlanet: 'mars', natalPlanet: 'sun', aspect: 'conjunction', orb: 2.0, intensity: 6 };
      const t2 = { transitPlanet: 'mars', natalPlanet: 'sun', aspect: 'conjunction', orb: 1.0, intensity: 7 };
      const result = transitsModule.mergeContinuousTransits([t1, t2]);
      expect(result).toHaveLength(2);
    });

    test('keeps separate saturn-sun and saturn-moon transits distinct', () => {
      const t1 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'conjunction', orb: 1.0, intensity: 9 };
      const t2 = { transitPlanet: 'saturn', natalPlanet: 'moon', aspect: 'conjunction', orb: 2.0, intensity: 7 };
      const result = transitsModule.mergeContinuousTransits([t1, t2]);
      expect(result).toHaveLength(2);
    });

    test('merges same transit across different aspects only within same key', () => {
      const t1 = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'conjunction', orb: 2.0, intensity: 8 };
      const t2 = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'square', orb: 1.0, intensity: 7 };
      const result = transitsModule.mergeContinuousTransits([t1, t2]);
      expect(result).toHaveLength(2);
    });

    test('returns sorted by intensity descending', () => {
      const t1 = { transitPlanet: 'jupiter', natalPlanet: 'venus', aspect: 'conjunction', orb: 0.5, intensity: 8 };
      const t2 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'opposition', orb: 1.0, intensity: 9 };
      const t3 = { transitPlanet: 'uranus', natalPlanet: 'moon', aspect: 'trine', orb: 2.0, intensity: 5 };
      const result = transitsModule.mergeContinuousTransits([t1, t2, t3]);
      expect(result[0].intensity).toBe(9);
      expect(result[1].intensity).toBe(8);
      expect(result[2].intensity).toBe(5);
    });

    test('single transit passes through unchanged', () => {
      const t1 = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'conjunction', orb: 1.0, intensity: 9 };
      const result = transitsModule.mergeContinuousTransits([t1]);
      expect(result).toHaveLength(1);
      expect(result[0].continuous).toBe(false);
    });

    test('empty input returns empty array', () => {
      const result = transitsModule.mergeContinuousTransits([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterRoutineTransits', () => {
    test('keeps non-lunar transits', () => {
      const t = { transitPlanet: 'saturn', natalPlanet: 'sun', aspect: 'square', intensity: 5 };
      const result = transitsModule.filterRoutineTransits([t]);
      expect(result).toHaveLength(1);
    });

    test('filters low-intensity lunar transits when keepLunarConjunctions is false', () => {
      const t = { transitPlanet: 'jupiter', natalPlanet: 'moon', aspect: 'trine', intensity: 3 };
      const result = transitsModule.filterRoutineTransits([t], { keepLunarConjunctions: false, minIntensity: 4 });
      expect(result).toHaveLength(0);
    });

    test('keeps conjunctions to moon when keepLunarConjunctions is true', () => {
      const t = { transitPlanet: 'saturn', natalPlanet: 'moon', aspect: 'conjunction', intensity: 3 };
      const result = transitsModule.filterRoutineTransits([t], { keepLunarConjunctions: true, minIntensity: 4 });
      expect(result).toHaveLength(1);
    });

    test('keeps high-intensity lunar transits regardless of aspect', () => {
      const t = { transitPlanet: 'pluto', natalPlanet: 'moon', aspect: 'opposition', intensity: 9 };
      const result = transitsModule.filterRoutineTransits([t], { keepLunarConjunctions: false, minIntensity: 4 });
      expect(result).toHaveLength(1);
    });

    test('keeps sun transits to moon when keepLunarToSunMoon is true', () => {
      const t = { transitPlanet: 'sun', natalPlanet: 'moon', aspect: 'square', intensity: 3 };
      const result = transitsModule.filterRoutineTransits([t], { keepLunarConjunctions: false, minIntensity: 4, keepLunarToSunMoon: true });
      expect(result).toHaveLength(1);
    });

    test('empty input returns empty array', () => {
      const result = transitsModule.filterRoutineTransits([]);
      expect(result).toEqual([]);
    });
  });
});
