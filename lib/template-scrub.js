/**
 * Template Artifact Scrubber
 * Strips unrendered template syntax, auto-generation scaffolding,
 * and no-data fallback text from markdown content before PDF assembly.
 */

const NO_DATA_PATTERNS = [
  /no\s+(future\s+)?transits?\s+(were\s+)?(provided|calculated|available|scheduled|forthcoming|found)[\.!?]?/gi,
  /no\s+(data|information|content|results?|aspects?|transits?)(?:\s+(?:was|were))?\s+(provided|available|found)[\.!?]?/gi,
  /no\s+\w+\s+data(?:\s+(?:was|were))?\s+(provided|available|found)[\.!?]?/gi,
  /no\s+\w+\s+were\s+provided[\.!?]?/gi,
  /no\s+\w+\s+(aspects?|transits?)\s+provided[\.!?]?/gi,
  /no\s+specific\s+transits?\s+provided[\.!?]?/gi,
  /given\s+the\s+lack\s+of\s+specific\s+transits?[^.]*\.?/gi,
  /not\s+available[\.!?]?/gi,
  /this\s+(is\s+)?(a\s+)?placeholder[\.!?]?/i,
];

const TEMPLATE_SYNTAX_PATTERNS = [
  /\{\{\{?\s*[#/]?\w+(?:\.\w+)*(?:\s*\|\s*\w+)?\s*\}?\}\}/g,
  /\{\%\s*(?:block|for|if|unless|each|with|set|assign)\s+.*?\%\}/gi,
  /\{\%\s*end\w+\s*\%\}/gi,
  /\{\#[^#]*\#\}/g,
];

const SCAFFOLDING_PATTERNS = [
  /\[auto-generated\](?:.*?)(?:\n|$)/gi,
  /this\s+(content|section|report)\s+was\s+(auto-)?generated\s+(by\s+)?(AI|an?\s+AI)[\.!?]?/gi,
  /generated\s+(by|using)\s+(AI|OpenAI|GPT|artificial\s+intelligence)[\.!?]?/gi,
  /\[insert\s+(content|text|data|details)\s+here\]/gi,
  /TODO:\s*/gi,
];

export function scrubTemplateArtifacts(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  result = removeNoDataFallbacks(result);
  result = removeTemplateSyntax(result);
  result = removeScaffolding(result);
  result = cleanWhitespace(result);

  return result;
}

function removeNoDataFallbacks(text) {
  let result = text;
  for (const pattern of NO_DATA_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

function removeTemplateSyntax(text) {
  let result = text;

  for (const pattern of TEMPLATE_SYNTAX_PATTERNS) {
    result = result.replace(pattern, '');
  }

  result = result.replace(/^\s*---\s*$/gm, '');

  return result;
}

function removeScaffolding(text) {
  let result = text;
  for (const pattern of SCAFFOLDING_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result;
}

function cleanWhitespace(text) {
  let result = text;
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/  +/g, ' ');
  result = result.replace(/\. \./g, '.');
  result = result.replace(/^\s+/, '');
  result = result.trim();
  return result;
}
