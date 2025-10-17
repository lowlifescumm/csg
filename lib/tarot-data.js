const BASE_IMAGE_URL = "https://raw.githubusercontent.com/lowlifescumm/tarot/master/img/big";
import spreads from "@/lib/tarot-spreads.json";

const MAJOR_ARCANA = [
  { id: 0, name: "The Fool", image: `${BASE_IMAGE_URL}/maj00.jpg`, upright: "New beginnings, innocence, spontaneity, free spirit", reversed: "Recklessness, taken advantage of, inconsideration" },
  { id: 1, name: "The Magician", image: `${BASE_IMAGE_URL}/maj01.jpg`, upright: "Manifestation, resourcefulness, power, inspired action", reversed: "Manipulation, poor planning, untapped talents" },
  { id: 2, name: "The High Priestess", image: `${BASE_IMAGE_URL}/maj02.jpg`, upright: "Intuition, sacred knowledge, divine feminine, subconscious mind", reversed: "Secrets, disconnected from intuition, withdrawal" },
  { id: 3, name: "The Empress", image: `${BASE_IMAGE_URL}/maj03.jpg`, upright: "Femininity, beauty, nature, nurturing, abundance", reversed: "Creative block, dependence on others, emptiness" },
  { id: 4, name: "The Emperor", image: `${BASE_IMAGE_URL}/maj04.jpg`, upright: "Authority, establishment, structure, father figure", reversed: "Domination, excessive control, lack of discipline" },
  { id: 5, name: "The Hierophant", image: `${BASE_IMAGE_URL}/maj05.jpg`, upright: "Spiritual wisdom, religious beliefs, conformity, tradition", reversed: "Personal beliefs, freedom, challenging the status quo" },
  { id: 6, name: "The Lovers", image: `${BASE_IMAGE_URL}/maj06.jpg`, upright: "Love, harmony, relationships, values alignment, choices", reversed: "Self-love, disharmony, imbalance, misalignment of values" },
  { id: 7, name: "The Chariot", image: `${BASE_IMAGE_URL}/maj07.jpg`, upright: "Control, willpower, success, action, determination", reversed: "Self-discipline, opposition, lack of direction" },
  { id: 8, name: "Strength", image: `${BASE_IMAGE_URL}/maj08.jpg`, upright: "Strength, courage, persuasion, influence, compassion", reversed: "Inner strength, self-doubt, low energy, raw emotion" },
  { id: 9, name: "The Hermit", image: `${BASE_IMAGE_URL}/maj09.jpg`, upright: "Soul searching, introspection, being alone, inner guidance", reversed: "Isolation, loneliness, withdrawal" },
  { id: 10, name: "Wheel of Fortune", image: `${BASE_IMAGE_URL}/maj10.jpg`, upright: "Good luck, karma, life cycles, destiny, turning point", reversed: "Bad luck, resistance to change, breaking cycles" },
  { id: 11, name: "Justice", image: `${BASE_IMAGE_URL}/maj11.jpg`, upright: "Justice, fairness, truth, cause and effect, law", reversed: "Unfairness, lack of accountability, dishonesty" },
  { id: 12, name: "The Hanged Man", image: `${BASE_IMAGE_URL}/maj12.jpg`, upright: "Pause, surrender, letting go, new perspectives", reversed: "Delays, resistance, stalling, indecision" },
  { id: 13, name: "Death", image: `${BASE_IMAGE_URL}/maj13.jpg`, upright: "Endings, change, transformation, transition", reversed: "Resistance to change, personal transformation, inner purging" },
  { id: 14, name: "Temperance", image: `${BASE_IMAGE_URL}/maj14.jpg`, upright: "Balance, moderation, patience, purpose, meaning", reversed: "Imbalance, excess, self-healing, re-alignment" },
  { id: 15, name: "The Devil", image: `${BASE_IMAGE_URL}/maj15.jpg`, upright: "Shadow self, attachment, addiction, restriction, sexuality", reversed: "Releasing limiting beliefs, exploring dark thoughts, detachment" },
  { id: 16, name: "The Tower", image: `${BASE_IMAGE_URL}/maj16.jpg`, upright: "Sudden change, upheaval, chaos, revelation, awakening", reversed: "Personal transformation, fear of change, averting disaster" },
  { id: 17, name: "The Star", image: `${BASE_IMAGE_URL}/maj17.jpg`, upright: "Hope, faith, purpose, renewal, spirituality", reversed: "Lack of faith, despair, self-trust, disconnection" },
  { id: 18, name: "The Moon", image: `${BASE_IMAGE_URL}/maj18.jpg`, upright: "Illusion, fear, anxiety, subconscious, intuition", reversed: "Release of fear, repressed emotion, inner confusion" },
  { id: 19, name: "The Sun", image: `${BASE_IMAGE_URL}/maj19.jpg`, upright: "Positivity, fun, warmth, success, vitality", reversed: "Inner child, feeling down, overly optimistic" },
  { id: 20, name: "Judgement", image: `${BASE_IMAGE_URL}/maj20.jpg`, upright: "Judgement, rebirth, inner calling, absolution", reversed: "Self-doubt, inner critic, ignoring the call" },
  { id: 21, name: "The World", image: `${BASE_IMAGE_URL}/maj21.jpg`, upright: "Completion, accomplishment, travel, achievement", reversed: "Seeking personal closure, short-cuts, delays" }
];

