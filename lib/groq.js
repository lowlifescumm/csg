import logger from './logger';
// /lib/groq.js - Groq SDK wrapper (replaces OpenAI)
import Groq from "groq-sdk";
// Lazy client — only instantiated on first use, after env vars are set at runtime
let _client;
function getClient() {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

// Model mapping: OpenAI -> Groq equivalents
const MODEL_MAP = {
  'gpt-4o-mini': 'llama-3.1-8b-instant',      // Fast, cheap
  'gpt-4o': 'llama-3.1-70b-versatile',         // Higher quality
  'gpt-3.5-turbo': 'mixtral-8x7b-32768',       // Alternative
  'text-embedding-3-small': null,               // Groq doesn't do embeddings (use local or keep OpenAI)
};

function getGroqModel(openaiModel) {
  return MODEL_MAP[openaiModel] || 'llama-3.1-8b-instant';
}

/**
 * Generate a tarot reading using Groq (Llama 3.1).
 * You can swap model to a cheaper/faster one if you like.
 */
export async function generateTarotReading(cards, question, spread = "three-card", readingType = "general") {
  // Lazy imports for tarot-specific modules
  const { getPositionName } = await import("./tarot-data.js");
  const { default: spreads } = await import("./tarot-spreads.json", { with: { type: "json" } });
  // Tailor guidance to the chosen reading type
  const intentNote = (() => {
    const key = (readingType || "").toLowerCase();
    if (key.includes("yesno") || key.includes("yes-no") || key === "yes-no") {
      return "Answer clearly with a Yes/No leaning first, then 3–5 sentences of supportive context and advice.";
    }
    if (key.includes("love") || key.includes("flirt") || key.includes("breakup") || key.includes("potential")) {
      return "Focus the interpretation on relationships, emotions, and practical relational guidance.";
    }
    if (key.includes("career")) {
      return "Focus the interpretation on career, work, purpose, and practical next steps.";
    }
    if (key.includes("yin") || key.includes("yang")) {
      return "Discuss balancing opposing energies (yin/yang) and how to restore harmony with concrete steps.";
    }
    return "Offer grounded, practical guidance the querent can act on today.";
  })();
  // Resolve spread and question policy
  const spreadMap = {
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
    "custom_spread": "custom_spread",
  };
  const spreadId = spreadMap[spread] || spread;
  const spreadCfg = Array.isArray(spreads) ? spreads.find(s => s.id === spreadId) : null;
  
  // For custom spread, generate dynamic layout labels
  if (spreadId === "custom_spread" && cards && cards.length > 0) {
    spreadCfg.layout = cards.map((_, i) => `Card ${i + 1}`);
  }
  const allowQuestion = !!spreadCfg?.allow_question;
  const requireQuestion = !!spreadCfg?.ui?.require_question;
  const shouldIncludeQuestionSection = (requireQuestion || allowQuestion) && (question || "").trim().length > 0;
  const questionInstruction = (!shouldIncludeQuestionSection && !requireQuestion)
    ? "If no question is provided and this spread does not require one, do not mention the absence of a question. Avoid meta-comments like 'no question provided' or 'although a specific question wasn't mentioned'. Focus on delivering the guidance."
    : "";

  const messages = [
    {
      role: "system",
      content:
        "You are an elite intuitive Tarot reader. You do not speak in vague generalities. You weave the cards together into a specific, startlingly accurate narrative. Your tone is empathetic but direct—you are a truth-teller, not just a comforter. You focus on 'The Why' and 'The How'. Format your response using Markdown. Use double asterisks (**) for bolding card names and key phrases. Use standard paragraph breaks (double newline). Do NOT use HTML tags.",
    },
    {
      role: "user",
      content: `
Generate a high-impact tarot reading.

CONTEXT:
Reading Type: ${readingType}
${shouldIncludeQuestionSection && question ? `Specific User Situation: "${question}"\n(CRITICAL: Relate every single card back to this specific situation. Do not ignore this context.)` : "User Intent: General Guidance"}

THE CARDS:
${cards.map((card, i) => `- Position ${i + 1} (${getPositionName(spread, i)}): ${card.name} ${card.reversed ? "(Reversed)" : "(Upright)"}`).join("\n")}

INSTRUCTIONS:

1. **Synthesize, Don't List:** Do not just define the cards one by one. Explain how Card 1 influences Card 2.

2. **The Answer:** If the user asked a question, answer it directly in the first paragraph.

3. **Actionable Truth:** End with a specific "Power Move" or ritual the user can do today.

4. **Tone:** Mystical, Grounded, Persuasive.

${intentNote}
`
    }
  ];

  // Groq API (Llama 3.1 8B - fast and cheap)
  const response = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.8,
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content?.trim() || "I'm sorry—no reading was generated.";
}

/**
 * Generic text generation function for reports
 * Uses Groq Llama 3.1 API
 */
export async function generateText(prompt, options = {}) {
  // Mock mode: return high-quality AI-looking content when no real API key
  if (process.env.MOCK_AI_CONTENT === 'true') {
    const mockContent = generateMockContent(prompt, options);
    return mockContent;
  }

  const {
    model = 'llama-3.1-8b-instant',
    temperature = 0.8,
    max_tokens = 2000,
    systemPrompt,
  } = options;

  const messages = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await getClient().chat.completions.create({
    model: getGroqModel(model),
    messages,
    temperature,
    max_tokens,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate high-quality mock AI content for testing the pipeline
 * Returns realistic-looking content for each report section type
 */
function generateMockContent(prompt, options) {
  const { systemPrompt } = options || {};
  const promptLower = (prompt || '').toLowerCase();
  const systemLower = (systemPrompt || '').toLowerCase();

  // Detect report type from prompt content
  const isBirthChart = promptLower.includes('birth chart') || promptLower.includes('natal chart');
  const isCompatibility = promptLower.includes('compatibility') || promptLower.includes('synastry');
  const isTransit = promptLower.includes('transit') || promptLower.includes('forecast');
  const isDestiny = promptLower.includes('destiny') || promptLower.includes('saturn return') || promptLower.includes('life path');
  const isMatrix = promptLower.includes('matrix') || promptLower.includes('relationship matrix');
  const isKarmic = promptLower.includes('karmic') || promptLower.includes('shadow') || promptLower.includes('north node');
  const isMoon = promptLower.includes('moon phase') || promptLower.includes('moon reading');
  const isTarot = promptLower.includes('tarot') || promptLower.includes('card spread');
  const isClosing = promptLower.includes('blessing') || promptLower.includes('closing');
  const isHouses = promptLower.includes('planetary houses') || promptLower.includes('advanced_houses');
  const isAspects = promptLower.includes('aspect interpretation') || promptLower.includes('advanced_aspects');
  const isCareer = promptLower.includes('career path') || promptLower.includes('advanced_career');
  const isRelationships = promptLower.includes('relationship insight') || promptLower.includes('advanced_relationships');
  const isLifePurpose = promptLower.includes('life purpose') || promptLower.includes('advanced_life_purpose');
  const isFinancial = promptLower.includes('financial outlook') || promptLower.includes('advanced_financial');
  const isHealth = promptLower.includes('health') || promptLower.includes('advanced_health');

  if (isTarot) {
    return `# Your Tarot Reading

The cards reveal a powerful narrative unfolding in your life right now. The **High Priestess** in the Present position speaks to a time of deep intuition and hidden knowledge. You are being called to trust your inner wisdom rather than seeking answers externally. This card suggests that the answers you seek are already within you — you simply need to create space to hear them.

**The Tower** appears reversed in the Challenge position, indicating that while disruption is imminent, you have the opportunity to avoid a complete collapse. The reversal suggests that you've seen the warning signs and can make conscious choices to redirect the energy before destruction becomes necessary. This is about proactive transformation rather than reactive rebuilding.

**The Star** in the Future position promises healing, hope, and renewal. After navigating the challenges represented by The Tower, a period of profound peace and inspiration awaits. This card signals that your highest aspirations are not only possible but aligned with your soul's purpose.

**Power Move for Today:** Take 10 minutes of silence before bed tonight. Place your hand on your heart and ask yourself: "What truth am I not willing to see?" Write down whatever comes — even if it doesn't make sense. The High Priestess speaks in whispers, not shouts.`;
  }

  if (isMoon) {
    return `# Moon Phase Reading

The **Waxing Crescent** moon illuminates your path with the energy of growth and intention setting. This is the phase of manifestation — when seeds planted during the new moon begin to sprout. With your Sun in Gemini, this lunar energy activates your curious, communicative nature, encouraging you to explore new ideas and share your vision with others.

Your Moon in Pisces deepens this energy, adding a layer of profound emotional and spiritual sensitivity. You're not just thinking about what you want to create — you're feeling it on a soul level. This combination of air and water creates a powerful channel for inspired action.

**Key Guidance:** Trust the small signs and synchronicities appearing in your daily life. The universe is confirming that you're on the right path. Take one concrete action today that moves you closer to your intention.`;
  }

  if (isBirthChart) {
    return `# Birth Chart Analysis

## Your Cosmic Blueprint

Your chart reveals a dynamic interplay between intellect and emotion. With your **Sun in Gemini**, you are naturally curious, adaptable, and blessed with a quick mind. Communication is your superpower — you have the gift of seeing multiple perspectives and articulating complex ideas with clarity and wit.

**Moon in Pisces** grants you extraordinary emotional depth and intuitive sensitivity. You feel things deeply, often absorbing the emotions of those around you like a spiritual sponge. This placement gives you natural artistic and empathic gifts, but requires conscious boundaries to prevent overwhelm.

**Sagittarius Rising** means you present to the world as optimistic, adventurous, and philosophically inclined. Others are drawn to your enthusiasm and your genuine interest in exploring life's big questions. Your fiery ascendant gives you a warm, approachable presence that invites others into conversation.

## Elemental Balance

Your chart shows a beautiful balance of Air (Gemini Sun) and Water (Pisces Moon, Neptune) energies, with your Fire Rising adding dynamism. This combination makes you both intellectually sharp and emotionally attuned — a rare and powerful pairing.`;
  }

  if (isCompatibility) {
    return `# Compatibility Analysis

## The Dance of Sun Signs

The connection between Gemini Sun and Scorpio Sun is one of the most fascinating dynamics in the zodiac. You are drawn to each other's essential mystery — Gemini fascinated by Scorpio's depth, Scorpio intrigued by Gemini's versatility.

**Communication Style:** Gemini's natural fluency meets Scorpio's penetrating insight. Conversation between you can be electric, moving from light intellectual banter to profound psychological exploration. The key is respecting each other's pace — Scorpio needs depth while Gemini needs variety.

**Emotional Connection:** This is where the magic and the challenge reside. Gemini's airy, intellectual approach to emotions can feel superficial to water sign Scorpio. Meanwhile, Scorpio's intensity can feel overwhelming to Gemini's need for lightness and freedom. The bridge between you is curiosity — Gemini's willingness to dive deeper and Scorpio's ability to lighten up.

**Growth Edge:** Your differences are not obstacles; they are invitations to expand. Gemini teaches Scorpio to laugh more freely and embrace life's lighter moments. Scorpio teaches Gemini the beauty of emotional honesty and committed depth.`;
  }

  if (isTransit) {
    return `# Extended Transit Forecast

## February - April 2025

Your transits during this period bring a potent mix of action and introspection.

**Mars Trine Sun (Feb 6):** A surge of aligned energy makes this an ideal time to initiate projects and pursue goals with confidence. Your willpower is amplified, and you'll find that doors open with surprising ease. Take bold action on something you've been hesitating about.

**Mercury Square Saturn (Feb 9):** Mental blocks may arise around communication and decision-making. Patience is required — double-check details and avoid signing important documents. This is a temporary frustration, not a permanent obstacle.

**Venus Conjunct Jupiter (Feb 12):** A wave of expansion in love and abundance. This is one of the most fortunate transits of the year for matters of the heart and finances. Generosity flows naturally — receive it as gracefully as you give it.

**Saturn Return Begins (Mar 15):** A major life transition phase begins. This cosmic rite of passage asks you to take stock of your life's foundation and release what no longer serves your highest path. While challenging, Saturn Return ultimately builds the structure for your most authentic adult life.

**Jupiter Enters Gemini (Apr 20):** Expansion comes to your sign, bringing opportunities for growth, learning, and new horizons. This is your year to say yes to what excites you.`;
  }

  if (isDestiny) {
    return `# Saturn Return: Your Destiny Path

You are currently navigating your **Saturn Return** (July 2024 - February 2026), one of the most significant astrological rites of passage. This cosmic milestone, occurring every 29 years, marks your transition into full adulthood and authentic selfhood.

## Key Themes

**Responsibility:** Saturn asks you to own your life completely. This is the time to take adult responsibility for your choices, your relationships, and your direction. Excuses lose their power here.

**Transformation:** What was built on an unstable foundation will crumble — not to punish you, but to clear space for something more authentic. Embrace the dismantling as a necessary precursor to rebuilding.

**Life Restructuring:** Your career, relationships, and self-concept are all being restructured at a fundamental level. By the end of this cycle, you will have built a life that truly reflects who you are.

## Guidance

The most powerful question you can ask during this transit is: "Am I living my life, or someone else's idea of it?" Let Saturn strip away what isn't yours so you can stand firmly in what is.`;
  }

  if (isMatrix) {
    return `# Relationship Matrix

## The Five Dimensions of Connection

**Emotional Connection (78/100):** Strong emotional attunement between you. You can sense each other's moods and respond with genuine care. There is room to deepen vulnerability and share your deeper fears without reservation.

**Communication Flow (64/100):** This is your growth edge. Your communication styles differ significantly, which creates misunderstanding when stress is high. Practice active listening and give each other the benefit of the doubt. The love is there — the language needs translation.

**Spiritual Alignment (85/100):** Remarkable spiritual resonance. You share similar values about life's deeper meaning and what matters most. This connection feels fated, as if you've known each other in other lifetimes.

**Stability Foundation (71/100):** Moderate stability with room for strengthening. Your foundations are solid but could benefit from more intentional structure. Create shared rituals and commitments that honor your bond.

**Physical Chemistry (88/100):** Powerful physical and energetic attraction. Your bodies speak a language your minds are still learning. This natural chemistry is a gift — let it be a bridge to deeper emotional intimacy.`;
  }

  if (isKarmic) {
    return `# Karmic & Shadow Work

## North Node in Aries — South Node in Libra

Your soul's evolutionary path is marked by a powerful shift from **Libra to Aries**. In past lives, you mastered the art of relationship, diplomacy, and partnership. You learned to see all sides, to compromise, to keep the peace. But now your soul craves something different.

**The Karmic Challenge:** Your Libra conditioning pulls you toward people-pleasing, conflict avoidance, and defining yourself through others' eyes. The comfort of "we" can prevent you from discovering the power of "I."

**The Evolutionary Path (North Node in Aries):** Your soul is calling you to cultivate healthy selfishness. To know what YOU want, not just what others want from you. To lead, initiate, and trust your independent impulses. This is not about abandoning relationships — it's about entering them as a whole, self-defined individual rather than half a pair.

**Shadow Work Invitation:** Where in your life are you dimming your light to make others comfortable? Where are you saying yes when you mean no? These are your growth edges. The universe will keep presenting opportunities for you to choose yourself until you learn to do so.`;
  }

  if (isClosing) {
    return `# Closing Blessing

Beloved seeker, as you complete this reading of your cosmic blueprint, remember that the stars incline — they do not compel. The wisdom contained in these pages is not a prediction of a fixed future, but a map of your soul's terrain.

You carry within you the light of Gemini's curious mind, the depth of Pisces' compassionate heart, and the fire of Sagittarius' adventurous spirit. These are not just placements in a chart — they are your tools for navigating this lifetime with grace, authenticity, and purpose.

**May you walk your path with courage.** May you trust the timing of your life. And may you always remember that the universe is not happening to you — it is happening FOR you, through you, and as you.

With love and starlight,
Your Cosmic Guide`;
  }

  // Generic fallback for any other section
  return `# Your Reading

Thank you for opening yourself to this exploration of your cosmic blueprint. The insights that follow are drawn from the unique configuration of your birth chart and the current transits moving through the heavens.

## Key Insights

Your chart reveals a person of remarkable depth and potential. The combinations of signs and houses in your birth chart tell a story of someone who is here to learn, to grow, and to contribute something meaningful to the world.

**Your Strengths:** Your chart shows particular strength in the areas of communication, emotional intelligence, and creative expression. These are not random gifts — they are tools your soul chose for this lifetime's work.

**Your Growth Edges:** The challenging aspects in your chart point to areas where you will face resistance — and where your greatest growth awaits. What feels difficult now is simply the friction of your soul expanding beyond its current container.

## Guidance

The most powerful thing you can do with this knowledge is to bring it into your daily life. Astrology is not about predicting your future — it is about understanding your nature so you can make conscious choices aligned with your highest self.`;
}


export async function generateTarotSummary(fullText) {
  const messages = [
    { role: "system", content: "Summarize tarot readings succinctly." },
    { role: "user", content: `Summarize into 1-2 concise sentences for future reference.\n\n${fullText}` }
  ];
  const response = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.5,
    max_tokens: 120,
  });
  return response.choices[0]?.message?.content?.trim();
}

// NOTE: Groq doesn't support embeddings. 
// For now, use a local embedding model or keep OpenAI just for embeddings
// This is the only thing that might need OpenAI if you use embeddings
export async function createEmbedding(text) {
  // Fallback: if OPENAI_API_KEY exists, use OpenAI for embeddings
  // Otherwise return null or use a local embedding solution
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return res.data[0]?.embedding;
    } catch (error) {
      // Embeddings are optional for personalization/search.
      // Never fail core reading generation because of embedding provider limits.
      logger.warn('[Embeddings] OpenAI embedding failed; continuing without embedding:', error?.message || error);
      return null;
    }
  }
  // Return null if no OpenAI key - CSG can handle gracefully
  return null;
}

export async function generateCoachReply({ pastSummaries = [], newCard, question }) {
  const system = "You are a gentle AI spiritual coach. Use previous readings only to identify themes.";
  const user = `PAST_READINGS:\n${pastSummaries.map(s => `- ${s}`).join('\n')}\n\nNEW INPUT:\nNew card: ${newCard || '(none)'}\nQuestion: ${question || '(none)'}\n\nTASK:\n1) Identify continuity/themes between past readings and today's card.\n2) Give 3 practical steps for the next 7 days.\n3) Offer one 2-sentence reflection prompt and one micro-practice.\nTone: compassionate, action-oriented. Max 300 tokens.`;
  const response = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });
  return response.choices[0]?.message?.content?.trim();
}
