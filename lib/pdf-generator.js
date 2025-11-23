/**
 * PDF Generation Service
 * Generates professionally formatted PDF reports from reading results
 */

import { generateText } from './openai.js';

/**
 * Extract key points from report content for closing blessing
 */
function extractKeyPoints(content, reportType) {
  if (!content || typeof content !== 'string') return '';
  
  // Extract first 300 characters as summary
  const preview = content.substring(0, 300).trim();
  
  // Try to extract specific elements based on report type
  if (reportType === 'tarot') {
    // Extract card names if mentioned
    const cardMatches = content.match(/\*\*([^*]+)\*\*/g);
    if (cardMatches) {
      return `Cards drawn: ${cardMatches.slice(0, 3).map(c => c.replace(/\*\*/g, '')).join(', ')}. ${preview}`;
    }
  } else if (reportType === 'moon') {
    // Extract moon phase if mentioned
    const moonPhaseMatch = content.match(/(Waxing|Waning|New|Full) (Crescent|Gibbous|Moon)/i);
    if (moonPhaseMatch) {
      return `Moon Phase: ${moonPhaseMatch[0]}. ${preview}`;
    }
  } else if (reportType === 'transit') {
    // Extract transit aspects if mentioned
    const transitMatches = content.match(/(Mars|Venus|Mercury|Jupiter|Saturn|Uranus|Neptune|Pluto|Sun|Moon)\s+(trine|square|conjunct|opposition|sextile)/gi);
    if (transitMatches) {
      return `Key transits: ${transitMatches.slice(0, 3).join(', ')}. ${preview}`;
    }
  }
  
  return preview;
}

/**
 * Generate report content using OpenAI
 */
