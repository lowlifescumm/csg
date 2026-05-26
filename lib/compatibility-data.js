import { zodiacSigns } from "./pseo/astrology.js";

const signNames = zodiacSigns.map((s) => ({ slug: s.slug, name: s.name }));

const elementPairs = {
  Fire: { best: "Air", good: "Fire", challenging: "Water" },
  Earth: { best: "Water", good: "Earth", challenging: "Air" },
  Air: { best: "Fire", good: "Air", challenging: "Earth" },
  Water: { best: "Earth", good: "Water", challenging: "Fire" },
};

function pairKey(slug1, slug2) {
  return [slug1, slug2].sort().join("-and-");
}

export function getAllPairSlugs() {
  const pairs = [];
  for (let i = 0; i < signNames.length; i++) {
    for (let j = i + 1; j < signNames.length; j++) {
      pairs.push(pairKey(signNames[i].slug, signNames[j].slug));
    }
  }
  return pairs;
}

export function parsePairSlug(slug) {
  const parts = slug.split("-and-");
  if (parts.length !== 2) return null;
  const [s1, s2] = parts;
  const sign1 = signNames.find((s) => s.slug === s1);
  const sign2 = signNames.find((s) => s.slug === s2);
  if (!sign1 || !sign2) return null;
  return { sign1, sign2, orderedSlug: pairKey(s1, s2) };
}

export function getPairMeta(pairSlug) {
  const parsed = parsePairSlug(pairSlug);
  if (!parsed) return null;

  const { sign1, sign2 } = parsed;
  const s1 = zodiacSigns.find((s) => s.slug === sign1.slug);
  const s2 = zodiacSigns.find((s) => s.slug === sign2.slug);
  if (!s1 || !s2) return null;

  const compat = getCompatibilityLevel(s1, s2);

  return {
    sign1: s1,
    sign2: s2,
    level: compat.level,
    score: compat.score,
    strengths: compat.strengths,
    challenges: compat.challenges,
    advice: compat.advice,
  };
}

function getCompatibilityLevel(s1, s2) {
  const sameElement = s1.element === s2.element;
  const bestPair = elementPairs[s1.element]?.best === s2.element || elementPairs[s2.element]?.best === s1.element;
  const bothCardinal = s1.mode === "Cardinal" && s2.mode === "Cardinal";
  const bothFixed = s1.mode === "Fixed" && s2.mode === "Fixed";
  const bothMutable = s1.mode === "Mutable" && s2.mode === "Mutable";

  let level = "Good";
  let score = 65;

  if (sameElement) {
    level = "Strong";
    score = 78;
  }
  if (bestPair) {
    level = "Excellent";
    score = 88;
  }
  if (bothCardinal || bothFixed || bothMutable) {
    score = Math.min(score + 5, 95);
    level = score >= 85 ? "Excellent" : "Strong";
  }

  const challenging = elementPairs[s1.element]?.challenging === s2.element || elementPairs[s2.element]?.challenging === s1.element;
  if (challenging && !sameElement && !bestPair) {
    level = "Challenging";
    score = 48;
  }

  const strengths = [
    `${s1.name} brings ${s1.gift} to this pairing, while ${s2.name} contributes ${s2.gift}.`,
    `Both signs share a natural curiosity about how the other operates.`,
    buildStrength(s1, s2),
  ];

  const challenges = [
    `${s1.name}'s ${s1.shadow} can clash with ${s2.name}'s ${s2.shadow} when stress is high.`,
    `Finding the right pace — ${s1.name} moves ${s1.mode === "Cardinal" ? "fast" : "steadily"}, ${s2.name} moves ${s2.mode === "Cardinal" ? "fast" : "steadily"}.`,
    buildChallenge(s1, s2),
  ];

  const advice = buildAdvice(s1, s2);

  return { level, score, strengths, challenges, advice };
}

function buildStrength(s1, s2) {
  if (s1.element === s2.element) {
    return `Their shared ${s1.element} element creates an instinctive understanding — they speak the same emotional language without explanation.`;
  }
  if (elementPairs[s1.element]?.best === s2.element || elementPairs[s2.element]?.best === s1.element) {
    return `${s1.element} and ${s2.element} are complementary elements: one brings the spark, the other brings the container. This creates natural balance.`;
  }
  return `Their different worldviews create a dynamic where each partner expands the other's perspective.`;
}

function buildChallenge(s1, s2) {
  if (s1.mode === s2.mode) {
    return `Both are ${s1.mode} signs, which means they can get stuck in the same pattern — too much starting, resisting, or adapting without resolution.`;
  }
  return `Learning to communicate across their different natural rhythms requires conscious effort from both partners.`;
}

function buildAdvice(s1, s2) {
  if (s1.element === s2.element) {
    return `Lean into your natural harmony but watch for blind spots — you may enable each other's shadow patterns. ${s1.mantra} ${s2.mantra}`;
  }
  if (elementPairs[s1.element]?.best === s2.element || elementPairs[s2.element]?.best === s1.element) {
    return `Your differences are your strength. Let ${s1.name}'s ${s1.gift} inspire ${s2.name}, and let ${s2.name}'s ${s2.gift} ground ${s1.name}. ${s1.mantra}`;
  }
  return `This pairing requires intention. The reward is growth that neither could access alone. ${s2.mantra}`;
}
