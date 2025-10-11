import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function calculateCompatibilityScores(chart1, chart2) {
  const scores = {
    overall: 0,
    emotional: 0,
    communication: 0,
    passion: 0,
    longTerm: 0,
    challenges: 0
  };

  if (chart1.planets.sun.sign === chart2.planets.moon.sign) {
    scores.emotional += 20;
  }
  if (chart1.planets.moon.sign === chart2.planets.sun.sign) {
    scores.emotional += 20;
  }
  
  const moon1Element = getElement(chart1.planets.moon.sign);
  const moon2Element = getElement(chart2.planets.moon.sign);
  
  if (moon1Element === moon2Element) {
    scores.emotional += 15;
  } else if (areCompatibleElements(moon1Element, moon2Element)) {
    scores.emotional += 10;
  } else {
    scores.challenges += 15;
  }

  const mercury1Element = getElement(chart1.planets.mercury.sign);
  const mercury2Element = getElement(chart2.planets.mercury.sign);
  
  if (mercury1Element === mercury2Element) {
    scores.communication += 25;
  } else if (areCompatibleElements(mercury1Element, mercury2Element)) {
    scores.communication += 15;
  } else {
    scores.challenges += 10;
  }

  if (chart1.planets.mercury.sign === chart2.planets.mercury.sign) {
    scores.communication += 10;
  }

  if (chart1.planets.venus.sign === chart2.planets.mars.sign) {
    scores.passion += 25;
  }
  if (chart1.planets.mars.sign === chart2.planets.venus.sign) {
    scores.passion += 25;
  }

  const venus1Element = getElement(chart1.planets.venus.sign);
  const venus2Element = getElement(chart2.planets.venus.sign);
  
  if (venus1Element === venus2Element) {
    scores.passion += 15;
  } else if (areCompatibleElements(venus1Element, venus2Element)) {
    scores.passion += 10;
  }

  const mars1Element = getElement(chart1.planets.mars.sign);
  const mars2Element = getElement(chart2.planets.mars.sign);
  
  if (mars1Element === mars2Element) {
    scores.passion += 10;
  } else if (!areCompatibleElements(mars1Element, mars2Element)) {
    scores.challenges += 15;
  }

  const saturn1Element = getElement(chart1.planets.saturn.sign);
  const saturn2Element = getElement(chart2.planets.saturn.sign);
  
  if (saturn1Element === saturn2Element) {
    scores.longTerm += 20;
  } else if (areCompatibleElements(saturn1Element, saturn2Element)) {
    scores.longTerm += 10;
  }

  const jupiter1Element = getElement(chart1.planets.jupiter.sign);
  const jupiter2Element = getElement(chart2.planets.jupiter.sign);
  
  if (jupiter1Element === jupiter2Element) {
    scores.longTerm += 15;
  } else if (areCompatibleElements(jupiter1Element, jupiter2Element)) {
    scores.longTerm += 10;
  }

  if (chart1.ascendant === chart2.ascendant) {
    scores.overall += 10;
  } else if (getElement(chart1.ascendant) === getElement(chart2.ascendant)) {
    scores.overall += 5;
  }

  scores.overall = Math.round(
    (scores.emotional * 0.25) +
    (scores.communication * 0.25) +
    (scores.passion * 0.25) +
    (scores.longTerm * 0.20) +
    (100 - scores.challenges) * 0.05
  );

  scores.emotional = Math.min(scores.emotional, 100);
  scores.communication = Math.min(scores.communication, 100);
  scores.passion = Math.min(scores.passion, 100);
  scores.longTerm = Math.min(scores.longTerm, 100);
  scores.overall = Math.min(scores.overall, 100);

  return scores;
}

function getElement(sign) {
  const elements = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
  };
  return elements[sign];
}

function areCompatibleElements(el1, el2) {
  const compatible = {
    Fire: ['Air', 'Fire'],
    Air: ['Fire', 'Air'],
    Earth: ['Water', 'Earth'],
    Water: ['Earth', 'Water']
  };
  return compatible[el1]?.includes(el2);
}