export async function generateReportContent(reportType, data, progressCallback) {
  try {
    await progressCallback?.(20, 'Generating report content...');
    
    // Import prompts dynamically to avoid circular dependencies
    const { getPromptByType } = await import('./report-prompts.js');
    const prompt = getPromptByType(reportType, data);
    
    await progressCallback?.(40, 'Calling AI for interpretation...');
    
    // Generate content using OpenAI
    const content = await generateText(prompt);
    
    await progressCallback?.(80, 'Formatting report...');
    
    return {
      content,
      sections: parseReportSections(content, reportType),
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating report content:', error);
    throw error;
  }
}

/**
 * Parse report content into structured sections for PDF
 */
function parseReportSections(content, reportType) {
  // Basic parsing - can be enhanced later
  const sections = [];
  
  // Split by headers (lines starting with # or ##)
  const lines = content.split('\n');
  let currentSection = { title: 'Introduction', content: [] };
  
  for (const line of lines) {
    if (line.match(/^#{1,2}\s+/)) {
      // New section
      if (currentSection.content.length > 0) {
        sections.push({
          ...currentSection,
          content: currentSection.content.join('\n'),
        });
      }
      currentSection = {
        title: line.replace(/^#{1,2}\s+/, '').trim(),
        content: [],
      };
    } else if (line.trim()) {
      currentSection.content.push(line);
    }
  }
  
  // Add last section
  if (currentSection.content.length > 0) {
    sections.push({
      ...currentSection,
      content: currentSection.content.join('\n'),
    });
  }
  
  return sections.length > 0 ? sections : [{ title: 'Report', content }];
}

/**
 * Generate PDF from report content
 * This would integrate with a PDF generation library like pdfkit or puppeteer
 */
export async function generatePDF(reportType, reportData, content, options = {}) {
  // TODO: Implement actual PDF generation
  // For now, return a placeholder URL
  
  const { cloudinary } = await import('./cloudinary.js');
  
  // Generate HTML from content
  const html = generateHTMLReport(reportType, reportData, content);
  
  // For now, we'll store the HTML and generate PDF on-demand
  // In production, you'd use a service like Puppeteer or PDFKit
  
  return {
    pdfUrl: null, // Will be generated when PDF service is implemented
    html,
  };
}

/**
 * Generate HTML report structure
 */
function generateHTMLReport(reportType, reportData, content) {
  const { name, card_spread, moon_phase, sun, moon, rising } = reportData;
  
  const title = getReportTitle(reportType);
  const sections = parseReportSections(content.content || content, reportType);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${name || 'Your Reading'}</title>
  <style>
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #2d3748;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fafafa;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #9333ea;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      color: #9333ea;
      font-size: 2.5em;
      margin: 0;
    }
    .header .subtitle {
      color: #718096;
      font-style: italic;
      margin-top: 10px;
    }
    .branding {
      text-align: center;
      color: #a0aec0;
      font-size: 0.9em;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #553c9a;
      font-size: 1.8em;
      border-left: 4px solid #9333ea;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .section h3 {
      color: #6b46c1;
      font-size: 1.4em;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .content {
      text-align: justify;
      font-size: 1.1em;
      white-space: pre-wrap;
    }
    .highlight {
      background: #fef3c7;
      padding: 2px 4px;
      border-radius: 3px;
    }
    .footer {
      text-align: center;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      color: #718096;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">${name ? `Prepared for ${name}` : 'Your Personalized Reading'}</div>
    <div class="subtitle">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
  
  ${sections.map(section => `
    <div class="section">
      <h2>${section.title}</h2>
      <div class="content">${section.content}</div>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>www.cosmicspiritguide.com</p>
    <p>Generated with care and cosmic insight</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get report title by type
 */
function getReportTitle(reportType) {
  const titles = {
    'tarot': 'Tarot Reading',
    'moon_reading': 'Moon Phase Reading',
    'birth_chart': 'Birth Chart Analysis',
    'natal_chart': 'Natal Chart Reading',
    'compatibility': 'Compatibility Report',
    'compatibility_report': 'Compatibility Analysis',
    'transit_forecast_short': 'Short-Term Transit Forecast',
    'transit_forecast_extended': 'Extended Transit Forecast',
    'destiny_path': 'Destiny Path Cycle Reading',
    'relationship_matrix': 'Relationship Matrix Analysis',
    'karmic_reading': 'Karmic & Shadow Work Reading',
    'shadow_work': 'Shadow Work Reading',
  };
  
  return titles[reportType?.toLowerCase()] || 'Spiritual Reading';
}

/**
 * Generate complete premium report (multiple sections)
 */
export async function generatePremiumReport(reportType, data, progressCallback) {
  try {
    await progressCallback?.(10, 'Initializing report generation...');
    
    const sections = [];
    
    // Generate main reading content
    if (reportType === 'ESSENTIAL') {
      // Essential: Tarot + Moon + Short Forecast
      await progressCallback?.(15, 'Generating Tarot reading...');
      const tarot = await generateReportContent('tarot', data.tarot_data, (p, m) => 
        progressCallback?.(15 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'tarot', 
        title: 'Tarot Reading', 
        content: tarot,
        summary: extractKeyPoints(tarot.content, 'tarot')
      });
      
      await progressCallback?.(40, 'Generating Moon reading...');
      const moon = await generateReportContent('moon_reading', data.moon_data, (p, m) => 
        progressCallback?.(40 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'moon', 
        title: 'Moon Phase Reading', 
        content: moon,
        summary: extractKeyPoints(moon.content, 'moon')
      });
      
      await progressCallback?.(65, 'Generating Transit forecast...');
      const forecast = await generateReportContent('transit_forecast_short', data.transit_data, (p, m) => 
        progressCallback?.(65 + (p * 0.25), m)
      );
      sections.push({ 
        type: 'transit', 
        title: 'Short-Term Forecast', 
        content: forecast,
        summary: extractKeyPoints(forecast.content, 'transit')
      });
      
    } else if (reportType === 'ADVANCED') {
      // Advanced: Birth Chart + Compatibility + Extended Forecast
      await progressCallback?.(20, 'Generating Birth Chart analysis...');
      const birthChart = await generateReportContent('birth_chart', data.birth_chart_data, (p, m) => 
        progressCallback?.(20 + (p * 0.2), m)
      );
      sections.push({ type: 'birth_chart', title: 'Birth Chart Analysis', content: birthChart });
      
      await progressCallback?.(40, 'Generating Compatibility report...');
      const compatibility = await generateReportContent('compatibility', data.compatibility_data, (p, m) => 
        progressCallback?.(40 + (p * 0.2), m)
      );
      sections.push({ type: 'compatibility', title: 'Compatibility Analysis', content: compatibility });
      
      await progressCallback?.(60, 'Generating Extended forecast...');
      const forecast = await generateReportContent('transit_forecast_extended', data.transit_data, (p, m) => 
        progressCallback?.(60 + (p * 0.2), m)
      );
      sections.push({ type: 'transit', title: 'Extended Transit Forecast', content: forecast });
      
    } else if (reportType === 'MASTER') {
      // Master: All of Advanced + Destiny Path + Karmic Reading + Relationship Matrix
      await progressCallback?.(10, 'Generating Birth Chart...');
      const birthChart = await generateReportContent('birth_chart', data.birth_chart_data, (p, m) => 
        progressCallback?.(10 + (p * 0.1), m)
      );
      sections.push({ type: 'birth_chart', title: 'Birth Chart Analysis', content: birthChart });
      
      await progressCallback?.(20, 'Generating Compatibility analysis...');
      const compatibility = await generateReportContent('compatibility', data.compatibility_data, (p, m) => 
        progressCallback?.(20 + (p * 0.1), m)
      );
      sections.push({ type: 'compatibility', title: 'Compatibility Analysis', content: compatibility });
      
      await progressCallback?.(30, 'Generating Extended forecast...');
      const forecast = await generateReportContent('transit_forecast_extended', data.transit_data, (p, m) => 
        progressCallback?.(30 + (p * 0.1), m)
      );
      sections.push({ type: 'transit', title: 'Extended Transit Forecast', content: forecast });
      
      await progressCallback?.(40, 'Generating Destiny Path reading...');
      const destiny = await generateReportContent('destiny_path', data.destiny_data, (p, m) => 
        progressCallback?.(40 + (p * 0.1), m)
      );
      sections.push({ type: 'destiny', title: 'Destiny Path Cycle', content: destiny });
      
      await progressCallback?.(50, 'Generating Relationship Matrix...');
      const matrix = await generateReportContent('relationship_matrix', data.matrix_data, (p, m) => 
        progressCallback?.(50 + (p * 0.1), m)
      );
      sections.push({ type: 'matrix', title: 'Relationship Matrix', content: matrix });
      
      await progressCallback?.(60, 'Generating Karmic reading...');
      const karmic = await generateReportContent('karmic_reading', data.karmic_data, (p, m) => 
        progressCallback?.(60 + (p * 0.1), m)
      );
      sections.push({ type: 'karmic', title: 'Karmic & Shadow Work', content: karmic });
    }
    
    // Generate closing blessing - pass actual report sections so it can reference them
    await progressCallback?.(90, 'Adding closing message...');
    const { getClosingBlessingPrompt } = await import('./report-prompts.js');
    const closing = await generateText(
      getClosingBlessingPrompt({ 
        name: data.name, 
        report_sections: sections, // Pass actual sections with content
        report_type: reportType,
        key_themes: sections.map(s => s.title), // Keep as fallback
      })
    );
    sections.push({ type: 'closing', title: 'Closing Blessing', content: { content: closing } });
    
    // Generate HTML and PDF
    await progressCallback?.(95, 'Generating PDF...');
    const fullContent = sections.map(s => `${s.title}\n\n${s.content.content || s.content}`).join('\n\n---\n\n');
    const html = generateHTMLReport(reportType, data, { content: fullContent });
    const pdf = await generatePDF(reportType, data, { content: fullContent });
    
    return {
      sections,
      content: fullContent,
      html,
      pdfUrl: pdf.pdfUrl,
    };
  } catch (error) {
    console.error('[PDF Generator] Error generating premium report:', error);
    throw error;
  }
}

