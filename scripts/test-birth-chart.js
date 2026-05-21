// Test birth chart calculation without logger dependency
const Astronomy = require('astronomy-engine');

function getZodiacSign(deg) {
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  return signs[Math.floor(((deg % 360) + 360) % 360 / 30)] || 'Unknown';
}

function calculateBirthChart(birthDate, birthTime, latitude, longitude) {
  const [hours, minutes] = birthTime.split(':').map(Number);
  const [year, month, day] = birthDate.split('-').map(Number);
  const datetime = new Date(year, month - 1, day, hours, minutes, 0, 0);

  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const chart = {};

  for (const planetName of planetNames) {
    try {
      const geoVector = Astronomy.GeoVector(planetName, datetime, true);
      const ecliptic = Astronomy.Ecliptic(geoVector);
      const eclipticLongitude = ecliptic.elon;
      chart[planetName.toLowerCase()] = {
        sign: getZodiacSign(eclipticLongitude),
        degree: eclipticLongitude % 30,
        longitude: eclipticLongitude,
        retrograde: false
      };
    } catch(e) {
      chart[planetName.toLowerCase()] = {sign:'Unknown', degree:0, longitude:0, retrograde:false};
    }
  }

  return {
    planets: chart,
    ascendant: 'Unknown',
    houses: {}
  };
}

// Test 1: March 15 1990 NYC 2:30 PM
const c1 = calculateBirthChart('1990-03-15', '14:30', 40.7128, -74.0060);
console.log('Test 1 (1990-03-15 14:30 NYC):');
console.log('  Sun:', c1.planets.sun.sign, '| Expected: Pisces (March 15)');
console.log('  Moon:', c1.planets.moon.sign);
console.log('  Mercury:', c1.planets.mercury.sign);
console.log('  Venus:', c1.planets.venus.sign);

// Test 2: July 22 1985 London 8:00 AM
const c2 = calculateBirthChart('1985-07-22', '08:00', 51.5074, -0.1278);
console.log('\nTest 2 (1985-07-22 08:00 London):');
console.log('  Sun:', c2.planets.sun.sign, '| Expected: Leo (July 22)');
console.log('  Moon:', c2.planets.moon.sign);

// Test 3: December 25 2000 23:59
const c3 = calculateBirthChart('2000-12-25', '23:59', 0, 0);
console.log('\nTest 3 (2000-12-25 23:59):');
console.log('  Sun:', c3.planets.sun.sign, '| Expected: Capricorn (Dec 25)');
