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
export async function generateTarotReading(cards, question, spread = "three-card") {
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

Write 300–400 words that:
1) Address the question,
2) Interpret each card in its position,
3) Weave a cohesive narrative,
4) Offer actionable, compassionate advice.`
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
