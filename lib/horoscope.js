import Groq from 'groq-sdk';
import { Pool } from 'pg';
import { zodiacSigns } from './zodiac-data';

const openai = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export async function generateDailyHoroscope(sign) {
  const signInfo = zodiacSigns.find(s => s.name.toLowerCase() === String(sign).toLowerCase());
  if (!signInfo) throw new Error(`Unknown sign: ${sign}`);

  const d = new Date();
  const today = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Fallback when Groq API key is missing or invalid (e.g., local dev with dummy key)
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith('test-') || process.env.GROQ_API_KEY.startsWith('your-')) {
    const content = generateFallbackHoroscope(signInfo, today);
    return { sign: signInfo.name, date: today, content };
  }

  const prompt = `Generate a daily horoscope for ${signInfo.name} (${signInfo.element} sign, ${signInfo.quality}).

Date: ${today}

Create a horoscope with these sections:

**Overview** (2-3 sentences): General energy and theme for the day

**Love & Relationships** (1-2 sentences): Brief guidance

**Career & Money** (1-2 sentences): Brief guidance

**Wellness** (1 sentence): Health/self-care tip

**Lucky Numbers**: Pick 3 numbers between 1-99

Style guidelines:
- Positive and empowering (never doom/gloom)
- Specific enough to feel personal but broad enough to resonate
- Actionable guidance
- Professional but warm tone
- Total length: ~150-200 words

DO NOT use phrases like "As a ${signInfo.name}" or "Your sign". Write directly to the reader.`;

  const completion = await openai.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 500,
  });

  const text = completion.choices[0]?.message?.content || '';

  return {
    sign: signInfo.name,
    date: today,
    content: text,
  };
}

export async function getCachedHoroscope(sign) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await pool.query(
      'SELECT content, date FROM horoscopes WHERE sign = $1 AND date = $2',
      [sign.toLowerCase(), today]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('DB cache read error:', err.message);
    return null;
  }
}

export async function saveHoroscope(sign, content) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      'INSERT INTO horoscopes (sign, date, content) VALUES ($1, $2, $3) ON CONFLICT (sign, date) DO UPDATE SET content = $3',
      [sign.toLowerCase(), today, content]
    );
  } catch (err) {
    console.error('DB cache write error:', err.message);
  }
}

function generateFallbackHoroscope(signInfo, today) {
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const nameHash = signInfo.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = dayOfYear * 997 + nameHash;
  const rng = (max) => ((seed * 9301 + 49297) % 233280) / 233280 * max | 0;

  const overviews = [
    `Today brings a wave of ${signInfo.element.toLowerCase()} energy for ${signInfo.name}. Your natural ${signInfo.quality.toLowerCase()} nature helps you navigate the day with confidence and clarity.`,
    `The stars align to amplify your ${signInfo.element.toLowerCase()} traits, ${signInfo.name}. Channel your ${signInfo.quality.toLowerCase()} determination into meaningful action.`,
    `Cosmic energy flows in your favor today, ${signInfo.name}. Your ${signInfo.element.toLowerCase()} resilience meets your ${signInfo.quality.toLowerCase()} drive — a powerful combination.`,
    `A fresh wave of inspiration arrives for ${signInfo.name}. Your ${signInfo.element.toLowerCase()} spirit, guided by your ${signInfo.quality.toLowerCase()} approach, opens new doors.`,
  ];

  const loves = [
    'Open communication strengthens bonds. Be honest about your feelings and listen with empathy.',
    'Share a moment of genuine connection today. Small gestures of appreciation create lasting warmth.',
    'Trust your heart in relationships. Vulnerability is not weakness — it is the bridge to deeper connection.',
    'Balance giving and receiving in your relationships today. Your presence is a gift; let others show up for you too.',
  ];

  const careers = [
    'A practical approach leads to steady gains. Trust your instincts on financial matters.',
    'Your focus turns to long-term growth. One disciplined choice today compounds into tomorrow\'s opportunity.',
    'Collaboration sparks your best ideas. Seek input from someone whose perspective challenges your own.',
    'Progress requires patience. Plant seeds today that will bear fruit in the weeks ahead.',
  ];

  const wellnesses = [
    'Prioritize balance between activity and rest. A short walk or meditation session restores your energy.',
    'Hydrate, stretch, and breathe deeply. Your body holds tension you don\'t need to carry.',
    'Step outside for five minutes of sunlight. Natural light recalibrates your rhythm and lifts your mood.',
    'Rest is productive. Give yourself permission to recharge without guilt.',
  ];

  const luckies = [
    [rng(50) + 1, rng(50) + 51, rng(50) + 1],
    [rng(30) + 1, rng(30) + 31, rng(30) + 61],
    [rng(99) + 1, rng(99) + 1, rng(99) + 1],
  ];

  const i = seed % overviews.length;
  return `**Overview**: ${overviews[i]}\n\n**Love & Relationships**: ${loves[i]}\n\n**Career & Money**: ${careers[i]}\n\n**Wellness**: ${wellnesses[i]}\n\n**Lucky Numbers**: ${luckies[i].join(', ')}`;
}

export { zodiacSigns };
