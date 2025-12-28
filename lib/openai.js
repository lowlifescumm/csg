// /lib/openai.js
import OpenAI from "openai";
import { getPositionName } from "./tarot-data";
import spreads from "@/lib/tarot-spreads.json";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a tarot reading using ChatGPT.
 * You can swap model to a cheaper/faster one if you like.
 */
export async function generateTarotReading(cards, question, spread = "three-card", readingType = "general", historySummary = null) {
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

  // Build system prompt with history interpretation instructions if history is available
  let systemPromptContent = "You are an elite intuitive Tarot reader. You do not speak in vague generalities. You weave the cards together into a specific, startlingly accurate narrative. Your tone is empathetic but direct—you are a truth-teller, not just a comforter. You focus on 'The Why' and 'The How'. Format your response using Markdown. Use double asterisks (**) for bolding card names and key phrases. Use standard paragraph breaks (double newline). Do NOT use HTML tags.";

  // Add history interpretation instructions to system prompt if history is available
  if (historySummary && (historySummary.repeatingCards?.length > 0 || historySummary.recentThemes?.length > 0)) {
    const repeatingCardsText = historySummary.repeatingCards?.length > 0
      ? historySummary.repeatingCards.join(', ')
      : 'None';
    const recentThemesText = historySummary.recentThemes?.length > 0
      ? historySummary.recentThemes.join(', ')
      : 'None';

    systemPromptContent += `

### USER HISTORY & CONTINUITY
Recent Themes: ${recentThemesText}
Repeating Cards: ${repeatingCardsText}

INSTRUCTIONS:
> 1. If this is a returning user (history is present), open the reading with a 'Continuity Hook' (e.g., 'It's good to see you again; the patterns we saw last time regarding [Theme] are evolving...').
> 2. If a card pulled today matches a 'Repeating Card,' emphasize its significance. Treat it as a 'Message that Refuses to be Ignored.'
> 3. Connect today's planetary transits to their past questions. (e.g., 'Last time you asked about your career; today's Saturn transit suggests that the structural changes we discussed are now taking root.').
> 4. Avoid Robotic Recital: Do not list the history as a table. Weave it into the narrative naturally, like a guide who has been walking beside them.`;
  }

  // Build Memory section if history is available (for user prompt context)
  let memorySection = '';
  if (historySummary && (historySummary.repeatingCards?.length > 0 || historySummary.recentThemes?.length > 0)) {
    const repeatingCardsText = historySummary.repeatingCards?.length > 0
      ? historySummary.repeatingCards.join(', ')
      : 'None';
    const recentThemesText = historySummary.recentThemes?.length > 0
      ? historySummary.recentThemes.join(', ')
      : 'None';
    
    memorySection = `
MEMORY:
Recent History: The user has repeatedly pulled these cards: [${repeatingCardsText}]. Their recent focus has been on: [${recentThemesText}]. If these themes appear in the current reading, acknowledge the continuity.

`;
  }

  const prompt = [
    {
      role: "system",
      content: systemPromptContent,
    },
    {
      role: "user",
      content: `
Generate a high-impact tarot reading.

CONTEXT:
Reading Type: ${readingType}
${shouldIncludeQuestionSection && question ? `Specific User Situation: "${question}"\n(CRITICAL: Relate every single card back to this specific situation. Do not ignore this context.)` : "User Intent: General Guidance"}
${memorySection}
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

  // Responses API (Chat Completions-style)
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: prompt,
    temperature: 0.8,
    max_tokens: 800,
  });

  return response.choices[0]?.message?.content?.trim() || "I’m sorry—no reading was generated.";
}

/**
 * Generic text generation function for reports
 * Uses OpenAI Chat Completions API
 */
export async function generateText(prompt, options = {}) {
  const {
    model = 'gpt-4o-mini',
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

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

export async function generateTarotSummary(fullText) {
  const messages = [
    { role: "system", content: "Summarize tarot readings succinctly." },
    { role: "user", content: `Summarize into 1-2 concise sentences for future reference.\n\n${fullText}` }
  ];
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.5,
    max_tokens: 120,
  });
  return response.choices[0]?.message?.content?.trim();
}

export async function createEmbedding(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0]?.embedding;
}

export async function generateCoachReply({ pastSummaries = [], newCard, question }) {
  const system = "You are a gentle AI spiritual coach. Use previous readings only to identify themes.";
  const user = `PAST_READINGS:\n${pastSummaries.map(s => `- ${s}`).join('\n')}\n\nNEW INPUT:\nNew card: ${newCard || '(none)'}\nQuestion: ${question || '(none)'}\n\nTASK:\n1) Identify continuity/themes between past readings and today's card.\n2) Give 3 practical steps for the next 7 days.\n3) Offer one 2-sentence reflection prompt and one micro-practice.\nTone: compassionate, action-oriented. Max 300 tokens.`;
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    max_tokens: 400,
  });
  return response.choices[0]?.message?.content?.trim();
}
