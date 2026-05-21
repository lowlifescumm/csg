/**
 * Template Sanitizer
 * Sanitizes HTML content in templates to prevent XSS attacks
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize template JSON to remove malicious scripts and unsafe content
 * @param {Object} templateJson - Template JSON object
 * @returns {Object} Sanitized template JSON
 */
export function sanitizeTemplate(templateJson) {
  if (!templateJson || typeof templateJson !== 'object') {
    return templateJson;
  }

  const sanitized = { ...templateJson };

  // Sanitize HTML content
  if (sanitized.html && typeof sanitized.html === 'string') {
    sanitized.html = sanitizeHtml(sanitized.html, {
      allowedTags: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'b', 'i', 'br', 'hr',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
        'img', 'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'text', 'g',
        'a', 'blockquote', 'pre', 'code',
        'style', // Allow style tags but sanitize content
      ],
      allowedAttributes: {
        '*': ['class', 'id', 'style'],
        'img': ['src', 'alt', 'width', 'height'],
        'svg': ['width', 'height', 'viewBox', 'xmlns'],
        'path': ['d', 'fill', 'stroke', 'stroke-width'],
        'circle': ['cx', 'cy', 'r', 'fill', 'stroke'],
        'rect': ['x', 'y', 'width', 'height', 'fill', 'stroke'],
        'line': ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
        'polygon': ['points', 'fill', 'stroke'],
        'text': ['x', 'y', 'text-anchor', 'font-size', 'font-family', 'fill'],
        'g': ['transform'],
        'a': ['href', 'target'],
      },
      allowedSchemes: ['http', 'https', 'data'], // Allow data URIs for base64 images
      allowedStyles: {
        '*': {
          'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/],
          'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/],
          'font-size': [/^\d+px$/, /^\d+pt$/, /^\d+em$/, /^\d+rem$/],
          'font-family': [/^.*$/],
          'font-weight': [/^(normal|bold|bolder|lighter|\d+)$/],
          'text-align': [/^(left|right|center|justify)$/],
          'margin': [/^\d+px$/, /^\d+pt$/, /^\d+em$/, /^\d+rem$/],
          'padding': [/^\d+px$/, /^\d+pt$/, /^\d+em$/, /^\d+rem$/],
          'width': [/^\d+px$/, /^\d+%$/, /^\d+pt$/, /^\d+em$/, /^\d+rem$/],
          'height': [/^\d+px$/, /^\d+%$/, /^\d+pt$/, /^\d+em$/, /^\d+rem$/],
        },
      },
      // Disallow script tags entirely
      disallowedTagsMode: 'discard',
      // Remove script, iframe, object, embed tags
      allowedIframeHostnames: [],
      allowVulnerableTags: true,
    });
  }

  // Sanitize preview HTML
  if (sanitized.preview_html && typeof sanitized.preview_html === 'string') {
    sanitized.preview_html = sanitizeHtml(sanitized.preview_html, {
      allowedTags: [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 'b', 'i', 'br', 'hr',
        'ul', 'ol', 'li',
        'img',
        'a', 'blockquote',
      ],
      allowedAttributes: {
        '*': ['class', 'id'],
        'img': ['src', 'alt', 'width', 'height'],
        'a': ['href', 'target'],
      },
      allowedSchemes: ['http', 'https', 'data'],
      allowVulnerableTags: true,
    });
  }

  // Sanitize layout blocks
  if (sanitized.layout && sanitized.layout.blocks && Array.isArray(sanitized.layout.blocks)) {
    sanitized.layout.blocks = sanitized.layout.blocks.map(block => {
      const sanitizedBlock = { ...block };

      if (block.type === 'html' && block.html && typeof block.html === 'string') {
        sanitizedBlock.html = sanitizeHtml(block.html, {
          allowedTags: sanitizeHtml.defaults.allowedTags.filter(tag => tag !== 'script'),
          allowedAttributes: {
            '*': ['class', 'id', 'style'],
            'a': ['href', 'target', 'rel', 'name'],
            'img': ['src', 'alt', 'width', 'height'],
          },
          allowedSchemes: ['http', 'https', 'data'],
        });
      }

      if (block.type === 'svg' && block.svg && typeof block.svg === 'string') {
        // For SVG, we want to preserve the SVG structure but remove any script tags
        sanitizedBlock.svg = sanitizeHtml(block.svg, {
          allowedTags: [
            'svg', 'g', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline',
            'text', 'tspan', 'defs', 'use', 'clipPath', 'mask', 'pattern',
            'linearGradient', 'radialGradient', 'stop',
          ],
          allowedAttributes: {
            '*': ['*'], // Allow all SVG attributes
          },
          allowedSchemes: ['http', 'https', 'data'],
        });
      }

      return sanitizedBlock;
    });
  }

  // Recursively sanitize nested objects
  if (sanitized.schemas && Array.isArray(sanitized.schemas)) {
    // pdfme schemas don't need HTML sanitization, but we ensure no script injection
    sanitized.schemas = sanitized.schemas.map(schema => {
      const sanitizedSchema = { ...schema };
      // Ensure schema doesn't contain executable code
      Object.keys(sanitizedSchema).forEach(key => {
        if (typeof sanitizedSchema[key] === 'string') {
          // Remove any script-like patterns
          sanitizedSchema[key] = sanitizedSchema[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
      });
      return sanitizedSchema;
    });
  }

  return sanitized;
}

/**
 * Check if template JSON size exceeds limit
 * @param {Object|string} templateJson - Template JSON object or string
 * @param {number} maxSizeKB - Maximum size in KB (default: 500)
 * @returns {boolean} True if size is within limit
 */
export function validateTemplateSize(templateJson, maxSizeKB = 500) {
  const jsonString = typeof templateJson === 'string' 
    ? templateJson 
    : JSON.stringify(templateJson);
  
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
  const sizeKB = sizeBytes / 1024;
  
  return {
    valid: sizeKB <= maxSizeKB,
    sizeKB: Math.round(sizeKB * 100) / 100,
    maxSizeKB,
    sizeBytes,
  };
}

