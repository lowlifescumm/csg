/**
 * Content Pipeline Library
 * Shared logic for the content automation pipeline.
 * Used by both the CLI script (scripts/content-pipeline.js)
 * and the API route (app/api/cron/content-pipeline/route.js)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname_file = dirname(fileURLToPath(import.meta.url));

// ─── Content Briefs ───────────────────────────────────────────────────────────

export function loadBriefs() {
  // Try multiple paths depending on whether we're running as CLI or in Next.js
  const paths = [
    join(__dirname_file, '../scripts/content-briefs-month-1.json'),
    join(process.cwd(), 'scripts/content-briefs-month-1.json'),
    '/opt/render/project/src/scripts/content-briefs-month-1.json',
  ];

  for (const p of paths) {
    try {
      if (existsSync(p)) {
        return JSON.parse(readFileSync(p, 'utf8'));
      }
    } catch (err) {
      console.error("[content-pipeline-lib] Failed to load briefs:", err);
    }
  }
  throw new Error(`Could not find content-briefs-month-1.json in any of: ${paths.join(', ')}`);
}

// ─── Theme Detection ───────────────────────────────────────────────────────────

export function getThemeForPost(post) {
  const keyword = post.target_keyword || '';
  const title = (post.title_options?.[0] || post.title || '').toLowerCase();
  const search = (keyword + ' ' + title).toLowerCase();

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
    if (search.includes(key)) return val;
  }
  return themes.default;
}

// ─── Image URL Builder (Pollinations.ai — free, no API key) ──────────────────

export function buildImageUrl(post) {
  const keyword = post.target_keyword || post.title || 'spiritual';
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const theme = getThemeForPost(post);
  const prompt = `${theme.prompt}, ${keyword} spiritual guide article`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=630&seed=${seed}&nologo=true`;
}

// ─── Social Copy Generation ────────────────────────────────────────────────────

function buildXCopy(title, keyword, url, intent) {
  if (intent === 'Transactional') {
    return `${title}\n\nFree tool + guide. Tap the link to calculate your ${keyword} instantly 🧭✨\n${url}`;
  }
  const templates = [
    `${title}\n\nEverything you need to know about ${keyword}. Guide + free tool linked below 👇\n${url}`,
    `The complete guide to ${keyword} is here.\n\nSave this for when you need it 🪄\n${url}`,
    `Curious about ${keyword}? This guide breaks it all down:\n\n↓ Tap the link ↓\n${url}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)].slice(0, 280);
}

function buildPinterestCopy(title, keyword, url) {
  return `${title}\n\nTap the link for the full guide to ${keyword} + free calculator. #astrology #${keyword.replace(/ /g, '')} #spirituality #cosmicspiritguide`;
}

function buildInstagramCopy(title, keyword, url) {
  return `✨ ${title} ✨\n\nLink in bio for the full guide + free ${keyword} calculator 🧭\n\nSave this post for later ⚡\n\n#astrology #${keyword.replace(/ /g, '')} #spirituality #zodiac #cosmicspiritguide`;
}

export function generateSocialCopy(post, siteUrl, slug) {
  const title = post.title_options?.[0] || post.title || '';
  const keyword = post.target_keyword || '';
  const intent = post.search_intent || '';
  const postUrl = `${siteUrl}/blog/${slug}`;

  return {
    xCopy: buildXCopy(title, keyword, postUrl, intent),
    pinterestCopy: buildPinterestCopy(title, keyword, postUrl),
    instagramCopy: buildInstagramCopy(title, keyword, postUrl),
    postUrl,
  };
}

// ─── Utility ───────────────────────────────────────────────────────────────────

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Article HTML Generation ───────────────────────────────────────────────────

function mdToHtml(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .split(/\n\n+/)
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<li>')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

export function generateArticleContent(post) {
  const title = post.title_options?.[0] || post.title || '';
  const metaDesc = post.meta_description || '';
  const keyword = post.target_keyword || '';
  const h2s = post.h2_headings || [];
  const cta = post.cta || 'Explore our full astrology guides →';
  const siteUrl = process.env.SITE_URL || 'https://cosmicspiritguide.com';

  const contentTemplates = {
    'zodiac compatibility calculator': {
      intro: `The stars have been guiding human connection for thousands of years — and modern astrology has distilled that wisdom into something remarkably practical: the zodiac compatibility calculator. Whether you're exploring a new relationship, deepening a current one, or simply curious about your cosmic connection with someone special, understanding how your signs interact can offer insights that go far beyond the "just vibes" stereotype.\n\nThis guide walks you through every layer of astrological compatibility — from your sun sign's basic chemistry to the hidden emotional language of your moon sign and the first-impression energy of your rising sign. By the end, you'll know exactly how to interpret your compatibility results and what they actually mean for your relationship.`,
      sections: {
        'How Zodiac Compatibility Works': `Astrological compatibility isn't just about your sun sign — it's about how four different planetary placements interact: your sun sign (core identity), moon sign (emotional nature), rising sign (how others perceive you), and mercury (how you communicate).\n\nWhen two people meet, their charts create aspects — angular relationships between planets — that reveal harmony or tension. Trines (120 degrees apart) flow easily. Squares (90 degrees apart) create productive friction. Oppositions (180 degrees apart) offer complementary but require awareness.\n\nThe most compatible combinations share elemental affinities: Fire signs (Aries, Leo, Sagittarius) resonate with Fire; Earth signs (Taurus, Virgo, Capricorn) with Earth; Air with Air; Water with Water. But cross-element connections — like a Fire sun with an Air moon — create dynamic, growth-oriented pairings that keep things interesting.\n\nNo single aspect defines compatibility. A relationship with challenging aspects can thrive with self-awareness, just as one with all trines can become complacent. Use your compatibility results as a map, not a verdict.`,
        'Sun Sign Compatibility Chart': `Your sun sign compatibility forms the foundation of your relationship's day-to-day rhythm. Here's what each pairing tends to bring:\n\nFire + Fire (Aries-Aries, Leo-Leo, Sagittarius-Sagittarius): High passion, high intensity. These pairings spark easily but can combust just as fast. Best when both partners channel energy into shared goals rather than competition.\n\nFire + Air (Aries with Gemini, Libra, or Aquarius): Dynamic and mentally stimulating. Air fans Fire's creative flames. Watch for impatience — Fire moves fast, Air wants to deliberate.\n\nFire + Earth (Aries with Taurus, Virgo, or Capricorn): Challenging but potentially grounding. Fire wants to charge ahead; Earth wants to build steadily. Success requires mutual respect for each other's pace.\n\nEarth + Earth: Stable, loyal, deeply practical. These pairings build empires together. Watch for boredom or excessive pragmatism without enough play.\n\nEarth + Water: One of the most naturally nurturing combinations. Water's emotional depth meets Earth's stability. Risk: Earth suppressing Water's emotional needs, or Water overwhelming Earth with intensity.\n\nAir + Air: Mentally electric. These pairs can talk for hours and never run out of ideas. Watch for living in theory without enough physical or emotional grounding.\n\nAir + Water: Fascinating but challenging. Air's logic can feel cold to Water; Water's depth can feel overwhelming to Air. The bridge is learning each other's language.`,
        'Moon Sign Emotional Connection': `If sun signs are the steering wheel of a relationship, moon signs are the engine. Your moon sign governs your deepest emotional needs — what makes you feel secure, loved, and understood.\n\nWhen two moon signs harmonize, partners tend to instinctively meet each other's needs. A Cancer moon with a Scorpio moon understands unspoken emotional currents. A Libra moon and a Gemini moon share a need for mental connection as a form of intimacy.\n\nChallenging moon sign aspects aren't dealbreakers — they're invitations to grow. A Virgo moon with a Sagittarius moon both value expansion but process emotions differently. The Virgo moon needs order to feel safe; the Sagittarius moon needs freedom. With conscious communication, this tension becomes an asset.`,
        'Rising Sign First Impressions': `Your rising sign — also called the ascendant — is the mask you wear when meeting the world. It's what people notice first about you, and it shapes the initial chemistry between two people.\n\nA Leo rising meeting a Capricorn rising might feel like an unexpectedly smooth first encounter — both value presence and gravitas. An Aries rising meeting a Pisces rising creates immediate intrigue — Fire's directness meeting Water's mystery.\n\nRising sign compatibility matters most in new relationships and social contexts. In long-term partnerships, it often manifests as how the couple presents to the world rather than the internal relationship dynamic.`,
        'Free Compatibility Calculator': `Ready to see how your signs actually interact? Our free zodiac compatibility calculator lets you compare any two sun signs instantly — no signup required.\n\nEnter two birth signs, and within seconds you'll get a breakdown of your elemental compatibility, communication style alignment, and overall relationship tendency. For deeper insights, add birth times to unlock moon sign and rising sign comparisons.\n\nThink of it as the practical companion to everything you've read here. Come back to this tool after reading through the rest of the guide — you'll find the results much more meaningful once you understand why the numbers fall where they do.`,
        'What Your Results Mean': `A high compatibility score doesn't guarantee a perfect relationship — and a low score doesn't mean you're doomed. Here's how to read your results:\n\n80-100%: Natural harmony. You likely share values, communicate similarly, and meet each other's needs with relative ease. The work here is avoiding complacency and continuing to grow together.\n\n60-79%: Solid with nuance. You have strong foundations with specific areas requiring conscious attention. Identify your top 2-3 friction points and build communication strategies for those specifically.\n\n40-59%: Growth-oriented pairing. You're here to teach each other something. The challenge is real but so is the potential for deep mutual evolution.\n\nBelow 40%: Requires significant awareness and commitment from both partners. Not impossible — but go in with eyes open and a commitment to communication.\n\nNo number captures the full picture. Two people with "50% compatibility" who are both committed to growth and honest communication will outperform two "90% compatible" people coasting on natural ease.`,
      },
    },
  };

  const tmpl = contentTemplates[keyword] || null;
  const sectionContent = tmpl ? tmpl.sections : null;

  const sectionsHtml = h2s.map(h2 => {
    let content = '';
    if (sectionContent && sectionContent[h2]) {
      content = mdToHtml(sectionContent[h2]);
    } else {
      content = `<p>This section covers <strong>${h2}</strong> in the context of ${keyword}. Understanding this aspect can provide meaningful insights into your relational dynamics and personal growth path.</p>`;
    }
    return `<h2>${h2}</h2>\n${content}`;
  }).join('\n\n');

  const faqContent = `
<h3>What is ${keyword}?</h3>
<p>${keyword.charAt(0).toUpperCase() + keyword.slice(1)} is a tool and framework for understanding astrological relationship dynamics. It examines the interplay between planetary placements to reveal harmony, tension, and growth opportunities.</p>

<h3>How accurate is a zodiac compatibility reading?</h3>
<p>Accuracy depends on the quality of the birth data you provide. Exact birth times produce the most precise readings — especially for rising sign and moon sign calculations. The deeper insights remain valuable even with approximate data.</p>

<h3>Can incompatible signs make a relationship work?</h3>
<p>Absolutely. Many of the most profound, growth-oriented relationships span challenging aspects. Astrology identifies tendencies, not destinies. Conscious communication, mutual respect, and a shared commitment to growth consistently outweigh "natural compatibility" in long-term relationship success.</p>

<h3>What's the most important sign for compatibility?</h3>
<p>Many astrologers point to moon sign compatibility as most predictive of long-term relationship satisfaction. Your moon sign governs your emotional core needs. When two people instinctively meet each other's emotional needs, the relationship has a foundation that sun sign differences can't shake.</p>
`;

  const html = `
<h1>${title}</h1>
<p class="lead">${metaDesc}</p>

${sectionsHtml}

<h2>Frequently Asked Questions</h2>
${faqContent}

<div class="cta-box">
<p><strong>${cta}</strong></p>
<p><a href="${siteUrl}/services" class="btn-primary">Explore All Guides →</a></p>
</div>`;

  return html.trim();
}
