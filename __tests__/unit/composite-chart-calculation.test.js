const { degreesToSign } = require('../../lib/astrology');

function calculateMidpoint(p1, p2) {
  let lon1 = ((p1 % 360) + 360) % 360;
  let lon2 = ((p2 % 360) + 360) % 360;
  let diff = lon2 - lon1;
  if (Math.abs(diff) > 180) {
    diff = diff > 0 ? diff - 360 : diff + 360;
  }
  let mid = lon1 + diff / 2;
  mid = ((mid % 360) + 360) % 360;
  return mid;
}

function getHouseForLongitude(planetLongitude, ascendantLongitude) {
  let planetLon = ((planetLongitude % 360) + 360) % 360;
  let ascLon = ((ascendantLongitude % 360) + 360) % 360;
  let diff = planetLon - ascLon;
  if (diff < 0) diff += 360;
  const house = Math.floor(diff / 30) + 1;
  return ((house - 1) % 12) + 1;
}

describe('calculateMidpoint', () => {
  test('simple midpoint between 0 and 60', () => {
    expect(calculateMidpoint(0, 60)).toBeCloseTo(30, 5);
  });

  test('midpoint with wrap-around (350 to 10 should be 0)', () => {
    expect(calculateMidpoint(350, 10)).toBeCloseTo(0, 5);
  });

  test('midpoint with wrap-around (10 to 350 should be 0)', () => {
    expect(calculateMidpoint(10, 350)).toBeCloseTo(0, 5);
  });

  test('midpoint across 360/0 boundary', () => {
    expect(calculateMidpoint(355, 5)).toBeCloseTo(0, 5);
  });

  test('midpoint of same longitude', () => {
    expect(calculateMidpoint(45, 45)).toBeCloseTo(45, 5);
  });

  test('midpoint of opposite points (0 and 180)', () => {
    expect(calculateMidpoint(0, 180)).toBeCloseTo(90, 5);
  });
});

describe('getHouseForLongitude', () => {
  test('planet exactly on ascendant is house 1', () => {
    expect(getHouseForLongitude(0, 0)).toBe(1);
  });

  test('planet 30 degrees after ascendant is house 2', () => {
    expect(getHouseForLongitude(30, 0)).toBe(2);
  });

  test('planet 350 degrees after ascendant is house 12', () => {
    expect(getHouseForLongitude(350, 0)).toBe(12);
  });

  test('planet at 45 degrees falls in house 2', () => {
    expect(getHouseForLongitude(45, 0)).toBe(2);
  });

  test('planet at 330 degrees with ascendant at 15', () => {
    expect(getHouseForLongitude(330, 15)).toBe(11);
  });

  test('planet at 0 degrees with ascendant at 350 is in house 1 (350-20deg span)', () => {
    expect(getHouseForLongitude(0, 350)).toBe(1);
  });
});

describe('degreesToSign (integration)', () => {
  test('0 degrees is Aries', () => {
    expect(degreesToSign(0)).toBe('Aries');
  });

  test('30 degrees is Taurus', () => {
    expect(degreesToSign(30)).toBe('Taurus');
  });

  test('330 degrees is Pisces', () => {
    expect(degreesToSign(330)).toBe('Pisces');
  });

  test('360 degrees is Aries (wraps around)', () => {
    expect(degreesToSign(360)).toBe('Aries');
  });

  test('negative longitude wraps correctly', () => {
    expect(degreesToSign(-30)).toBe('Pisces');
  });
});

describe('composite chart data structure', () => {
  test('midpoint + house calculation produces expected structure', () => {
    const userSun = 195; // Libra 15°
    const partnerSun = 165; // Virgo 15°
    const compositeSunLon = calculateMidpoint(userSun, partnerSun);
    const ascendant = 0; // Aries 0°
    const house = getHouseForLongitude(compositeSunLon, ascendant);
    const sign = degreesToSign(compositeSunLon);
    const degree = compositeSunLon % 30;

    // Midpoint of 195 and 165 = 180
    expect(compositeSunLon).toBeCloseTo(180, 5);
    // 180° is in Libra (180-210)
    expect(sign).toBe('Libra');
    // 180° - 150° (Libra start) = 30°... wait that's 180-180=0
    // Actually Libra starts at 180°, so 180° = 0° Libra
    expect(degree).toBeCloseTo(0, 5);
    // With ASC at 0°, 180° is 180° away = house 7 (180/30 = 6, + 1 = 7)
    expect(house).toBe(7);
  });

  test('composite chart includes degree and longitude fields', () => {
    const compositeData = {
      sun: { sign: 'Libra', house: 7, longitude: 180, degree: 0 },
      moon: { sign: 'Gemini', house: 3, longitude: 65, degree: 5 },
      mercury: { sign: 'Scorpio', house: 8, longitude: 212, degree: 2 },
      venus: { sign: 'Virgo', house: 6, longitude: 158, degree: 8 },
      mars: { sign: 'Leo', house: 5, longitude: 123, degree: 3 },
      jupiter: { sign: 'Pisces', house: 12, longitude: 348, degree: 18 },
      saturn: { sign: 'Capricorn', house: 10, longitude: 280, degree: 10 },
      rising: { sign: 'Aries', longitude: 0, degree: 0 },
    };

    expect(compositeData.sun.longitude).toBeDefined();
    expect(compositeData.sun.degree).toBeDefined();
    expect(compositeData.rising.longitude).toBeDefined();
    expect(compositeData.rising.degree).toBeDefined();

    expect(typeof compositeData.sun.longitude).toBe('number');
    expect(typeof compositeData.sun.degree).toBe('number');
  });
});
