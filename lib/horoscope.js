import OpenAI from 'openai';
import { Pool } from 'pg';
import { zodiacSigns } from './zodiac-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    model: 'gpt-4o-mini',
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
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await pool.query(
    'SELECT content, date FROM horoscopes WHERE sign = $1 AND date = $2',
    [sign.toLowerCase(), today]
  );
  return rows[0] || null;
}

export async function saveHoroscope(sign, content) {
  const today = new Date().toISOString().split('T')[0];
  await pool.query(
    'INSERT INTO horoscopes (sign, date, content) VALUES ($1, $2, $3) ON CONFLICT (sign, date) DO NOTHING',
    [sign.toLowerCase(), today, content]
  );
}

export { zodiacSigns };
