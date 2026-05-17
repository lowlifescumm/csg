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
 * Extract all date-like strings from text and compare with canonical representations.
 * Returns an array of dates found in text that do NOT match canonical.
 */
function findContradictoryDates(text, canonicalDateStr) {
  if (!text || !canonicalDateStr) return [];
  const reps = buildDateRepresentations(canonicalDateStr);
  if (reps.length === 0) return [];

  const contradictions = [];

  // Regex for common date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, Month DD, YYYY, etc.
  const dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi;

  let m;
  while ((m = dateRegex.exec(text)) !== null) {
    const found = m[0];
    const normFound = found.toLowerCase().replace(/\s+/g, ' ').trim();
    const isMatch = reps.some(r => r.toLowerCase().replace(/\s+/g, ' ').trim() === normFound);
    if (!isMatch) {
      contradictions.push(found);
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
  // Look for explicit location references using prepositions
  const locationRegex = /\b(?:born|located|from|in|at|near)\s+(?:the\s+)?([A-Z][a-zA-Z\-']{2,20}(?:\s+[A-Z][a-zA-Z\-']{2,20}){0,2})\b/g;
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
 * @param {Object} [params.options] - `{ strict?: boolean, allowDuplicateTypes?: string[] }`
 *
 * @returns {Object} `{ valid: boolean, errors: string[], warnings: string[], details: Object }`
 */
function validateReportConsistency({ sections, canonicalNames = {}, canonicalBirthData = {}, options = {} }) {
  const errors = [];
  const warnings = [];
  const details = {
    duplicateSections: [],
    nameInconsistencies: [],
    birthDataInconsistencies: [],
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

  const valid = errors.length === 0;
  return { valid, errors, warnings, details };
}

module.exports = {
  validateReportConsistency,
  levenshteinDistance,
  buildDateRepresentations,
  extractText,
};
