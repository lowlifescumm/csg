const logger = require('./logger');

/**
 * Cross-Section Consistency Validator
 *
 * Validates that multi-section reports maintain consistency across sections
 * for name spelling, birth data, and duplicate section types.
 */

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Normalize a string for fuzzy comparison.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Extract plain text from a section content field.
 */
function extractText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object') {
    if (typeof content.content === 'string') return content.content;
    if (typeof content.text === 'string') return content.text;
    return JSON.stringify(content);
  }
  return String(content);
}

/**
 * Find all approximate matches of a target name in text.
 * Returns an array of found strings that are close but not exact.
 */
function findApproximateNameMatches(text, canonicalName) {
  if (!canonicalName || !text) return [];
  const normTarget = normalize(canonicalName);
  if (!normTarget) return [];

  const matches = new Set();
  // Tokenize and clean punctuation from edges
  const tokens = text.split(/\s+/).map(t => t.replace(/^\W+|\W+$/g, ''));

  for (let i = 0; i < tokens.length; i++) {
    // Try n-grams of length 1 to 4
    for (let len = 1; len <= 4 && i + len <= tokens.length; len++) {
      const ngram = tokens.slice(i, i + len).join(' ');
      // Only consider n-grams where every word starts with a capital letter
      const words = ngram.split(/\s+/);
      const allCapitalized = words.every(w => /^[A-Z]/.test(w));
      if (!allCapitalized) continue;

      const normCandidate = normalize(ngram);
      if (normCandidate === normTarget) continue; // exact match is fine
      if (normCandidate.length === 0) continue;

      // Use Levenshtein distance on normalized strings
      const dist = levenshteinDistance(normTarget, normCandidate);
      const maxLen = Math.max(normTarget.length, normCandidate.length);
      const threshold = maxLen <= 4 ? 1 : maxLen <= 7 ? 2 : 3;

      if (dist <= threshold && dist > 0) {
        matches.add(ngram);
      }
    }
  }
  return Array.from(matches);
}

/**
 * Generate expected date string representations from a canonical date.
 * Accepts YYYY-MM-DD, Date object, or MM/DD/YYYY.
 */
