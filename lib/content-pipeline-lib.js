/**
 * Content Pipeline Library
 * Shared logic for the content automation pipeline.
 * Used by both the CLI script (scripts/content-pipeline.js)
 * and the API route (app/api/cron/content-pipeline/route.js)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Content Briefs ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRIEFS_PATH = join(__dirname, '../scripts/content-briefs-month-1.json');

export function loadBriefs() {
  return JSON.parse(readFileSync(BRIEFS_PATH, 'utf8'));
}

// ─── Image Generation (Pollinations.ai — free, no API key) ──────────────────

export function getThemeForPost(post) {
  const keyword = post.target_keyword || '';

  const themes = {
    'tarot': {
      prompt: `Mystical tarot cards floating in cosmic space, ethereal purple and gold lighting, spiritual atmosphere, dark celestial background with stars and nebula, professional product photography, 4K`,
      category: 'Tarot',
    },
    'zodiac': {
      prompt: `Zodiac constellation wheel with golden stars on deep cosmic purple background, astrological symbols, celestial elegance, mystical spiritual aesthetic, 4K`,
      category: 'Astrology',
    },
    'birth chart': {
      prompt: `Beautiful birth chart wheel with planets on a cosmic blue background, astrology wheel diagram, mystical spiritual aesthetic, detailed celestial map, 4K`,
      category: 'Astrology',
    },
    'compatibility': {
      prompt: `Two overlapping zodiac constellation circles merging with golden light, cosmic love connection, romantic celestial theme, deep purple and rose gold, spiritual love, 4K`,
      category: 'Compatibility',
    },
    'moon sign': {
      prompt: `Full moon over mystical ocean with moonlight reflecting silver, lunar goddess energy, spiritual serene atmosphere, dreamy blue and silver palette, 4K`,
      category: 'Astrology',
    },
    'mercury retrograde': {
      prompt: `Retrograde Mercury planet in cosmic space with communication symbols, glitch effect overlay, mystical purple and teal, retro sci-fi spiritual aesthetic, 4K`,
      category: 'Astrology',
    },
    'crystal': {
      prompt: `Beautiful crystals and gemstones arranged artfully with soft spiritual lighting, rose quartz amethyst and citrine, mystical crystal grid, warm ethereal glow, 4K`,
      category: 'Spiritual',
    },
    'manifestation': {
      prompt: `Manifestation journal open with golden pen and floating cosmic light particles, affirmation cards beside it, spiritual productivity aesthetic, warm gold and purple, 4K`,
      category: 'Spiritual',
    },
    'angel number': {
      prompt: `Glowing repeating numbers 111 222 333 floating in angelic cosmic light, divine spiritual message, golden numerology symbols, white and gold celestial background, 4K`,
      category: 'Spiritual',
    },
    'numerology': {
      prompt: `Numerology numbers and sacred geometry symbols glowing in cosmic space, golden mathematical patterns, spiritual mystical aesthetic, 4K`,
      category: 'Numerology',
    },
    'twin flame': {
      prompt: `Two mirror-image flames merging into one cosmic light, twin flame spiritual concept, warm orange and purple dual tones, ethereal and romantic, 4K`,
      category: 'Love',
    },
    'love': {
      prompt: `Cosmic love connection visualization, two souls as stars connecting with golden light beam, romantic celestial art, deep purple and rose gold palette, spiritual love, 4K`,
      category: 'Love',
    },
    'career': {
      prompt: `Career success constellation in night sky, professional achievement spiritual concept, golden stars forming success path, cosmic blue background, motivational mystical aesthetic, 4K`,
      category: 'Career',
    },
    'default': {
      prompt: `Mystical spiritual cosmic background with stars and soft purple blue gradient, ethereal floating particles, magical celestial atmosphere, clean minimal design, 4K`,
      category: 'Spiritual',
    },
  };

  for (const [key, val] of Object.entries(themes)) {
    if (keyword.toLowerCase().includes(key)) return val;
  }
  return themes.default;
}

export function buildImageUrl(post) {
  const keyword = post.target_keyword || post.title || 'spiritual';
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const theme = getThemeForPost(post);
  const prompt = `${theme.prompt}, ${keyword} spiritual guide article`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

// ─── Social Copy Generation ────────────────────────────────────────────────────

export function generateSocialCopy(post, siteUrl, slug) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const postUrl = `${siteUrl}/blog/${slug}`;

  const xCopy = `${title}\n\nFree guide: ${postUrl}\n\n#${keyword.replace(/ /g, '')} #astrology #spirituality`;

  const pinterestCopy = `${title}\n\nDiscover the secrets of ${keyword} with this free spiritual guide. Click to read the full guide on CosmicSpiritGuide.com. #${keyword.replace(/ /g, '')} #astrology #spirituality #pinterest`;

  const instagramCopy = `${title}\n\nTap the link in bio for the full guide 🌙✨\n\n#${keyword.replace(/ /g, '')} #astrology #spirituality #cosmic #zodiac #mystical`;

  return { xCopy, pinterestCopy, instagramCopy, postUrl };
}

// ─── Article HTML Generation ───────────────────────────────────────────────────

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function generateArticleContent(post) {
  const title = post.title_options?.[0] || post.title || '';
  const metaDesc = post.meta_description || '';
  const keyword = post.target_keyword || '';
  const h2s = post.h2_headings || [];
  const cta = post.cta || 'Explore our full astrology guides →';

  const contentTemplates = {
    'zodiac compatibility calculator': {
      intro: `The stars have been guiding human connection for thousands of years — and modern astrology has distilled that wisdom into something remarkably practical: the zodiac compatibility calculator. Whether you're exploring a new relationship, deepening a current one, or simply curious about your cosmic connection with someone special, understanding how your signs interact can offer insights that go far beyond the "just vibes" stereotype.\n\nThis guide walks you through every layer of astrological compatibility — from your sun sign's basic chemistry to the hidden emotional language of your moon sign and the first-impression energy of your rising sign. By the end, you'll know exactly how to interpret your compatibility results and what they actually mean for your relationship.`,
      sections: {
        'How Zodiac Compatibility Works': `Astrological compatibility isn't just about your sun sign — it's about how four different planetary placements interact: your sun sign (core identity), moon sign (emotional nature), rising sign (how others perceive you), and mercury (how you communicate).\n\nWhen two people meet, their charts create aspects — angular relationships between planets — that reveal harmony or tension. Trines (120 degrees apart) flow easily. Squares (90 degrees apart) create productive friction. Oppositions (180 degrees apart) offer complementary but require awareness.\n\nThe most compatible combinations share elemental affinities: Fire signs (Aries, Leo, Sagittarius) resonate with Fire; Earth signs (Taurus, Virgo, Capricorn) with Earth; Air with Air; Water with Water. But cross-element connections — like a Fire sun with an Air moon — create dynamic, growth-oriented pairings that keep things interesting.\n\nNo single aspect defines compatibility. A relationship with challenging aspects can thrive with self-awareness, just as one with all trines can become complacent. Use your compatibility results as a map, not a verdict.`,
        'Sun Sign Compatibility Chart': `Your sun sign compatibility forms the foundation of your relationship's day-to-day rhythm. Here's what each pairing tends to bring:\n\nFire + Fire (Aries-Aries, Leo-Leo, Sagittarius-Sagittarius): High passion, high intensity. These pairings spark easily but can combust just as fast. Best when both partners channel energy into shared goals rather than competition.\n\nFire + Air (Aries with Gemini, Libra, or Aquarius): Dynamic and mentally stimulating. Air fans Fire's creative flames. Watch for impatience — Fire moves fast, Air wants to deliberate.\n\nFire + Earth (Aries with Taurus, Virgo, or Capricorn): Challenging but potentially grounding. Fire wants to charge ahead; Earth wants to build steadily. Success requires mutual respect for each other's pace.\n\nEarth + Earth: Stable, loyal, deeply practical. These pairings build empires together. Watch for boredom or excessive pragmatism without enough play.\n\nEarth + Water: One of the most naturally nurturing combinations. Water's emotional depth meets Earth's stability. Risk: Earth suppressing Water's emotional needs, or Water overwhelming Earth with intensity.\n\nAir + Air: Mentally electric. These pairs can talk for hours and never run out of ideas. Watch for living in theory without enough physical or emotional grounding.\n\nAir + Water: Fascinating but challenging. Air's logic can feel cold to Water; Water's depth can feel overwhelming to Air. The bridge is learning each other's language.`,
        'Moon Sign Emotional Connection': `Your moon sign governs your emotional inner world — what you need to feel emotionally safe, how you process feelings, and what you instinctively look for in a partner's emotional responses.\n\nWhen two moon signs are compatible, partners can often sense each other's moods without words. They create a shared emotional language that makes the relationship feel like home.\n\nMoon sign compatibility is especially powerful for long-term relationships. A sun sign connection might spark intense initial chemistry, but moon sign harmony keeps the relationship growing through life's inevitable challenges.\n\nTo find your moon sign, you'll need your exact birth time and location — our birth chart calculator provides this automatically when you enter your details.`,
        'Rising Sign First Impressions': `Your rising sign (ascendant) shapes how the world sees you — your style, your energy, your first impression. When two rising signs connect well, that initial meeting feels natural and effortless.\n\nSome rising sign pairings create immediate rapport: Air rising with Air rising = instant mental connection. Fire rising with Fire rising = instant energy and excitement. Earth rising with Earth rising = instant comfort and trust.\n\nCross-element rising sign pairings can be equally compelling — there's often a magnetic quality to opposites in rising signs. But these need more conscious navigation.`,
        'Free Compatibility Calculator': `Ready to explore your cosmic connection? Our free zodiac compatibility calculator lets you input any two birth dates and instantly receive a full compatibility breakdown across sun signs, moon signs, and rising signs.\n\nYou'll get personalized insights including:\n• Overall compatibility score\n• Strengths and challenges of your pairing\n• Communication style compatibility\n• Emotional needs alignment\n• Ideal relationship areas and growth areas\n\nThe calculator is completely free to use, no account required. Enter your birth details and your partner's below.`,
        'What Your Results Mean': `Your compatibility results offer a framework for understanding your relationship dynamics — not a predetermined outcome.\n\nKey areas to focus on:\n1. Communication styles — How do you each express needs and concerns?\n2. Emotional languages — Are your love languages compatible?\n3. Conflict patterns — Where do you naturally friction?\n4. Shared values — Do your core life values align?\n\nThe goal isn't to find a "perfect" match but to understand your specific pattern so you can consciously build the relationship you want. Many successful long-term partnerships include signs that astrologically create tension — what matters is self-awareness and mutual commitment to growth.\n\nAbsolutely. Many of the most profound, growth-oriented relationships span challenging aspects. Astrology identifies tendencies, not destinies. Conscious communication, mutual respect, and a shared commitment to growth consistently outweigh "natural compatibility" in long-term relationship success.`,
      },
    },
  };

  // Default template for keywords not explicitly mapped
  const defaultTemplate = {
    intro: `Understanding ${keyword} can transform how you navigate life's journey. This comprehensive guide breaks down everything you need to know about ${keyword} — from the basics to the deeper spiritual significance.\n\nWhether you're new to astrology or looking to deepen your understanding, this guide offers clear, actionable insights you can apply immediately.`,
    sections: {},
  };

  const tmpl = contentTemplates[keyword] || defaultTemplate;

  h2s.forEach(h2 => {
    if (!tmpl.sections[h2]) {
      tmpl.sections[h2] = `Understanding ${h2} is an important part of your spiritual journey. This section breaks down what you need to know.\n\n${h2} influences your life in ways both subtle and profound. Take time to reflect on how this energy shows up in your own experience.\n\nMany people find that keeping a journal helps them track their observations and growth in this area over time.`;
    }
  });

  const sectionsHtml = h2s.map(h2 => {
    const content = tmpl.sections[h2] || `Insight on ${h2} — explore how this applies to your spiritual journey.`;
    const paragraphs = content.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n');
    return `<h2>${h2}</h2>\n${paragraphs}`;
  }).join('\n\n');

  const faqContent = [
    `What does ${keyword} mean?`,
    `How does ${keyword} affect daily life?`,
    `Can ${keyword} change over time?`,
    `How accurate is ${keyword} analysis?`,
  ].map(q => `<details><summary>${q}</summary><p>Understanding ${keyword} is a journey. The more you learn, the more nuanced your insights become. Start with the basics above and deepen your practice over time.</p></details>`).join('\n');

  const html = `
<h1>${title}</h1>
<p class="lead">${metaDesc}</p>

${sectionsHtml}

<h2>Frequently Asked Questions</h2>
${faqContent}

<div class="cta-box">
<p><strong>${cta}</strong></p>
<p><a href="${process.env.SITE_URL || 'https://cosmicspiritguide.com'}/services" class="btn-primary">Explore All Guides →</a></p>
</div>`;

  return html.trim();
}
