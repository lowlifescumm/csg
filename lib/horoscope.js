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
    return {
      sign: signInfo.name,
      date: today,
      content: `**Overview**: Today brings fresh energy for ${signInfo.name}. The ${signInfo.element} element fuels your natural ${signInfo.quality} qualities, making this a day of meaningful progress and self-discovery. Trust your instincts and embrace new opportunities that come your way.\n\n**Love & Relationships**: Open communication strengthens bonds. Be honest about your feelings and listen with empathy. Small gestures of appreciation go a long way today.\n\n**Career & Money**: A practical approach leads to steady gains. Trust your instincts on financial matters and don't rush major decisions.\n\n**Wellness**: Prioritize balance between activity and rest. A short walk or meditation session can restore your energy.\n\n**Lucky Numbers**: 7, 14, 21`,
    };
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
    model: 'llama-3.1-70b-versatile',
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
      'INSERT INTO horoscopes (sign, date, content) VALUES ($1, $2, $3) ON CONFLICT (sign, date) DO NOTHING',
      [sign.toLowerCase(), today, content]
    );
  } catch (err) {
    console.error('DB cache write error:', err.message);
  }
}

export { zodiacSigns };
