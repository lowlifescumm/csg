const logger = require('./logger');

const DEFAULTS = {
  minLength: 60,
  nearThreshold: 0.80,
  ngramSize: 3,
  maxLengthRatio: 1.5,
};

/**
 * Extract raw text from a section object regardless of content shape.
 */
function getSectionText(section) {
  if (!section) return '';
  if (typeof section.content === 'string') return section.content;
  if (section.content && typeof section.content.content === 'string') {
    return section.content.content;
  }
  if (section.content && typeof section.content === 'object') {
    return section.content.html || '';
  }
  return '';
}

/**
 * Normalize a paragraph for comparison: lowercase, strip markdown/html, collapse whitespace.
 */
function normalizeParagraph(text) {
  return text
    .toLowerCase()
    // HTML tags first, before we strip the > character in markdown cleanup
    .replace(/<[^>]+>/g, ' ')
    // Markdown formatting characters
    .replace(/[#*`_~\[\]\(\)|>-]/g, ' ')
    // URLs – replace with token so identical links don't bias similarity
    .replace(/https?:\/\/\S+/g, ' url ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into paragraphs (blank-line delimited) and filter out very short blocks.
 */
function extractParagraphs(text, minLength = DEFAULTS.minLength) {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= minLength);
}

/**
 * Build a set of character n-grams from text.
 */
function getCharacterNgrams(text, n = DEFAULTS.ngramSize) {
  const ngrams = new Set();
  const chars = text.replace(/\s/g, '');
  if (chars.length < n) {
    if (chars.length > 0) ngrams.add(chars);
    return ngrams;
  }
  for (let i = 0; i <= chars.length - n; i++) {
    ngrams.add(chars.substring(i, i + n));
  }
  return ngrams;
}

/**
 * Jaccard similarity between two Sets.
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/**
 * Compute similarity between two paragraphs (0..1).
 * Returns 1.0 for exact normalized matches.
 */
function computeSimilarity(a, b) {
  const normA = normalizeParagraph(a);
  const normB = normalizeParagraph(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const ngramsA = getCharacterNgrams(normA);
  const ngramsB = getCharacterNgrams(normB);
  return jaccardSimilarity(ngramsA, ngramsB);
}

/**
 * Determine whether two paragraphs are near-duplicates safe to remove.
 * We require similarity >= threshold AND length ratio <= maxLengthRatio
 * so we don't discard paragraphs that merely share an opening sentence
 * but contain substantial new content.
 */
function isNearDuplicate(a, b, threshold = DEFAULTS.nearThreshold, maxLengthRatio = DEFAULTS.maxLengthRatio) {
  const similarity = computeSimilarity(a, b);
  if (similarity >= 1.0) return { duplicate: true, similarity: 1.0 };
  if (similarity < threshold) return { duplicate: false, similarity };

  const lenA = normalizeParagraph(a).length;
  const lenB = normalizeParagraph(b).length;
  const ratio = Math.max(lenA, lenB) / Math.min(lenA, lenB);
  if (ratio > maxLengthRatio) return { duplicate: false, similarity };

  return { duplicate: true, similarity };
}

/**
 * Audit sections for duplicate and near-duplicate paragraphs.
 * Returns an array of findings without mutating the input.
 */
function auditSections(sections, options = {}) {
  const minLength = options.minLength ?? DEFAULTS.minLength;
  const nearThreshold = options.nearThreshold ?? DEFAULTS.nearThreshold;
  const maxLengthRatio = options.maxLengthRatio ?? DEFAULTS.maxLengthRatio;

  const findings = [];
  const seen = []; // { original, sectionIndex }

  sections.forEach((section, sectionIndex) => {
    const text = getSectionText(section);
    const paragraphs = extractParagraphs(text, minLength);

    paragraphs.forEach((paragraph) => {
      if (normalizeParagraph(paragraph).length < minLength) return;

      for (const seenItem of seen) {
        const { duplicate, similarity } = isNearDuplicate(paragraph, seenItem.original, nearThreshold, maxLengthRatio);
        if (duplicate) {
          findings.push({
            type: similarity >= 1.0 ? 'exact_duplicate' : 'near_duplicate',
            similarity: Math.round(similarity * 100) / 100,
            sourceSectionIndex: seenItem.sectionIndex,
            sourceSectionTitle: sections[seenItem.sectionIndex]?.title || `Section ${seenItem.sectionIndex + 1}`,
            targetSectionIndex: sectionIndex,
            targetSectionTitle: section.title || `Section ${sectionIndex + 1}`,
            preview: paragraph.substring(0, 120).trim() + (paragraph.length > 120 ? '...' : ''),
          });
          break;
        }
      }

      seen.push({ original: paragraph, sectionIndex });
    });
  });

  return findings;
}

/**
 * Deduplicate sections by removing duplicate and near-duplicate paragraphs.
 * First occurrence is kept.  Returns a new array; input is not mutated.
 *
 * Options:
 *   - minLength: minimum paragraph length to consider (default 60)
 *   - nearThreshold: Jaccard threshold for near-duplicates (default 0.82)
 *   - maxLengthRatio: max length ratio to avoid removing paragraphs that
 *                     merely start similarly (default 1.5)
 *   - skipTypes: array of section types to skip (e.g. ['closing'])
 */
function deduplicateSections(sections, options = {}) {
  const minLength = options.minLength ?? DEFAULTS.minLength;
  const nearThreshold = options.nearThreshold ?? DEFAULTS.nearThreshold;
  const maxLengthRatio = options.maxLengthRatio ?? DEFAULTS.maxLengthRatio;
  const skipTypes = new Set(options.skipTypes || []);

  const seen = [];
  const cleanedSections = [];
  let totalRemoved = 0;

  sections.forEach((section, sectionIndex) => {
    if (skipTypes.has(section.type)) {
      cleanedSections.push(section);
      return;
    }

    const text = getSectionText(section);
    if (!text) {
      cleanedSections.push(section);
      return;
    }

    // Split on blank-line boundaries; each block may contain internal single newlines.
    const blocks = text.split(/\n\s*\n/);
    const keptBlocks = [];

    for (const block of blocks) {
      const trimmed = block.trim();
      if (trimmed.length === 0) continue;

      if (trimmed.length < minLength) {
        keptBlocks.push(block);
        continue;
      }

      let isDuplicate = false;
      for (const seenItem of seen) {
        const { duplicate, similarity } = isNearDuplicate(trimmed, seenItem.original, nearThreshold, maxLengthRatio);
        if (duplicate) {
          isDuplicate = true;
          totalRemoved++;
          logger.info(
            `[ParagraphAudit] Removed ${similarity >= 1.0 ? 'exact' : 'near'}-duplicate from ` +
              `"${section.title || section.type || `Section ${sectionIndex + 1}`}" ` +
              `(similarity ${similarity.toFixed(2)}): "${trimmed.substring(0, 80)}..."`
          );
          break;
        }
      }

      if (!isDuplicate) {
        seen.push({ normalized: normalizeParagraph(trimmed), original: trimmed });
        keptBlocks.push(block);
      }
    }

    const cleanedText = keptBlocks.join('\n\n');

    cleanedSections.push({
      ...section,
      content:
        typeof section.content === 'string'
          ? cleanedText
          : { ...section.content, content: cleanedText },
    });
  });

  if (totalRemoved > 0) {
    logger.info(
      `[ParagraphAudit] Total paragraphs removed: ${totalRemoved} across ${sections.length} sections`
    );
  }

  return cleanedSections;
}

module.exports = {
  auditSections,
  deduplicateSections,
  getSectionText,
  normalizeParagraph,
  extractParagraphs,
  computeSimilarity,
  getCharacterNgrams,
  jaccardSimilarity,
  isNearDuplicate,
};
