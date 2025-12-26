/**
 * PDF Template Renderer using pdfme
 * Generates PDFs from WYSIWYG templates stored in the database
 * 
 * This module provides an alternative to the Puppeteer pipeline for PDF generation.
 * Templates are created using the pdfme Designer (https://pdfme.com/designer) and
 * exported as JSON, then stored in the pdf_templates table.
 */

import { pool } from './db.js';
import Mustache from 'mustache';
import { getCachedHtml, setCachedHtml } from './template-cache.js';
import { sanitizeTemplate } from './template-sanitizer.js';

/**
 * Get a template from the database
 * Supports both the new report_templates table (UUID) and legacy pdf_templates table
 * @param {string|number} templateId - Template ID (UUID string or numeric ID) or slug
 * @param {string} reportType - Optional report type filter (for legacy pdf_templates)
 * @returns {Promise<Object|null>} Template object with template_json
 */
export async function getTemplate(templateId, reportType = null) {
  const client = await pool.connect();
  try {
    // Try new report_templates table first (UUID-based)
    // UUIDs are typically 36 characters with hyphens
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(templateId));
    
    if (isUUID) {
      const result = await client.query(
        'SELECT * FROM report_templates WHERE id = $1',
        [templateId]
      );
      if (result.rows[0]) {
        return result.rows[0];
      }
    }
    
    // Fallback to legacy pdf_templates table (numeric ID or slug)
    const isNumeric = !isNaN(parseInt(templateId));
    const query = isNumeric
      ? 'SELECT * FROM pdf_templates WHERE id = $1 AND is_active = true'
      : 'SELECT * FROM pdf_templates WHERE slug = $1 AND is_active = true';
    
    const params = [templateId];
    
    // Add report_type filter if provided (legacy table only)
    if (reportType) {
      const reportTypeQuery = isNumeric
        ? 'SELECT * FROM pdf_templates WHERE id = $1 AND report_type = $2 AND is_active = true'
        : 'SELECT * FROM pdf_templates WHERE slug = $1 AND report_type = $2 AND is_active = true';
      params.push(reportType);
      const result = await client.query(reportTypeQuery, params);
      return result.rows[0] || null;
    }
    
    const result = await client.query(query, params);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Get the default template for a report type
 * Checks both report_templates (new) and pdf_templates (legacy) tables
 * @param {string} reportType - Report type (ESSENTIAL, ADVANCED, MASTER, etc.)
 * @returns {Promise<Object|null>} Default template object
 */
export async function getDefaultTemplate(reportType) {
  const client = await pool.connect();
  try {
    // First, try to get a default template from legacy pdf_templates table
    const legacyResult = await client.query(
      'SELECT * FROM pdf_templates WHERE report_type = $1 AND is_default = true AND is_active = true LIMIT 1',
      [reportType]
    );
    if (legacyResult.rows[0]) {
      return legacyResult.rows[0];
    }
    
    // If no default in legacy table, try to get any template for this report type from new report_templates table
    const newResult = await client.query(
      'SELECT * FROM report_templates WHERE report_type = $1 ORDER BY created_at DESC LIMIT 1',
      [reportType]
    );
    if (newResult.rows[0]) {
      return newResult.rows[0];
    }
    
    // If still no template, try legacy table without is_default requirement
    const fallbackResult = await client.query(
      'SELECT * FROM pdf_templates WHERE report_type = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [reportType]
    );
    return fallbackResult.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Flatten nested report data into a flat key-value map for pdfme field substitution
 * pdfme templates use field names like "{{userName}}" or "{{partnerSunSign}}"
 * 
 * @param {Object} reportData - The full report data object
 * @returns {Object} Flattened key-value pairs for template fields
 */
export function flattenReportData(reportData) {
  const flattened = {};
  
  // Helper to recursively flatten nested objects
  function flatten(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (Array.isArray(value)) {
        // Handle arrays - convert to comma-separated string or handle each item
        if (value.length > 0 && typeof value[0] === 'object') {
          // Array of objects - convert to JSON or formatted string
          flattened[newKey] = JSON.stringify(value);
        } else {
          flattened[newKey] = value.join(', ');
        }
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        // Recursively flatten nested objects
        flatten(value, newKey);
      } else if (value instanceof Date) {
        flattened[newKey] = value.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } else {
        flattened[newKey] = String(value);
      }
    }
  }
  
  flatten(reportData);
  
  // Add common aliases for convenience
  if (reportData.name) {
    flattened.userName = reportData.name;
    flattened.name = reportData.name;
  }
  
  // Extract user chart data
  if (reportData.user || reportData.natalChart) {
    const userChart = reportData.user || reportData.natalChart;
    if (userChart.sun?.sign) flattened.userSunSign = userChart.sun.sign;
    if (userChart.moon?.sign) flattened.userMoonSign = userChart.moon.sign;
    if (userChart.rising?.sign) flattened.userRisingSign = userChart.rising.sign;
    if (userChart.ascendant?.sign) flattened.userRisingSign = userChart.ascendant.sign;
  }
  
  // Extract partner chart data
  if (reportData.partner) {
    const partnerChart = reportData.partner;
    if (partnerChart.sun?.sign) flattened.partnerSunSign = partnerChart.sun.sign;
    if (partnerChart.moon?.sign) flattened.partnerMoonSign = partnerChart.moon.sign;
    if (partnerChart.rising?.sign) flattened.partnerRisingSign = partnerChart.rising.sign;
    if (partnerChart.name) flattened.partnerName = partnerChart.name;
  }
  
  // Extract compatibility scores
  if (reportData.matrix_scores) {
    const scores = reportData.matrix_scores;
    flattened.emotionalScore = scores.emotional || 0;
    flattened.communicationScore = scores.communication || 0;
    flattened.spiritualScore = scores.spiritual || 0;
    flattened.stabilityScore = scores.stability || 0;
    flattened.physicalScore = scores.physical || 0;
    flattened.compatibilityScore = reportData.compatibility_score || 0;
  }
  
  // Extract report sections content
  // Map section types to template variable names
  const sectionTypeToVariable = {
    'birth_chart': {
      content: 'coreIdentity', // Birth Chart Analysis content
    },
    'compatibility': {
      emotional: 'compatibilityEmotional',
      communication: 'compatibilityCommunication',
      friction: 'compatibilityFriction',
      longTerm: 'compatibilityLongTerm',
      harmony: 'compatibilityHarmony',
      // If compatibility content is a single string, use compatibilityHarmony as default
      content: 'compatibilityHarmony',
    },
    'transit': {
      overview: 'transitOverview',
      weekByWeek: 'transitWeekByWeek',
      content: 'transitOverview', // Default to overview if not split
    },
    'matrix': {
      content: 'matrixAnalysisText',
    },
    'karmic': {
      nodes: 'karmicNodes',
      lesson: 'karmicLesson',
      exercises: 'karmicExercises',
      content: 'karmicLesson', // Default if not split
    },
    'closing': {
      content: 'closingBlessing',
    },
  };

  if (reportData.sections && Array.isArray(reportData.sections)) {
    reportData.sections.forEach((section, index) => {
      const sectionKey = `section${index + 1}Title`;
      const contentKey = `section${index + 1}Content`;
      flattened[sectionKey] = section.title || section.type || `Section ${index + 1}`;
      
      const sectionContent = section.content?.content || section.content || '';
      
      // Map section content to template variable names
      const sectionType = section.type?.toLowerCase();
      const mapping = sectionTypeToVariable[sectionType];
      
      if (mapping && sectionContent) {
        // If mapping has specific keys, try to extract them from content
        // Otherwise, use the default 'content' key
        if (mapping.content && !mapping.emotional && !mapping.nodes) {
          // Simple content mapping
          flattened[mapping.content] = sectionContent;
        } else {
          // Complex content that might need splitting (for now, just use default)
          flattened[mapping.content || `section${index + 1}Content`] = sectionContent;
        }
      } else {
        // No specific mapping, use generic key
        flattened[contentKey] = sectionContent;
      }
      
      // Preserve SVG strings from sections (e.g., matrixChartSVG, chartSvg)
      if (section.matrixChartSVG) {
        // Ensure SVG has xmlns attribute for proper rendering
        let svgContent = section.matrixChartSVG;
        if (typeof svgContent === 'string' && !svgContent.includes('xmlns=')) {
          svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        flattened.matrixChartSVG = svgContent;
      }
      if (section.chartSvg) {
        let svgContent = section.chartSvg;
        if (typeof svgContent === 'string' && !svgContent.includes('xmlns=')) {
          svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        flattened.chartSvg = svgContent;
      }
      if (section.chartSVG) {
        let svgContent = section.chartSVG;
        if (typeof svgContent === 'string' && !svgContent.includes('xmlns=')) {
          svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        flattened.chartSVG = svgContent;
      }
      
      // Also check for chartImage (data URL) and convert to SVG if possible
      if (section.chartImage && !flattened.chartSvg && !flattened.chartSVG) {
        // If we have a chart image but no SVG, try to extract from data URL
        if (section.chartImage.startsWith('data:image/svg+xml')) {
          const base64Match = section.chartImage.match(/base64,(.+)/);
          if (base64Match) {
            try {
              const svgString = Buffer.from(base64Match[1], 'base64').toString('utf-8');
              let svgContent = svgString;
              if (!svgContent.includes('xmlns=')) {
                svgContent = svgContent.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
              }
              flattened.chartSvg = svgContent;
              flattened.chartSVG = svgContent;
            } catch (e) {
              console.warn('[Template Renderer] Could not decode chart SVG from data URL');
            }
          }
        }
      }
    });
    
    // For Master reports, try to extract specific section contents based on title patterns
    // This helps with templates that expect specific variable names
    reportData.sections.forEach((section) => {
      const title = (section.title || '').toLowerCase();
      const content = section.content?.content || section.content || '';
      
      if (content) {
        // Map based on title keywords
        if (title.includes('planetary') || title.includes('planets')) {
          flattened.planetaryAnalysis = content;
        }
        if (title.includes('strength') || title.includes('challenge')) {
          flattened.strengthsChallenges = content;
        }
        if (title.includes('life theme') || title.includes('themes')) {
          flattened.lifeThemes = content;
        }
        if (title.includes('spiritual') || title.includes('path')) {
          flattened.spiritualPath = content;
        }
        if (title.includes('annual') && title.includes('overview')) {
          flattened.annualOverview = content;
        }
        if (title.includes('annual') && title.includes('theme')) {
          flattened.annualThemes = content;
        }
      }
    });
  }
  
  // Direct SVG fields from top-level reportData
  if (reportData.matrixChartSVG) {
    flattened.matrixChartSVG = reportData.matrixChartSVG;
  }
  if (reportData.chartSvg) {
    flattened.chartSvg = reportData.chartSvg;
  }
  if (reportData.chartSVG) {
    flattened.chartSVG = reportData.chartSVG;
  }
  
  return flattened;
}

/**
 * Generate PDF from a pdfme template
 * @param {Object} template - Template object from database (with template_json)
 * @param {Object} reportData - Report data to fill into template
 * @param {Object} options - Additional options
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePDFFromTemplate(template, reportData, options = {}) {
  try {
    // Dynamically import pdfme generator
    const { pdf } = await import('@pdfme/generator');
    const { getDefaultFont } = await import('@pdfme/common');
    
    // Get the template JSON structure
    const templateStructure = Array.isArray(template.template_json)
      ? template.template_json
      : typeof template.template_json === 'string'
      ? JSON.parse(template.template_json)
      : template.template_json;
    
    // Ensure template is in the correct format (array of pages)
    const templateArray = Array.isArray(templateStructure) 
      ? templateStructure 
      : [templateStructure];
    
    // Flatten report data for field substitution
    const inputData = flattenReportData(reportData);
    
    // Create inputs array - pdfme expects an array of objects, one per page
    // Each object contains field values keyed by field name
    const inputs = templateArray.map(() => inputData);
    
    // Generate PDF
    console.log('[Template Renderer] Generating PDF with pdfme...');
    console.log('[Template Renderer] Template pages:', templateArray.length);
    console.log('[Template Renderer] Input fields:', Object.keys(inputData).length);
    
    const pdfBuffer = await pdf({
      template: templateArray,
      inputs: inputs,
      options: {
        font: getDefaultFont(),
        ...options,
      },
    });
    
    console.log('[Template Renderer] PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
  } catch (error) {
    console.error('[Template Renderer] Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate PDF from template and upload to Cloudinary
 * @param {Object} template - Template object from database
 * @param {Object} reportData - Report data to fill into template
 * @param {string} reportType - Report type for filename
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Cloudinary URL of uploaded PDF
 */
export async function generateAndUploadPDF(template, reportData, reportType, options = {}) {
  // Generate PDF buffer
  const pdfBuffer = await generatePDFFromTemplate(template, reportData, options);
  
  // Upload to Cloudinary (reuse existing logic from pdf-generator.js)
  const { v2: cloudinary } = await import('cloudinary');
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'reports',
        public_id: `report-${reportType}-template-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        format: 'pdf',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error('[Template Renderer] Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(Buffer.from(pdfBuffer));
  });
  
  console.log('[Template Renderer] PDF uploaded successfully:', uploadResult.secure_url);
  
  return uploadResult.secure_url;
}

/**
 * Main function to render a PDF using a template
 * @param {string|number} templateId - Template ID or slug
 * @param {Object} reportData - Report data
 * @param {string} reportType - Report type
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Cloudinary URL
 */
export async function renderTemplatePDF(templateId, reportData, reportType, options = {}) {
  // Get template from database
  const template = await getTemplate(templateId, reportType);
  
  if (!template) {
    throw new Error(`Template not found: ${templateId}${reportType ? ` for report type ${reportType}` : ''}`);
  }
  
  console.log(`[Template Renderer] Using template: ${template.name} (ID: ${template.id})`);
  
  // Generate and upload PDF
  return await generateAndUploadPDF(template, reportData, reportType, options);
}

/**
 * Render HTML from template JSON for Puppeteer
 * Accepts pdfme export JSON or HTML and returns a complete HTML string ready for Puppeteer
 * 
 * @param {Object|string} templateJson - Template object exported from pdfme designer
 *   - If templateJson.html exists: raw HTML with Mustache placeholders
 *   - If templateJson.layout exists: layout blocks array (text, image, html, svg)
 * @param {Object} data - Object with keys to inject (e.g., name, birthDate, chartSvg, forecastText)
 * @param {Object} options - Options { cacheKey?: string, inlineImages?: boolean }
 * @returns {Promise<string>} Full HTML string with inline CSS and fonts, ready for Puppeteer
 */
export async function renderFromTemplate(templateJson, data = {}, options = {}) {
  // Check cache first
  if (options.cacheKey) {
    const cached = getCachedHtml(options.cacheKey);
    if (cached) {
      console.log('[Template Renderer] Using cached HTML');
      return cached;
    }
  }
  // Parse template_json if it's a string
  let template = typeof templateJson === 'string' 
    ? JSON.parse(templateJson) 
    : templateJson;
  
  // Sanitize template to prevent XSS (templates from DB should already be sanitized, but double-check)
  template = sanitizeTemplate(template);
  
  // Option 1: Designer exports raw HTML
  if (template.html) {
    // Ensure we have default styles and fonts for Puppeteer
    const defaultStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          padding: 0.75in;
        }
        ${template.styles || ''}
      </style>
    `;
    
    let rendered = Mustache.render(template.html, data);
    
    // Log rendering for debugging
    console.log('[Template Renderer] Rendered HTML length:', rendered.length, 'characters');
    if (rendered.length < 100) {
      console.warn('[Template Renderer] WARNING: Rendered HTML is very short');
      console.log('[Template Renderer] Rendered preview (first 500 chars):', rendered.substring(0, 500));
    }
    
    // Inline images if requested
    if (options.inlineImages !== false) {
      const { inlineImagesInHtml } = await import('./image-inliner.js');
      rendered = await inlineImagesInHtml(rendered);
    }
    
    // Wrap in full HTML document if not already wrapped
    if (!rendered.trim().startsWith('<!doctype') && !rendered.trim().startsWith('<html')) {
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${defaultStyles}
</head>
<body>
  ${rendered}
</body>
</html>`;
      
      // Cache the result
      if (options.cacheKey) {
        setCachedHtml(options.cacheKey, html);
      }
      
      return html;
    }
    
    // If already full HTML, just inject styles if missing
    if (rendered.includes('<head>') && !rendered.includes('<style>')) {
      const html = rendered.replace('<head>', `<head>${defaultStyles}`);
      
      // Cache the result
      if (options.cacheKey) {
        setCachedHtml(options.cacheKey, html);
      }
      
      return html;
    }
    
    // If already full HTML, cache and return
    if (options.cacheKey) {
      setCachedHtml(options.cacheKey, rendered);
    }
    
    return rendered;
  }

  // Option 2: Layout blocks array
  if (template.layout && Array.isArray(template.layout.blocks)) {
    const styles = template.styles || '';
    const fonts = template.fonts || '';
    
    // Default styles for Puppeteer rendering
    const defaultStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #1a1a1a;
        padding: 0.75in;
      }
      .text-block { margin-bottom: 1em; }
      .image-block { max-width: 100%; height: auto; display: block; margin: 1em 0; }
      .html-block { margin: 1em 0; }
      .svg-block { margin: 1em 0; }
      ${styles}
    `;
    
    let html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${defaultStyles}
  </style>
  ${fonts ? `<link rel="stylesheet" href="${fonts}">` : ''}
</head>
<body>`;

    template.layout.blocks.forEach(block => {
      if (block.type === 'text') {
        const content = Mustache.render(block.content || '', data);
        const className = block.className || 'text-block';
        const style = block.style ? ` style="${block.style}"` : '';
        html += `<div class="${className}"${style}>${content}</div>`;
      } else if (block.type === 'image') {
        // Allow Mustache in src
        const src = Mustache.render(block.src || '', data);
        const alt = Mustache.render(block.alt || '', data);
        const className = block.className || 'image-block';
        const style = block.style ? ` style="${block.style}"` : '';
        html += `<img class="${className}" src="${src}" alt="${alt}"${style} />`;
      } else if (block.type === 'html') {
        const content = Mustache.render(block.html || '', data);
        const className = block.className || 'html-block';
        const style = block.style ? ` style="${block.style}"` : '';
        html += `<div class="${className}"${style}>${content}</div>`;
      } else if (block.type === 'svg') {
        // Embed inline SVG; ensure data contains svg string or url
        let svgContent = Mustache.render(block.svg || '', data);
        
        // Handle SVG strings - preserve inline SVG for vector rendering
        if (!svgContent || !svgContent.trim()) {
          // Empty SVG - skip
          return;
        }
        
        if (!svgContent.trim().startsWith('<svg')) {
          // If not SVG markup, treat as URL or data URL
          if (svgContent.startsWith('data:image/svg+xml')) {
            // Data URL with SVG - use img tag
            html += `<img class="svg-block" src="${svgContent}" alt="" />`;
          } else {
            // Regular URL - use img tag
            html += `<img class="svg-block" src="${svgContent}" alt="" />`;
          }
        } else {
          // Inline SVG - embed directly for vector rendering (preserves quality)
          const className = block.className || 'svg-block';
          const style = block.style ? ` style="${block.style}"` : '';
          html += `<div class="${className}"${style}>${svgContent}</div>`;
        }
      }
    });

    html += `</body>
</html>`;
    
    return html;
  }

  // Fallback: If template has template_json (nested structure)
  if (template.template_json) {
    return renderFromTemplate(template.template_json, data);
  }

  throw new Error(`Unrecognized template format. Template must have either 'html' property or 'layout.blocks' array. Received keys: ${Object.keys(template).join(', ')}`);
}