function buildDateRepresentations(dateInput) {
  if (!dateInput) return [];
  let d;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string') {
    d = new Date(dateInput + 'T00:00:00');
  } else {
    return [];
  }
  if (isNaN(d.getTime())) return [];

  const y = d.getFullYear();
  const m = d.getMonth(); // 0-based
  const day = d.getDate();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mon = months[m];

  return [
    `${mon} ${day}, ${y}`,
    `${mon} ${day} ${y}`,
    `${String(m + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${y}`,
    `${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`,
    `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    `${y}/${String(m + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
  ];
}

/**
 * Extract all date-like strings near birth-related keywords and compare with canonical representations.
 * Only flags dates within sentences containing "born", "birth", etc., to avoid false positives
 * from transit dates, historical references, and other non-birth dates.
 * Returns an array of dates found in text that do NOT match canonical.
 */
function findContradictoryDates(text, canonicalDateStr) {
  if (!text || !canonicalDateStr) return [];
  const reps = buildDateRepresentations(canonicalDateStr);
  if (reps.length === 0) return [];

  const contradictions = [];

  // Only scan sentences that contain birth-related keywords
  const birthContextRegex = /[^.!?]*\b(?:born|birth\s*(?:date|day|place)?)\b[^.!?]*[.!?]/gi;
  let sentence;
  while ((sentence = birthContextRegex.exec(text)) !== null) {
    const contextText = sentence[0];

    // Regex for common date formats within the birth-context sentence
    const dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi;

    let m;
    while ((m = dateRegex.exec(contextText)) !== null) {
      const found = m[0];
      const normFound = found.toLowerCase().replace(/\s+/g, ' ').trim();
      const isMatch = reps.some(r => r.toLowerCase().replace(/\s+/g, ' ').trim() === normFound);
      if (!isMatch) {
        contradictions.push(found);
      }
    }
  }

  return contradictions;
}

/**
 * Extract all time-like strings from text and compare with canonical time.
 */
function findContradictoryTimes(text, canonicalTimeStr) {
  if (!text || !canonicalTimeStr) return [];
  const contradictions = [];

  // Normalize canonical time to HH:MM (24h) for comparison
  let canonicalHour = null;
  let canonicalMinute = null;
  {
    const tMatch = String(canonicalTimeStr).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
    if (tMatch) {
      let h = parseInt(tMatch[1], 10);
      const min = parseInt(tMatch[2], 10);
      const period = tMatch[3]?.toLowerCase();
      if (period === 'pm' && h !== 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      canonicalHour = h;
      canonicalMinute = min;
    }
  }
  if (canonicalHour === null) return [];

  // Find time patterns in text
  const timeRegex = /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi;
  let m;
  while ((m = timeRegex.exec(text)) !== null) {
    const found = m[0];
    const fMatch = found.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
    if (fMatch) {
      let h = parseInt(fMatch[1], 10);
      const min = parseInt(fMatch[2], 10);
      const period = fMatch[3]?.toLowerCase();
      if (period === 'pm' && h !== 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      if (h !== canonicalHour || min !== canonicalMinute) {
        contradictions.push(found);
      }
    }
  }

  return contradictions;
}

/**
 * Extract transit mentions with nearby dates from text.
 * Returns array of { transitingBody, aspect, natalPoint, dates: string[] }
 */
function extractTransitMentions(text) {
  if (!text) return [];

  const mentions = [];
  // Match patterns like "transiting Jupiter conjuncts your natal Sun"
  const transitRegex = /(?:transiting\s+)?(Jupiter|Saturn|Uranus|Neptune|Pluto|Mars|Venus|Mercury)\s+(conjuncts?|squares?|trines?|opposes?|sextiles?)\s+your natal\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|North Node|South Node)/gi;

  let m;
  while ((m = transitRegex.exec(text)) !== null) {
    const transitingBody = m[1];
    const aspectVerb = m[2].toLowerCase();
    const natalPoint = m[3];

    // Normalize aspect to canonical form (e.g., conjuncts -> Conjunct)
    let aspect = aspectVerb.charAt(0).toUpperCase() + aspectVerb.slice(1);
    if (aspect.endsWith('s')) aspect = aspect.slice(0, -1);

    // Look for dates near this mention (within 120 chars before or after)
    const startPos = Math.max(0, m.index - 120);
    const endPos = Math.min(text.length, m.index + m[0].length + 120);
    const context = text.slice(startPos, endPos);

    const dates = [];
    const dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi;
    let dm;
    while ((dm = dateRegex.exec(context)) !== null) {
      dates.push(dm[0]);
    }

    mentions.push({ transitingBody, aspect, natalPoint, dates });
  }

  return mentions;
}

/**
 * Known zodiac signs for regex construction.
 */
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Map of planet names to their canonical keys in the planets object.
 */
const PLANET_KEY_MAP = {
  'sun': 'sun', 'Sun': 'sun',
  'moon': 'moon', 'Moon': 'moon',
  'mercury': 'mercury', 'Mercury': 'mercury',
  'venus': 'venus', 'Venus': 'venus',
  'mars': 'mars', 'Mars': 'mars',
  'jupiter': 'jupiter', 'Jupiter': 'jupiter',
  'saturn': 'saturn', 'Saturn': 'saturn',
  'uranus': 'uranus', 'Uranus': 'uranus',
  'neptune': 'neptune', 'Neptune': 'neptune',
  'pluto': 'pluto', 'Pluto': 'pluto',
  'north node': 'northNode', 'North Node': 'northNode', 'True Node': 'northNode', 'true node': 'northNode',
  'south node': 'southNode', 'South Node': 'southNode',
};

/**
 * Extract planetary placement mentions from text.
 * Looks for patterns like "Sun is in Gemini", "Moon in Virgo", etc.
 * Returns array of { planet, sign } objects.
 */
function extractPlanetaryPlacements(text) {
  if (!text) return [];
  const placements = [];
  const signsPattern = ZODIAC_SIGNS.join('|');

  // Match patterns like: "Sun is in Gemini", "Your Moon in Virgo", "Mercury in Cancer"
  const regex = new RegExp(
    '(?:your\\s+)?(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|North Node|South Node)\\s+(?:is\\s+)?(?:in\\s+)?(' + signsPattern + ')',
    'gi'
  );

  let m;
  while ((m = regex.exec(text)) !== null) {
    const planetName = m[1];
    const sign = m[2];
    const key = PLANET_KEY_MAP[planetName];
    if (key) {
      placements.push({ planet: planetName, key, sign });
    }
  }

  return placements;
}

/**
 * Find planetary placement mismatches between narrative text and canonical chart data.
 * Returns array of mismatch objects.
 */
function findPlanetaryPlacementMismatches(text, canonicalPlanets) {
  if (!text || !canonicalPlanets) return [];
  const mismatches = [];
  const mentions = extractPlanetaryPlacements(text);

  for (const mention of mentions) {
    const canonical = canonicalPlanets[mention.key];
    if (!canonical || !canonical.sign) continue;

    if (canonical.sign.toLowerCase() !== mention.sign.toLowerCase()) {
      mismatches.push({
        planet: mention.planet,
        canonicalSign: canonical.sign,
        foundSign: mention.sign,
      });
    }
  }

  return mismatches;
}

/**
 * Extract nodal axis mentions from text (karmic section).
 * Looks for patterns like "North Node is in Aries in the 1st House".
 * Returns array of { node, sign, house } objects.
 */
function extractNodalAxisMentions(text) {
  if (!text) return [];
  const mentions = [];
  const signsPattern = ZODIAC_SIGNS.join('|');

  // Match: "North Node is in Aries in the 1st House" or "South Node in Leo in the 5th House"
  const regex = new RegExp(
    '(North Node|South Node|True Node)\\s+(?:is\\s+)?(?:in\\s+)?(' + signsPattern + ')(?:\\s+in\\s+the\\s+(\\d+)(?:st|nd|rd|th)?\\s+House)?',
    'gi'
  );

  let m;
  while ((m = regex.exec(text)) !== null) {
    mentions.push({
      node: m[1],
      sign: m[2],
      house: m[3] ? parseInt(m[3], 10) : null,
    });
  }

  return mentions;
}

/**
 * Find nodal axis mismatches between karmic section text and canonical chart data.
 * Returns array of mismatch objects.
 */
function findNodalAxisMismatches(text, canonicalNodes) {
  if (!text || !canonicalNodes) return [];
  const mismatches = [];
  const mentions = extractNodalAxisMentions(text);

  for (const mention of mentions) {
    const key = (mention.node === 'North Node' || mention.node === 'True Node') ? 'northNode' : 'southNode';
    const canonical = canonicalNodes[key];
    if (!canonical || !canonical.sign) continue;

    if (canonical.sign.toLowerCase() !== mention.sign.toLowerCase()) {
      mismatches.push({
        node: mention.node,
        canonicalSign: canonical.sign,
        foundSign: mention.sign,
      });
    }

    if (mention.house !== null && canonical.house !== undefined && canonical.house !== null) {
      const canonicalHouse = typeof canonical.house === 'string' ? parseInt(canonical.house, 10) : canonical.house;
      if (canonicalHouse !== mention.house) {
        mismatches.push({
          node: mention.node,
          canonicalHouse,
          foundHouse: mention.house,
        });
      }
    }
  }

  return mismatches;
}

/**
 * Find contradictory transit dates ACROSS different forecast sections.
 * For the same transit (same planet/aspect combination), different sections
 * should not claim different exact dates. Returns array of contradiction objects.
 */
function findCrossSectionTransitDateContradictions(sections) {
  const forecastSectionTypes = ['transit', 'annual_forecast', 'extended_forecast'];
  const contradictions = [];

  // Collect all transit mentions from all forecast sections
  const sectionMentions = [];
  for (const section of sections) {
    if (!forecastSectionTypes.includes(section.type)) continue;
    const text = extractText(section.content);
    if (!text) continue;
    const mentions = extractTransitMentions(text);
    for (const mention of mentions) {
      sectionMentions.push({
        sectionType: section.type,
        ...mention,
      });
    }
  }

  // Group transit mentions by their identity (transitingBody + aspect + natalPoint)
  const transitGroups = {};
  for (const sm of sectionMentions) {
    const key = `${sm.transitingBody}|${sm.aspect}|${sm.natalPoint}`.toLowerCase();
    if (!transitGroups[key]) {
      transitGroups[key] = [];
    }
    transitGroups[key].push(sm);
  }

  // For each transit that appears in multiple sections, check for date contradictions
  for (const [key, mentions] of Object.entries(transitGroups)) {
    if (mentions.length < 2) continue;

    // Collect all unique dates per section
    const sectionDates = {};
    for (const mention of mentions) {
      for (const date of mention.dates) {
        const normDate = date.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!sectionDates[mention.sectionType]) {
          sectionDates[mention.sectionType] = [];
        }
        if (!sectionDates[mention.sectionType].includes(normDate)) {
          sectionDates[mention.sectionType].push(normDate);
        }
      }
    }

    // Check if different sections have different dates for the same transit
    const sectionTypes = Object.keys(sectionDates);
    if (sectionTypes.length < 2) continue;

    // Collect all unique date representations across sections
    const allDates = [];
    for (const [sectionType, dates] of Object.entries(sectionDates)) {
      for (const date of dates) {
        allDates.push({ date, sectionType });
      }
    }

    // If there's more than one unique date across sections, it's a contradiction
    const uniqueDates = [...new Set(allDates.map(d => d.date))];
    if (uniqueDates.length > 1) {
      const [transitingBody, aspect, natalPoint] = key.split('|');
      contradictions.push({
        transit: `${transitingBody.charAt(0).toUpperCase() + transitingBody.slice(1)} ${aspect.charAt(0).toUpperCase() + aspect.slice(1)} ${natalPoint.charAt(0).toUpperCase() + natalPoint.slice(1)}`,
        sections: sectionTypes,
        conflictingDates: uniqueDates,
      });
    }
  }

  return contradictions;
}

/**
 * Find contradictory transit dates between forecast sections and canonical data.
 * Returns array of contradiction objects.
 */
function findContradictoryTransitDates(sections, canonicalTransits) {
  if (!canonicalTransits || canonicalTransits.length === 0) return [];

  const contradictions = [];
  const forecastSectionTypes = ['transit', 'annual_forecast', 'extended_forecast'];

  for (const section of sections) {
    if (!forecastSectionTypes.includes(section.type)) continue;

    const text = extractText(section.content);
    const mentions = extractTransitMentions(text);

    for (const mention of mentions) {
      const canonical = canonicalTransits.find(ct =>
        ct.transitingBody?.toLowerCase() === mention.transitingBody.toLowerCase() &&
        ct.aspect?.toLowerCase() === mention.aspect.toLowerCase() &&
        ct.natalPoint?.toLowerCase() === mention.natalPoint.toLowerCase()
      );

      if (!canonical || !canonical.exactDate) continue;

      const canonicalReps = buildDateRepresentations(canonical.exactDate);

      for (const foundDate of mention.dates) {
        const normFound = foundDate.toLowerCase().replace(/\s+/g, ' ').trim();
        const isMatch = canonicalReps.some(r => r.toLowerCase().replace(/\s+/g, ' ').trim() === normFound);
        if (!isMatch) {
          contradictions.push({
            sectionType: section.type,
            transit: `${mention.transitingBody} ${mention.aspect} ${mention.natalPoint}`,
            canonicalDate: canonical.exactDate,
            foundDate,
          });
        }
      }
    }
  }

  return contradictions;
}

/**
 * Check if a location name appears in text in a contradictory way.
 * If the canonical location is present, we accept the text.
 * If absent, we look for explicit location references (e.g., "Born in ...")
 * and flag them as potential contradictions.
 */
function findContradictoryLocations(text, canonicalLocation) {
  if (!text || !canonicalLocation) return [];
  const canonLower = canonicalLocation.toLowerCase();
  const textLower = text.toLowerCase();
  if (textLower.includes(canonLower)) return [];

  const contradictions = [];
  // Look for explicit location references using birth-specific phrases.
  // Allow "born in", "born at", "located in", "from" — but NOT bare "in", "at", "near"
  // which produce too many false positives (e.g., "In Winter", "At midnight").
  // Case-insensitive for trigger words; locations must start with capital letter.
  const locationRegex = /\b(?:[Bb]orn\s+(?:in|at|near)\s+(?:the\s+)?|[Ll]ocated\s+in\s+(?:the\s+)?|[Ff]rom\s+(?:the\s+)?)([A-Z][a-zA-Z\-']{2,20}(?:\s+[A-Z][a-zA-Z\-']{2,20}){0,2})\b/g;
  let m;
  while ((m = locationRegex.exec(text)) !== null) {
    const candidate = m[1]; // the captured location phrase
    const normCandidate = normalize(candidate);
    if (normCandidate === normalize(canonicalLocation)) continue;
    // Heuristic: skip month names and weekdays
    const monthsAndDays = new Set([
      'january','february','march','april','may','june',
      'july','august','september','october','november','december',
      'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
      'sun','mon','tue','wed','thu','fri','sat'
    ]);
    if (monthsAndDays.has(normCandidate)) continue;
    contradictions.push(m[0]);
  }
  return contradictions;
}

