export const zodiacSigns = [
  { name: 'Aries', dates: 'Mar 21 - Apr 19', element: 'Fire', quality: 'Cardinal' },
  { name: 'Taurus', dates: 'Apr 20 - May 20', element: 'Earth', quality: 'Fixed' },
  { name: 'Gemini', dates: 'May 21 - Jun 20', element: 'Air', quality: 'Mutable' },
  { name: 'Cancer', dates: 'Jun 21 - Jul 22', element: 'Water', quality: 'Cardinal' },
  { name: 'Leo', dates: 'Jul 23 - Aug 22', element: 'Fire', quality: 'Fixed' },
  { name: 'Virgo', dates: 'Aug 23 - Sep 22', element: 'Earth', quality: 'Mutable' },
  { name: 'Libra', dates: 'Sep 23 - Oct 22', element: 'Air', quality: 'Cardinal' },
  { name: 'Scorpio', dates: 'Oct 23 - Nov 21', element: 'Water', quality: 'Fixed' },
  { name: 'Sagittarius', dates: 'Nov 22 - Dec 21', element: 'Fire', quality: 'Mutable' },
  { name: 'Capricorn', dates: 'Dec 22 - Jan 19', element: 'Earth', quality: 'Cardinal' },
  { name: 'Aquarius', dates: 'Jan 20 - Feb 18', element: 'Air', quality: 'Fixed' },
  { name: 'Pisces', dates: 'Feb 19 - Mar 20', element: 'Water', quality: 'Mutable' }
];

export function getSignFromDate(birthDate) {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}