const MINOR_ARCANA = {
  wands: [
    { id: "w01", name: "Ace of Wands", image: `${BASE_IMAGE_URL}/wands01.jpg`, upright: "Inspiration, new opportunities, growth, potential", reversed: "An emerging idea, lack of direction, distractions, delays" },
    { id: "w02", name: "Two of Wands", image: `${BASE_IMAGE_URL}/wands02.jpg`, upright: "Future planning, progress, decisions, discovery", reversed: "Personal goals, inner alignment, fear of unknown, lack of planning" },
    { id: "w03", name: "Three of Wands", image: `${BASE_IMAGE_URL}/wands03.jpg`, upright: "Progress, expansion, foresight, overseas opportunities", reversed: "Playing small, lack of foresight, unexpected delays" },
    { id: "w04", name: "Four of Wands", image: `${BASE_IMAGE_URL}/wands04.jpg`, upright: "Celebration, joy, harmony, relaxation, homecoming", reversed: "Personal celebration, inner harmony, conflict with others, transition" },
    { id: "w05", name: "Five of Wands", image: `${BASE_IMAGE_URL}/wands05.jpg`, upright: "Conflict, disagreements, competition, tension, diversity", reversed: "Inner conflict, conflict avoidance, releasing tension" },
    { id: "w06", name: "Six of Wands", image: `${BASE_IMAGE_URL}/wands06.jpg`, upright: "Success, public recognition, progress, self-confidence", reversed: "Private achievement, personal definition of success, fall from grace" },
    { id: "w07", name: "Seven of Wands", image: `${BASE_IMAGE_URL}/wands07.jpg`, upright: "Challenge, competition, protection, perseverance", reversed: "Exhaustion, giving up, overwhelmed" },
    { id: "w08", name: "Eight of Wands", image: `${BASE_IMAGE_URL}/wands08.jpg`, upright: "Movement, fast paced change, action, alignment, air travel", reversed: "Delays, frustration, resisting change, internal alignment" },
    { id: "w09", name: "Nine of Wands", image: `${BASE_IMAGE_URL}/wands09.jpg`, upright: "Resilience, courage, persistence, test of faith, boundaries", reversed: "Inner resources, struggle, overwhelm, defensive, paranoia" },
    { id: "w10", name: "Ten of Wands", image: `${BASE_IMAGE_URL}/wands10.jpg`, upright: "Burden, extra responsibility, hard work, completion", reversed: "Doing it all, carrying the burden, delegation, release" },
    { id: "w11", name: "Page of Wands", image: `${BASE_IMAGE_URL}/wands11.jpg`, upright: "Inspiration, ideas, discovery, limitless potential, free spirit", reversed: "Newly-formed ideas, redirecting energy, self-limiting beliefs" },
    { id: "w12", name: "Knight of Wands", image: `${BASE_IMAGE_URL}/wands12.jpg`, upright: "Energy, passion, inspired action, adventure, impulsiveness", reversed: "Passion project, haste, scattered energy, delays, frustration" },
    { id: "w13", name: "Queen of Wands", image: `${BASE_IMAGE_URL}/wands13.jpg`, upright: "Courage, confidence, independence, social butterfly, determination", reversed: "Self-respect, self-confidence, introverted, re-establish" },
    { id: "w14", name: "King of Wands", image: `${BASE_IMAGE_URL}/wands14.jpg`, upright: "Natural-born leader, vision, entrepreneur, honour", reversed: "Impulsiveness, haste, ruthless, high expectations" }
  ],
  cups: [
    { id: "c01", name: "Ace of Cups", image: `${BASE_IMAGE_URL}/cups01.jpg`, upright: "Love, new relationships, compassion, creativity", reversed: "Self-love, intuition, repressed emotions" },
    { id: "c02", name: "Two of Cups", image: `${BASE_IMAGE_URL}/cups02.jpg`, upright: "Unified love, partnership, mutual attraction", reversed: "Self-love, break-ups, disharmony, distrust" },
    { id: "c03", name: "Three of Cups", image: `${BASE_IMAGE_URL}/cups03.jpg`, upright: "Celebration, friendship, creativity, collaborations", reversed: "Independence, alone time, hardcore partying, 'three's a crowd'" },
    { id: "c04", name: "Four of Cups", image: `${BASE_IMAGE_URL}/cups04.jpg`, upright: "Meditation, contemplation, apathy, reevaluation", reversed: "Retreat, withdrawal, checking in for alignment" },
    { id: "c05", name: "Five of Cups", image: `${BASE_IMAGE_URL}/cups05.jpg`, upright: "Regret, failure, disappointment, pessimism", reversed: "Personal setbacks, self-forgiveness, moving on" },
    { id: "c06", name: "Six of Cups", image: `${BASE_IMAGE_URL}/cups06.jpg`, upright: "Revisiting the past, childhood memories, innocence, joy", reversed: "Living in the past, forgiveness, lacking playfulness" },
    { id: "c07", name: "Seven of Cups", image: `${BASE_IMAGE_URL}/cups07.jpg`, upright: "Opportunities, choices, wishful thinking, illusion", reversed: "Alignment, personal values, overwhelmed by choices" },
    { id: "c08", name: "Eight of Cups", image: `${BASE_IMAGE_URL}/cups08.jpg`, upright: "Disappointment, abandonment, withdrawal, escapism", reversed: "Trying one more time, indecision, aimless drifting, walking away" },
    { id: "c09", name: "Nine of Cups", image: `${BASE_IMAGE_URL}/cups09.jpg`, upright: "Contentment, satisfaction, gratitude, wish come true", reversed: "Inner happiness, materialism, dissatisfaction, indulgence" },
    { id: "c10", name: "Ten of Cups", image: `${BASE_IMAGE_URL}/cups10.jpg`, upright: "Divine love, blissful relationships, harmony, alignment", reversed: "Disconnection, misaligned values, struggling relationships" },
    { id: "c11", name: "Page of Cups", image: `${BASE_IMAGE_URL}/cups11.jpg`, upright: "Creative opportunities, intuitive messages, curiosity, possibility", reversed: "New ideas, doubting intuition, creative blocks, emotional immaturity" },
    { id: "c12", name: "Knight of Cups", image: `${BASE_IMAGE_URL}/cups12.jpg`, upright: "Creativity, romance, charm, imagination, beauty", reversed: "Overactive imagination, unrealistic, jealous, moody" },
    { id: "c13", name: "Queen of Cups", image: `${BASE_IMAGE_URL}/cups13.jpg`, upright: "Compassionate, caring, emotionally stable, intuitive, in flow", reversed: "Inner feelings, self-care, self-love, co-dependency" },
    { id: "c14", name: "King of Cups", image: `${BASE_IMAGE_URL}/cups14.jpg`, upright: "Emotionally balanced, compassionate, diplomatic", reversed: "Self-compassion, inner feelings, moodiness, emotionally manipulative" }
  ],
  swords: [
    { id: "s01", name: "Ace of Swords", image: `${BASE_IMAGE_URL}/swords01.jpg`, upright: "Breakthroughs, new ideas, mental clarity, success", reversed: "Inner clarity, re-thinking an idea, clouded judgement" },
    { id: "s02", name: "Two of Swords", image: `${BASE_IMAGE_URL}/swords02.jpg`, upright: "Difficult decisions, weighing up options, an impasse, avoidance", reversed: "Indecision, confusion, information overload, stalemate" },
    { id: "s03", name: "Three of Swords", image: `${BASE_IMAGE_URL}/swords03.jpg`, upright: "Heartbreak, emotional pain, sorrow, grief, hurt", reversed: "Negative self-talk, releasing pain, optimism, forgiveness" },
    { id: "s04", name: "Four of Swords", image: `${BASE_IMAGE_URL}/swords04.jpg`, upright: "Rest, relaxation, meditation, contemplation, recuperation", reversed: "Exhaustion, burn-out, deep contemplation, stagnation" },
    { id: "s05", name: "Five of Swords", image: `${BASE_IMAGE_URL}/swords05.jpg`, upright: "Conflict, disagreements, competition, defeat, winning at all costs", reversed: "Reconciliation, making amends, past resentment" },
    { id: "s06", name: "Six of Swords", image: `${BASE_IMAGE_URL}/swords06.jpg`, upright: "Transition, change, rite of passage, releasing baggage", reversed: "Personal transition, resistance to change, unfinished business" },
    { id: "s07", name: "Seven of Swords", image: `${BASE_IMAGE_URL}/swords07.jpg`, upright: "Betrayal, deception, getting away with something, acting strategically", reversed: "Imposter syndrome, self-deceit, keeping secrets" },
    { id: "s08", name: "Eight of Swords", image: `${BASE_IMAGE_URL}/swords08.jpg`, upright: "Negative thoughts, self-imposed restriction, imprisonment, victim mentality", reversed: "Self-limiting beliefs, inner critic, releasing negative thoughts, open to new perspectives" },
    { id: "s09", name: "Nine of Swords", image: `${BASE_IMAGE_URL}/swords09.jpg`, upright: "Anxiety, worry, fear, depression, nightmares", reversed: "Inner turmoil, deep-seated fears, secrets, releasing worry" },
    { id: "s10", name: "Ten of Swords", image: `${BASE_IMAGE_URL}/swords10.jpg`, upright: "Painful endings, deep wounds, betrayal, loss, crisis", reversed: "Recovery, regeneration, resisting an inevitable end" },
    { id: "s11", name: "Page of Swords", image: `${BASE_IMAGE_URL}/swords11.jpg`, upright: "New ideas, curiosity, thirst for knowledge, new ways of communicating", reversed: "Self-expression, all talk and no action, haphazard action, haste" },
    { id: "s12", name: "Knight of Swords", image: `${BASE_IMAGE_URL}/swords12.jpg`, upright: "Ambitious, action-oriented, driven to succeed, fast-thinking", reversed: "Restless, unfocused, impulsive, burn-out" },
    { id: "s13", name: "Queen of Swords", image: `${BASE_IMAGE_URL}/swords13.jpg`, upright: "Independent, unbiased judgement, clear boundaries, direct communication", reversed: "Overly-emotional, easily influenced, bitchy, cold-hearted" },
    { id: "s14", name: "King of Swords", image: `${BASE_IMAGE_URL}/swords14.jpg`, upright: "Mental clarity, intellectual power, authority, truth", reversed: "Quiet power, inner truth, misuse of power, manipulation" }
  ],
  pentacles: [
    { id: "p01", name: "Ace of Pentacles", image: `${BASE_IMAGE_URL}/pents01.jpg`, upright: "A new financial or career opportunity, manifestation, abundance", reversed: "Lost opportunity, lack of planning, poor financial decisions" },
    { id: "p02", name: "Two of Pentacles", image: `${BASE_IMAGE_URL}/pents02.jpg`, upright: "Multiple priorities, time management, prioritisation, adaptability", reversed: "Over-committed, disorganisation, reprioritisation" },
    { id: "p03", name: "Three of Pentacles", image: `${BASE_IMAGE_URL}/pents03.jpg`, upright: "Teamwork, collaboration, learning, implementation", reversed: "Disharmony, misalignment, working alone" },
    { id: "p04", name: "Four of Pentacles", image: `${BASE_IMAGE_URL}/pents04.jpg`, upright: "Saving money, security, conservatism, scarcity, control", reversed: "Over-spending, greed, self-protection" },
    { id: "p05", name: "Five of Pentacles", image: `${BASE_IMAGE_URL}/pents05.jpg`, upright: "Financial loss, poverty, lack mindset, isolation, worry", reversed: "Recovery from financial loss, spiritual poverty" },
    { id: "p06", name: "Six of Pentacles", image: `${BASE_IMAGE_URL}/pents06.jpg`, upright: "Giving, receiving, sharing wealth, generosity, charity", reversed: "Self-care, unpaid debts, one-sided charity" },
    { id: "p07", name: "Seven of Pentacles", image: `${BASE_IMAGE_URL}/pents07.jpg`, upright: "Long-term view, sustainable results, perseverance, investment", reversed: "Lack of long-term vision, limited success, question worth" },
    { id: "p08", name: "Eight of Pentacles", image: `${BASE_IMAGE_URL}/pents08.jpg`, upright: "Apprenticeship, repetitive tasks, mastery, skill development", reversed: "Self-development, perfectionism, misdirected activity" },
    { id: "p09", name: "Nine of Pentacles", image: `${BASE_IMAGE_URL}/pents09.jpg`, upright: "Abundance, luxury, self-sufficiency, financial independence", reversed: "Self-worth, over-investment in work, hustling" },
    { id: "p10", name: "Ten of Pentacles", image: `${BASE_IMAGE_URL}/pents10.jpg`, upright: "Wealth, financial security, family, long-term success, contribution", reversed: "The dark side of wealth, financial failure, loneliness" },
    { id: "p11", name: "Page of Pentacles", image: `${BASE_IMAGE_URL}/pents11.jpg`, upright: "Manifestation, financial opportunity, skill development, ambition", reversed: "Lack of progress, procrastination, learn from failure" },
    { id: "p12", name: "Knight of Pentacles", image: `${BASE_IMAGE_URL}/pents12.jpg`, upright: "Hard work, productivity, routine, conservatism, methodical", reversed: "Self-discipline, boredom, feeling 'stuck', perfectionism" },
    { id: "p13", name: "Queen of Pentacles", image: `${BASE_IMAGE_URL}/pents13.jpg`, upright: "Nurturing, practical, providing financially, a working parent, grounded", reversed: "Financial independence, self-care, work-home conflict" },
    { id: "p14", name: "King of Pentacles", image: `${BASE_IMAGE_URL}/pents14.jpg`, upright: "Wealth, business, leadership, security, discipline, abundance", reversed: "Financially inept, obsessed with wealth, stubborn, greed" }
  ]
};