/**
 * Validate a report's sections for cross-section consistency.
 *
 * @param {Object} params
 * @param {Array}  params.sections - Report sections (each has `type`, `title`, `content`)
 * @param {Object} [params.canonicalNames] - `{ userName?: string, partnerName?: string }`
 * @param {Object} [params.canonicalBirthData] - `{ birthDate?: string, birthTime?: string, location?: string, partnerBirthDate?: string, partnerBirthTime?: string, partnerLocation?: string }`
 * @param {Array}  [params.canonicalTransits] - Array of `{ transitingBody, aspect, natalPoint, exactDate }`
 * @param {Object} [params.canonicalPlanets] - Canonical planet placements `{ sun: { sign: 'Gemini' }, moon: { sign: 'Virgo' }, ... }`
 * @param {Object} [params.canonicalNodes] - Canonical nodal axis `{ northNode: { sign: 'Aquarius', house: 11 }, southNode: { sign: 'Leo', house: 5 } }`
 * @param {Object} [params.options] - `{ strict?: boolean, allowDuplicateTypes?: string[] }`
 *
 * @returns {Object} `{ valid: boolean, errors: string[], warnings: string[], details: Object }`
 */
function validateReportConsistency({ sections, canonicalNames = {}, canonicalBirthData = {}, canonicalTransits = [], canonicalPlanets = {}, canonicalNodes = {}, options = {} }) {
  const errors = [];
  const warnings = [];
  const details = {
    duplicateSections: [],
    nameInconsistencies: [],
    birthDataInconsistencies: [],
    transitDateInconsistencies: [],
    planetaryPlacementInconsistencies: [],
    nodalAxisInconsistencies: [],
  };

  const { strict = false, allowDuplicateTypes = [] } = options;

  if (!Array.isArray(sections)) {
    const msg = 'Sections must be an array';
    errors.push(msg);
    return { valid: false, errors, warnings, details };
  }

  // ---------------------------------------------------------------------------
  // 1. Duplicate section types
  // ---------------------------------------------------------------------------
  const typeCounts = {};
  for (const section of sections) {
    const t = section?.type || 'unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > 1 && !allowDuplicateTypes.includes(type)) {
      const msg = `Duplicate section type "${type}" found ${count} times`;
      errors.push(msg);
      details.duplicateSections.push(type);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Name spelling consistency
  // ---------------------------------------------------------------------------
  const namesToCheck = [];
  if (canonicalNames.userName) {
    namesToCheck.push({ role: 'user', name: canonicalNames.userName });
  }
  if (canonicalNames.partnerName) {
    namesToCheck.push({ role: 'partner', name: canonicalNames.partnerName });
  }

  for (const section of sections) {
    const text = extractText(section.content);
    if (!text) continue;
    const sectionType = section.type || 'unknown';

    for (const { role, name } of namesToCheck) {
      const exactRegex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const hasExact = exactRegex.test(text);
      const approxMatches = findApproximateNameMatches(text, name);

      if (!hasExact && approxMatches.length > 0) {
        const msg = `Section "${sectionType}" contains approximate name match(es) for ${role} "${name}": "${approxMatches.join(', ')}"`;
        if (strict) {
          errors.push(msg);
        } else {
          warnings.push(msg);
        }
        details.nameInconsistencies.push({
          sectionType,
          role,
          canonicalName: name,
          foundMatches: approxMatches,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Birth data consistency
  // ---------------------------------------------------------------------------
  const birthDataFields = [
    { key: 'birthDate', label: 'birth date', partner: false },
    { key: 'birthTime', label: 'birth time', partner: false },
    { key: 'location', label: 'location', partner: false },
    { key: 'partnerBirthDate', label: 'partner birth date', partner: true },
    { key: 'partnerBirthTime', label: 'partner birth time', partner: true },
    { key: 'partnerLocation', label: 'partner location', partner: true },
  ];

  for (const section of sections) {
    const text = extractText(section.content);
    if (!text) continue;
    const sectionType = section.type || 'unknown';

    for (const { key, label, partner } of birthDataFields) {
      const canonicalValue = canonicalBirthData[key];
      if (!canonicalValue) continue;

      let contradictions = [];
      if (label.includes('date')) {
        contradictions = findContradictoryDates(text, canonicalValue);
      } else if (label.includes('time')) {
        contradictions = findContradictoryTimes(text, canonicalValue);
      } else if (label.includes('location')) {
        contradictions = findContradictoryLocations(text, canonicalValue);
      }

      if (contradictions.length > 0) {
        const msg = `Section "${sectionType}" may contain contradictory ${label} data (canonical: "${canonicalValue}", found: "${contradictions.join(', ')}")`;
        if (strict) {
          errors.push(msg);
        } else {
          warnings.push(msg);
        }
        details.birthDataInconsistencies.push({
          sectionType,
          field: key,
          canonicalValue,
          foundValues: contradictions,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Transit date consistency across forecast sections
  // ---------------------------------------------------------------------------
  if (canonicalTransits && canonicalTransits.length > 0) {
    const transitDateContradictions = findContradictoryTransitDates(sections, canonicalTransits);
    for (const contradiction of transitDateContradictions) {
      const msg = `Section "${contradiction.sectionType}" contains contradictory transit date for ${contradiction.transit} (canonical: "${contradiction.canonicalDate}", found: "${contradiction.foundDate}")`;
      // Transit narrative often uses approximate dates (e.g., "around December 15")
      // that differ from the exact ephemeris date. Default to warning; strict mode
      // turns these into errors.
      if (strict) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
      details.transitDateInconsistencies.push(contradiction);
    }
  }

  // ---------------------------------------------------------------------------
  // 4b. Cross-section transit date contradictions
  //     (Same transit mentioned with different dates in different sections)
  // ---------------------------------------------------------------------------
  const crossSectionContradictions = findCrossSectionTransitDateContradictions(sections);
  for (const contradiction of crossSectionContradictions) {
    const msg = `Section "${contradiction.sections.join('" and "')}" contains contradictory transit date for ${contradiction.transit} (${contradiction.conflictingDates.map((d, i) => `"${d}" in ${contradiction.sections[i] || contradiction.sections[0]}`).join(' vs ')})`;
    // Cross-section date contradictions are always errors — the same transit
    // cannot occur on two different dates.
    errors.push(msg);
    details.transitDateInconsistencies.push(contradiction);
  }

  // ---------------------------------------------------------------------------
  // 5. Planetary placement consistency in narrative vs chart wheel
  // ---------------------------------------------------------------------------
  if (canonicalPlanets && Object.keys(canonicalPlanets).length > 0) {
    for (const section of sections) {
      const text = extractText(section.content);
      if (!text) continue;
      const sectionType = section.type || 'unknown';

      const placementMismatches = findPlanetaryPlacementMismatches(text, canonicalPlanets);
      for (const mismatch of placementMismatches) {
        const msg = `Section "${sectionType}" contains planetary placement mismatch for ${mismatch.planet} (canonical: "${mismatch.canonicalSign}", found: "${mismatch.foundSign}")`;
        // Planetary placement mismatches are always errors because they represent
        // factual contradictions between narrative text and chart wheel data.
        errors.push(msg);
        details.planetaryPlacementInconsistencies.push({
          sectionType,
          ...mismatch,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Karmic Nodal Axis alignment with birth chart
  // ---------------------------------------------------------------------------
  if (canonicalNodes && Object.keys(canonicalNodes).length > 0) {
    for (const section of sections) {
      if (section.type !== 'karmic' && section.type !== 'karmic_reading' && section.type !== 'shadow_work') continue;
      const text = extractText(section.content);
      if (!text) continue;

      const nodalMismatches = findNodalAxisMismatches(text, canonicalNodes);
      for (const mismatch of nodalMismatches) {
        let msg;
        if (mismatch.foundSign) {
          msg = `Section "${section.type}" contains nodal axis mismatch for ${mismatch.node} (canonical sign: "${mismatch.canonicalSign}", found: "${mismatch.foundSign}")`;
        } else {
          msg = `Section "${section.type}" contains nodal axis mismatch for ${mismatch.node} (canonical house: "${mismatch.canonicalHouse}", found: "${mismatch.foundHouse}")`;
        }
        // Nodal axis mismatches are always errors because they represent
        // factual contradictions between karmic text and birth chart data.
        errors.push(msg);
        details.nodalAxisInconsistencies.push({
          sectionType: section.type,
          ...mismatch,
        });
      }
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings, details };
}

module.exports = {
  validateReportConsistency,
  levenshteinDistance,
  buildDateRepresentations,
  extractText,
};
