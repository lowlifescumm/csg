// /lib/openai.js
import OpenAI from "openai";
import { getPositionName } from "./tarot-data";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a tarot reading using ChatGPT.
 * You can swap model to a cheaper/faster one if you like.
 */
export async function generateTarotReading(cards, question, spread = "three-card", readingType = "general") {
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
  const prompt = [
    {
      role: "system",
      content:
        "You are an insightful, gentle tarot reader. You write warm, empowering readings with practical guidance. Avoid doom.",
    },
    {
      role: "user",
      content:
`Generate a personalized tarot reading.

Question: ${question || "(not provided)"}

Cards drawn:
${cards.map((card, i) =>
  `- ${getPositionName(spread, i)}: ${card.name} ${card.reversed ? "(Reversed)" : "(Upright)"}`
).join("\n")}

Reading Type: ${readingType}

Write 250–400 words that:
1) Address the question,
2) Interpret each card in its position,
3) Weave a cohesive narrative,
4) Offer actionable, compassionate advice.

Additional instructions: ${intentNote}`
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
