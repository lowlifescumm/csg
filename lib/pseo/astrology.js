export const zodiacSigns = [
  { slug: "aries", name: "Aries", element: "Fire", mode: "Cardinal", gift: "bold initiation", shadow: "impatience", mantra: "Move first, then refine." },
  { slug: "taurus", name: "Taurus", element: "Earth", mode: "Fixed", gift: "steady devotion", shadow: "resistance to change", mantra: "Build what can hold you." },
  { slug: "gemini", name: "Gemini", element: "Air", mode: "Mutable", gift: "curious connection", shadow: "scattered focus", mantra: "Choose the signal, not the noise." },
  { slug: "cancer", name: "Cancer", element: "Water", mode: "Cardinal", gift: "emotional protection", shadow: "over-guarding", mantra: "Nurture without disappearing." },
  { slug: "leo", name: "Leo", element: "Fire", mode: "Fixed", gift: "radiant courage", shadow: "approval seeking", mantra: "Create because your spirit says yes." },
  { slug: "virgo", name: "Virgo", element: "Earth", mode: "Mutable", gift: "useful precision", shadow: "perfectionism", mantra: "Make it helpful before perfect." },
  { slug: "libra", name: "Libra", element: "Air", mode: "Cardinal", gift: "harmonious strategy", shadow: "people pleasing", mantra: "Peace still needs a point of view." },
  { slug: "scorpio", name: "Scorpio", element: "Water", mode: "Fixed", gift: "transformational depth", shadow: "control", mantra: "Power grows when truth moves." },
  { slug: "sagittarius", name: "Sagittarius", element: "Fire", mode: "Mutable", gift: "expansive faith", shadow: "restlessness", mantra: "Aim your freedom at meaning." },
  { slug: "capricorn", name: "Capricorn", element: "Earth", mode: "Cardinal", gift: "disciplined ambition", shadow: "self-pressure", mantra: "Let the mountain be climbed in steps." },
  { slug: "aquarius", name: "Aquarius", element: "Air", mode: "Fixed", gift: "future-minded clarity", shadow: "detachment", mantra: "Belong without shrinking your vision." },
  { slug: "pisces", name: "Pisces", element: "Water", mode: "Mutable", gift: "mystic empathy", shadow: "porous boundaries", mantra: "Let intuition have a container." },
];

export const transitThemes = [
  "clarity", "confidence", "love", "career", "healing", "intuition", "boundaries",
];

export function getSign(slug) {
  return zodiacSigns.find((sign) => sign.slug === slug);
}

export function titleCaseSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getCombinationTone(sun, moon) {
  if (sun.element === moon.element) {
    return `${sun.element} dominant energy gives this pairing a clear internal rhythm: your outer drive and emotional needs speak the same language.`;
  }
  if (sun.mode === moon.mode) {
    return `${sun.mode} emphasis creates momentum and tension at the same time, making self-awareness the difference between power and repetition.`;
  }
  return `${sun.element} Sun with ${moon.element} Moon blends two different instincts, so the growth edge is learning when to lead with action and when to listen inward.`;
}

export function getNextTransitDates(count = 30) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function formatTransitDate(dateSlug) {
  const date = new Date(`${dateSlug}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function isValidDateSlug(dateSlug) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateSlug) && Boolean(formatTransitDate(dateSlug));
}