function getCompatibilityInsights(chart1, chart2, person1Name, person2Name) {
  const insights = [];

  if (chart1.planets.sun.sign === chart2.planets.sun.sign) {
    insights.push(`Both are ${chart1.planets.sun.sign} suns - you understand each other's core identity deeply, but may be too similar in some ways.`);
  }

  if (chart1.planets.moon.sign === chart2.planets.moon.sign) {
    insights.push(`Matching ${chart1.planets.moon.sign} moons - you process emotions the same way, creating natural emotional understanding.`);
  }

  if (chart1.planets.venus.sign === chart2.planets.mars.sign) {
    insights.push(`${person1Name}'s Venus matches ${person2Name}'s Mars - strong magnetic attraction.`);
  }
  if (chart2.planets.venus.sign === chart1.planets.mars.sign) {
    insights.push(`${person2Name}'s Venus matches ${person1Name}'s Mars - powerful romantic chemistry.`);
  }

  if (chart1.planets.mercury.sign === chart2.planets.mercury.sign) {
    insights.push(`Matching Mercury in ${chart1.planets.mercury.sign} - you speak the same mental language.`);
  }

  const opposites = {
    'Aries': 'Libra', 'Taurus': 'Scorpio', 'Gemini': 'Sagittarius',
    'Cancer': 'Capricorn', 'Leo': 'Aquarius', 'Virgo': 'Pisces',
    'Libra': 'Aries', 'Scorpio': 'Taurus', 'Sagittarius': 'Gemini',
    'Capricorn': 'Cancer', 'Aquarius': 'Leo', 'Pisces': 'Virgo'
  };

  if (chart1.planets.sun.sign === opposites[chart2.planets.sun.sign]) {
    insights.push(`Opposite Sun signs - you're different but complementary, like two sides of a coin.`);
  }

  return insights;
}

export async function generateCompatibilityReport(chart1, chart2, person1Name, person2Name) {
  const scores = calculateCompatibilityScores(chart1, chart2);
  const insights = getCompatibilityInsights(chart1, chart2, person1Name, person2Name);

  const prompt = `You are an expert astrologer. Generate a detailed relationship compatibility report for ${person1Name} and ${person2Name}.

**${person1Name}'s Chart:**
- Sun: ${chart1.planets.sun.sign}
- Moon: ${chart1.planets.moon.sign}
- Rising: ${chart1.ascendant}
- Venus: ${chart1.planets.venus.sign}
- Mars: ${chart1.planets.mars.sign}
- Mercury: ${chart1.planets.mercury.sign}

**${person2Name}'s Chart:**
- Sun: ${chart2.planets.sun.sign}
- Moon: ${chart2.planets.moon.sign}
- Rising: ${chart2.ascendant}
- Venus: ${chart2.planets.venus.sign}
- Mars: ${chart2.planets.mars.sign}
- Mercury: ${chart2.planets.mercury.sign}

**Calculated Compatibility Scores:**
- Overall: ${scores.overall}/100
- Emotional Connection: ${scores.emotional}/100
- Communication: ${scores.communication}/100
- Romantic Chemistry: ${scores.passion}/100
- Long-term Potential: ${scores.longTerm}/100
- Challenge Areas: ${scores.challenges}/100

**Key Insights:**
${insights.join('\n')}

Create a comprehensive compatibility report with these sections:

**Overall Compatibility** (3-4 sentences)
Start with the overall score and give a general assessment. Be honest but constructive. Explain what makes this pairing unique.

**Emotional Connection** (3-4 sentences)
Focus on Sun-Moon synastry and emotional understanding. How do they nurture each other? Where might they misunderstand each other emotionally?

**Communication Style** (3-4 sentences)
Based on Mercury placements. How do they express thoughts? Will they understand each other's communication? What adjustments might help?

**Romantic Chemistry** (3-4 sentences)
Venus-Mars dynamics. Physical and romantic attraction. Love languages. What draws them together?

**Strengths of This Pairing** (3 bullet points)
Be specific to their placements. What works really well?

**Potential Challenges** (3 bullet points)
Be constructive and specific. What areas need awareness and work?

**Long-Term Outlook** (3-4 sentences)
Can this relationship last? What does it need to thrive? Saturn and Jupiter considerations.

**Advice for Success** (2-3 sentences)
Practical guidance for making this relationship work.

IMPORTANT STYLE GUIDELINES:
- Be honest but kind and constructive
- Use specific astrological terms but explain them
- Don't be overly pessimistic even with low scores (every relationship can work with awareness)
- Don't be overly optimistic either - be realistic
- Make it feel personal to these specific placements
- Avoid generic advice that could apply to anyone
- Total length: 600-800 words

Write the report now:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert relationship astrologer with 20 years of experience. You provide insightful, balanced, and personalized compatibility readings that help people understand relationship dynamics. You are honest but constructive, never doom-and-gloom."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  return {
    scores,
    report: completion.choices[0].message.content,
    insights,
    timestamp: new Date().toISOString()
  };
}