const ALL_CARDS = [
  ...MAJOR_ARCANA,
  ...MINOR_ARCANA.wands,
  ...MINOR_ARCANA.cups,
  ...MINOR_ARCANA.swords,
  ...MINOR_ARCANA.pentacles
];

export function drawCards(count = 3) {
  const deck = [...ALL_CARDS];
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  if (deck.length < safeCount) {
    console.error("Invalid deck or not enough cards to draw", { requested: safeCount, available: deck.length });
    return [];
  }

  // Randomize and select exact number of unique cards
  const shuffled = deck.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, safeCount).map(card => ({
    ...card,
    reversed: Math.random() > 0.5
  }));
}

export function getPositionName(spread, index) {
  // spread may be an id like "past_present_future" or legacy keys like "three-card"
  const map = {
    "three-card": "past_present_future",
    "one-card": "one_card",
    "daily": "daily_tarot",
    "daily-love": "daily_love",
    "career": "daily_career",
    "yes-no": "yes_no",
    "love-potential": "love_potential",
    "breakup": "breakup",
    "ppf": "past_present_future",
    "flirt": "daily_flirt",
    "yin-yang": "yin_yang",
  };
  const id = map[spread] || spread;
  const cfg = Array.isArray(spreads) ? spreads.find(s => s.id === id) : null;
  const label = cfg?.layout?.[index];
  return label || `Card ${index + 1}`;
}

export { MAJOR_ARCANA, MINOR_ARCANA, ALL_CARDS };
