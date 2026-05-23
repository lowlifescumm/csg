const logger = require('../../lib/logger');
const { scrubTemplateArtifacts } = require('../../lib/template-scrub.js');
/**
 * Premium Master Report Component
 * Renders a flowing, semantic document structure for PDF generation
 */

import React from 'react';
// CSS is inlined in the HTML document by premium-pdf-generator.js
// No need to import here as styles are injected server-side

interface UserData {
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  birthChartSvg?: string;
  partnerBirthChartSvg?: string;
  compatibilityChartSvg?: string;
  compositeChartSvg?: string;
  sections?: ReportSection[];
  compatibilityScores?: CompatibilityScores;
  base64BackgroundImage?: string; // Base64 string (with or without data: prefix) for watermark/cover background
  reportTitle?: string; // TASK 1: Dynamic report title (ESSENTIAL REPORT, ADVANCED REPORT, etc.)
  reportType?: string; // Report type (essential, advanced, compatibility, master)
}

interface ReportSection {
  type: string;
  title: string;
  content: string;
  chartDataSource?: { type: string; label: string } | null;
}

interface CompatibilityScores {
  emotional?: number;
  communication?: number;
  spiritual?: number;
  stability?: number;
  physical?: number;
}

interface MasterReportProps {
  userData: UserData;
  renderSection?: string; // Optional: if provided, only render this specific section
}


/**
 * Utility function to replace placeholder text with "Cosmic Spirit Guide"
 * Replaces [Your Spiritual Guide], [Your Name], and similar placeholders
 * Also strips template scaffolding patterns that leak from AI prompts
 */
const sanitizeSignOffs = (text: string): string => {
  if (!text) return '';
  // Replace various placeholder patterns with "Cosmic Spirit Guide"
  let result = text
    .replace(/\[Your Spiritual Guide\]/gi, 'Cosmic Spirit Guide')
    .replace(/\[Your Name\]/gi, 'Cosmic Spirit Guide')
    .replace(/\[Your Name Here\]/gi, 'Cosmic Spirit Guide')
    .replace(/\[Name\]/gi, 'Cosmic Spirit Guide')
    .replace(/\[Guide Name\]/gi, 'Cosmic Spirit Guide')
    // Strip template scaffolding from prompt instructions that leaked through
    .replace(/\[DATE FROM LIST\]/gi, '')
    .replace(/\[FUTURE DATE FROM LIST\]/gi, '')
    .replace(/\[Date\]:\s*\[Transit\]\s*-\s*\[Comprehensive impact description\]/gi, '')
    .replace(/\[Transit\]/gi, '')
    .replace(/\[Comprehensive impact description\]/gi, '')
    .replace(/\[Insert\s+(content|text|data|details)\s+here\]/gi, '')
    .replace(/\[auto-generated\]/gi, '')
    .replace(/TODO:/gi, '')
    .replace(/this\s+(content|section|report)\s+was\s+(auto-)?generated\s+(by\s+)?(AI|an?\s+AI)/gi, '')
    .replace(/generated\s+(by|using)\s+(AI|OpenAI|GPT|artificial\s+intelligence)/gi, '')
    // Strip "no data" fallback language
    .replace(/no\s+(future\s+)?transits?\s+were\s+provided/gi, '')
    .replace(/no\s+(data|information|content|results?)\s+(were\s+)?(provided|available|found)/gi, '')
    .replace(/no\s+\w+\s+data\s+(were\s+)?(provided|available|found)/gi, '')
    .replace(/no\s+\w+\s+were\s+provided/gi, '')
    .replace(/this\s+(is\s+)?(a\s+)?placeholder/i, '');
  // Apply the full template scrubbing pipeline
  result = scrubTemplateArtifacts(result);
  return result;
};

/**
 * Convert markdown-like text to properly formatted HTML
 * Handles headings, bold, italic, lists, paragraphs, and horizontal rules
 * TASK 2: Also sanitizes sign-off placeholders
 */
const convertMarkdownToHtml = (text: string): string => {
  if (!text) return '';
  
  // Check if content is already HTML (starts with HTML tag)
  const isHTML = /^\s*</.test(text.trim());
  if (isHTML) {
    return scrubTemplateArtifacts(text);
  }
  
  let html = scrubTemplateArtifacts(text);
  
  // Convert horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr />');
  
  // Convert headings (## Heading -> <h2>, ### Heading -> <h3>, etc.)
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  
  // Convert bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Convert italic (*text* or _text_)
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>');
  
  // Convert unordered lists (- item or * item)
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
  
  // Convert ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive numbered <li> tags in <ol> (simplified - assumes they're ordered)
  // Note: This is a simplified approach. For complex cases, a proper parser would be better.
  
  // Convert double newlines to paragraph breaks
  html = html.split(/\n\n+/).map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    // Don't wrap headings, lists, or HRs in paragraphs
    if (/^<(h[1-6]|ul|ol|li|hr)/i.test(trimmed)) {
      return trimmed;
    }
    return `<p>${trimmed}</p>`;
  }).join('\n');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6])/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul|<ol)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr)/g, '$1');
  html = html.replace(/(<\/hr>)<\/p>/g, '$1');
  
  // Ensure proper spacing between elements
  html = html.replace(/(<\/p>)\s*(<p>)/g, '$1\n$2');
  html = html.replace(/(<\/h[1-6]>)\s*(<p>)/g, '$1\n$2');
  
  // TASK 2: Sanitize sign-off placeholders before returning
  html = sanitizeSignOffs(html);
  
  return html;
};
const ensurePreserveAspectRatio = (svgString?: string) => {
  if (!svgString) return undefined;
  if (/preserveAspectRatio=/i.test(svgString)) return svgString;
  return svgString.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
};

const toDataUrl = (img?: string) => {
  if (!img) return undefined;
  // If it's already a data URL, return as-is
  if (img.startsWith('data:image')) return img;
  // If it's a Cloudinary URL or any HTTP(S) URL, return as-is (Puppeteer will fetch it)
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  // Otherwise, assume it's base64 and convert to data URL
  return `data:image/png;base64,${img}`;
};

export const MasterReport: React.FC<MasterReportProps> = ({ userData, renderSection }) => {
  const {
    name,
    birthDate,
    birthTime,
    location,
    sunSign,
    moonSign,
    risingSign,
    birthChartSvg,
    partnerBirthChartSvg,
    compatibilityChartSvg,
    compositeChartSvg,
    sections = [],
    compatibilityScores,
    base64BackgroundImage,
    reportTitle = 'MASTER REPORT', // TASK 1: Default to MASTER REPORT if not provided
  } = userData;

  const processedBirthChartSvg = ensurePreserveAspectRatio(birthChartSvg);
  const processedPartnerBirthChartSvg = ensurePreserveAspectRatio(partnerBirthChartSvg);
  const processedCompatibilityChartSvg = ensurePreserveAspectRatio(compatibilityChartSvg);
  const processedCompositeChartSvg = ensurePreserveAspectRatio(compositeChartSvg);
  const backgroundImageUrl = toDataUrl(base64BackgroundImage);
  
  // Ensure SVG images are properly formatted for PDF rendering
  const processSvgForPdf = (svgString?: string) => {
    if (!svgString) return undefined;
    // Ensure SVG has proper namespace and viewBox
    let processed = svgString;
    if (!processed.includes('xmlns=')) {
      processed = processed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Ensure preserveAspectRatio is set
    if (!processed.includes('preserveAspectRatio=')) {
      processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
    }
    return processed;
  };
  
  const finalBirthChartSvg = processSvgForPdf(processedBirthChartSvg);
  const finalPartnerBirthChartSvg = processSvgForPdf(processedPartnerBirthChartSvg);
  const finalCompatibilityChartSvg = processSvgForPdf(processedCompatibilityChartSvg);
  const finalCompositeChartSvg = processSvgForPdf(processedCompositeChartSvg);

  // Helper to render section content
  const renderSectionContent = (section: ReportSection, index: number) => {
    return (
      <div key={index} className="content-section">
        <h2 className="section-header">{section.title}</h2>
        <div className="analysis-block report-text-body">
          <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(section.content) }} />
        </div>
      </div>
    );
  };

  // Find specific sections by type
  const getSectionByType = (type: string): ReportSection | undefined => {
    return sections.find((s) => s.type === type);
  };

  // Find sections by type (in the order they will be rendered)
  const birthChartSection = getSectionByType('birth_chart');
  const coreIdentitySection = getSectionByType('core_identity') || getSectionByType('identity') || getSectionByType('synthesis');
  const planetaryAnalysisSection = getSectionByType('planetary_analysis') || getSectionByType('planetary') || getSectionByType('planets');
  const compatibilitySection = getSectionByType('compatibility');
  const relationshipMatrixSection = getSectionByType('relationship_matrix') || getSectionByType('matrix');
  const transitSection = getSectionByType('transit');
  const annualSection =
    getSectionByType('annual_forecast') ||
    getSectionByType('annual') ||
    getSectionByType('forecast') ||
    getSectionByType('yearly') ||
    getSectionByType('destiny_path');
  const karmicSection = getSectionByType('karmic');
  const closingSection = getSectionByType('closing');

  // Helper function to wrap content sections with watermark (stationery effect)
  const wrapWithStationery = (content: React.ReactElement) => {
    return (
      <div className="report-container">
        {/* CSG Stationery watermark - appears on all content pages */}
        {backgroundImageUrl && (
          <div
            className="watermark-layer"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
            }}
          />
        )}
        {content}
      </div>
    );
  };

  // Helper function to render individual sections for stitch strategy
  const renderSingleSection = (sectionName: string) => {
    switch (sectionName) {
      case 'cover':
        const currentDate = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        return (
          <div className="cover-page-container" style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            height: '100vh',
            width: '100vw',
            margin: 0,
            padding: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          }}>
            {/* Dark overlay gradient for readability */}
            <div className="cover-overlay" />
            
            {/* Content container */}
            <div className="cover-content">
              <h1 className="cover-main-title">COSMIC SPIRIT GUIDE</h1>
              {/* TASK 1: Dynamic report title based on reportType */}
              <h2 className="cover-subtitle">{reportTitle}</h2>
              <div className="cover-divider">?</div>
              <p className="cover-prepared-for">Prepared for</p>
              <h3 className="cover-user-name">{name}</h3>
              <div className="cover-footer">
                Generated on {currentDate}
              </div>
            </div>
          </div>
        );

      case 'birth_chart':
        if (!finalBirthChartSvg) return null;
        // Chart pages: NO watermark (clean background)
        
        // #region agent log
        if (typeof window === 'undefined') {
          const fs = require('fs');
          try {
            const logPath = 'e:\\merge2\\.cursor\\debug.log';
            const svgMatch = finalBirthChartSvg?.match(/<svg[^>]*>/);
            const viewBoxMatch = svgMatch?.[0]?.match(/viewBox="([^"]+)"/);
            const logEntry = JSON.stringify({
              location: 'MasterReport.tsx:260',
              message: 'Birth chart section rendered',
              data: {
                svgLength: finalBirthChartSvg?.length,
                hasSvg: !!svgMatch,
                viewBox: viewBoxMatch?.[1],
                svgPreview: svgMatch?.[0]?.substring(0, 150)
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'A,B'
            }) + '\n';
            fs.appendFileSync(logPath, logEntry, 'utf-8');
          } catch (e) {}
        }
        // #endregion
        
        return (
          <div className="report-container">
            <div className="birth-chart-isolated chart-page-container">
              <div className="chart-container chart-page-only">
                <div dangerouslySetInnerHTML={{ __html: finalBirthChartSvg }} />
              </div>
            </div>
          </div>
        );

      case 'partner_birth_chart':
        if (!finalPartnerBirthChartSvg) return null;
        const partnerDataSource = sections.find(s => s.type === 'partner_birth_chart')?.chartDataSource;
        return (
          <div className="report-container">
            <div className="birth-chart-isolated chart-page-container">
              <div className="chart-container chart-page-only">
                <div dangerouslySetInnerHTML={{ __html: finalPartnerBirthChartSvg }} />
              </div>
              <div style={{
                textAlign: 'center',
                padding: '8px 20px',
                fontSize: '9pt',
                color: '#888',
                fontStyle: 'italic',
                borderTop: '1px solid #ddd',
                marginTop: '10px',
              }}>
                Data source: {partnerDataSource?.label || 'Based on birth data you entered for your partner'}
                <br />
                <span style={{ fontSize: '8pt', color: '#aaa' }}>
                  This chart is calculated from birth data you provided and has not been independently verified.
                </span>
              </div>
            </div>
          </div>
        );

      case 'core_identity':
        if (!coreIdentitySection) return null;
        return wrapWithStationery(
          <div className="content-section section-core-identity">
            <h2 className="section-header">{coreIdentitySection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(coreIdentitySection.content) }} />
            </div>
          </div>
        );

      case 'planetary_analysis':
        if (!planetaryAnalysisSection) return null;
        return wrapWithStationery(
          <div className="content-section">
            <h2 className="section-header">{planetaryAnalysisSection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(planetaryAnalysisSection.content) }} />
            </div>
          </div>
        );

      case 'relationship_matrix':
        // #region agent log (production-safe)
        if (typeof window === 'undefined' && typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MasterReport.tsx:345',message:'H11: Rendering relationship_matrix section',data:{hasRelationshipMatrixSection:!!relationshipMatrixSection,relationshipMatrixSectionType:relationshipMatrixSection?.type,relationshipMatrixSectionTitle:relationshipMatrixSection?.title,relationshipMatrixSectionContentLength:relationshipMatrixSection?.content?.length||0,relationshipMatrixSectionContentPreview:relationshipMatrixSection?.content?.substring(0,200)||''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H11'})}).catch(()=>{});
        }
        // #endregion
        if (!relationshipMatrixSection) {
          console.log('[MasterReport] Relationship matrix section not found - returning null');
          return null;
        }
        return wrapWithStationery(
          <div className="content-section section-relationship-matrix relationship-matrix-section">
            <h2 className="section-header">{relationshipMatrixSection.title || 'Relationship Matrix'}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(relationshipMatrixSection.content) }} />
            </div>
          </div>
        );

      case 'compatibility':
        // #region agent log (production-safe)
        if (typeof window === 'undefined' && typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MasterReport.tsx:356',message:'H10: Rendering compatibility section',data:{hasCompatibilitySection:!!compatibilitySection,compatibilitySectionType:compatibilitySection?.type,compatibilitySectionTitle:compatibilitySection?.title,compatibilitySectionContentLength:compatibilitySection?.content?.length||0,compatibilitySectionContentPreview:compatibilitySection?.content?.substring(0,200)||'',hasChartSvg:!!finalCompatibilityChartSvg,hasScores:!!compatibilityScores,sectionsCount:sections.length,sectionsTypes:sections.map(s=>s.type),allSections:JSON.stringify(sections.map(s=>({type:s.type,title:s.title,contentLength:s.content?.length||0})))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H10'})}).catch(()=>{});
        }
        // #endregion
        if (!compatibilitySection && !finalCompatibilityChartSvg && !compatibilityScores) {
          console.log('[MasterReport] Compatibility section not found - returning null', {
            hasCompatibilitySection: !!compatibilitySection,
            hasChartSvg: !!finalCompatibilityChartSvg,
            hasScores: !!compatibilityScores,
            sectionsCount: sections.length,
            sectionsTypes: sections.map(s => s.type),
          });
          return null;
        }
        return wrapWithStationery(
          <div className="content-section section-compatibility">
              {compatibilitySection ? (
                <>
                  <h2 className="section-header">{compatibilitySection.title || 'Compatibility Analysis'}</h2>
                  {finalCompatibilityChartSvg && (
                    <div className="chart-container">
                      <div dangerouslySetInnerHTML={{ __html: finalCompatibilityChartSvg }} />
                    </div>
                  )}
                  {compatibilityScores && (
                    <table style={{ marginTop: '10mm' }}>
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th style={{ textAlign: 'right' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compatibilityScores.emotional !== undefined && (
                          <tr>
                            <td>Emotional Connection</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.emotional}%</td>
                          </tr>
                        )}
                        {compatibilityScores.communication !== undefined && (
                          <tr>
                            <td>Communication</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.communication}%</td>
                          </tr>
                        )}
                        {compatibilityScores.spiritual !== undefined && (
                          <tr>
                            <td>Spiritual Connection</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.spiritual}%</td>
                          </tr>
                        )}
                        {compatibilityScores.stability !== undefined && (
                          <tr>
                            <td>Stability</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.stability}%</td>
                          </tr>
                        )}
                        {compatibilityScores.physical !== undefined && (
                          <tr>
                            <td>Physical Chemistry</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.physical}%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  <div className="analysis-block report-text-body" style={{ marginTop: '10mm' }}>
                    <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(compatibilitySection.content) }} />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="section-header">Compatibility Analysis</h2>
                  {finalCompatibilityChartSvg && (
                    <div className="chart-container">
                      <div dangerouslySetInnerHTML={{ __html: finalCompatibilityChartSvg }} />
                    </div>
                  )}
                  {compatibilityScores && (
                    <table style={{ marginTop: '10mm' }}>
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th style={{ textAlign: 'right' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compatibilityScores.emotional !== undefined && (
                          <tr>
                            <td>Emotional Connection</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.emotional}%</td>
                          </tr>
                        )}
                        {compatibilityScores.communication !== undefined && (
                          <tr>
                            <td>Communication</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.communication}%</td>
                          </tr>
                        )}
                        {compatibilityScores.spiritual !== undefined && (
                          <tr>
                            <td>Spiritual Connection</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.spiritual}%</td>
                          </tr>
                        )}
                        {compatibilityScores.stability !== undefined && (
                          <tr>
                            <td>Stability</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.stability}%</td>
                          </tr>
                        )}
                        {compatibilityScores.physical !== undefined && (
                          <tr>
                            <td>Physical Chemistry</td>
                            <td style={{ textAlign: 'right' }}>{compatibilityScores.physical}%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
        );

      case 'transit':
        if (!transitSection) return null;
        return wrapWithStationery(
          <div className="content-section section-forecasts">
            <h2 className="section-header">Extended Transit Forecast</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(transitSection.content) }} />
            </div>
          </div>
        );

      case 'annual':
        if (!annualSection) return null;
        return wrapWithStationery(
          <div className="content-section">
            <h2 className="section-header">{annualSection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(annualSection.content) }} />
            </div>
          </div>
        );

      case 'karmic':
        if (!karmicSection) return null;
        return wrapWithStationery(
          <div className="content-section section-karmic">
            <h2 className="section-header">{karmicSection.title || 'Karmic & Shadow Work'}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(karmicSection.content) }} />
            </div>
          </div>
        );

      case 'closing':
        // #region agent log (production-safe)
        if (typeof window === 'undefined' && typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/36ab7c16-0814-43e1-a364-65e843241344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MasterReport.tsx:closing',message:'H12: Rendering closing section',data:{hasClosingSection:!!closingSection,closingSectionType:closingSection?.type,closingSectionTitle:closingSection?.title,closingSectionContentLength:closingSection?.content?.length||0,closingSectionContentPreview:closingSection?.content?.substring(0,200)||''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H12'})}).catch(()=>{});
        }
        // #endregion
        if (!closingSection) {
          console.log('[MasterReport] Closing section not found - returning null');
          return null;
        }
        // TASK 2: Sanitize closing content and ensure signature is present
        const closingContent = sanitizeSignOffs(closingSection.content);
        const hasSignature = closingContent.toLowerCase().includes('cosmic spirit guide') || 
                            closingContent.toLowerCase().includes('in spiritual harmony');
        
        return wrapWithStationery(
          <div className="content-section section-closing">
            <h2 className="section-header">{closingSection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(closingContent) }} />
            </div>
            {/* TASK 2: Always include signature if not already present */}
            {!hasSignature && (
              <div className="signature" style={{ marginTop: '10mm', textAlign: 'center' }}>
                <p style={{ marginBottom: '5mm', fontStyle: 'italic' }}>In Spiritual Harmony,</p>
                <h3 style={{ color: '#d4af37', fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>Cosmic Spirit Guide</h3>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // If renderSection prop is provided, only render that specific section
  if (renderSection) {
    return renderSingleSection(renderSection);
  }

  return (
    <div className="report-container">
      {/* Global watermark layer */}
      {base64BackgroundImage && (
        <div
          className="watermark-layer"
          style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          }}
        />
      )}

      {/* Section 1: Title Page */}
      <div className="print-section-wrapper">
        <div
          className="cover-page"
          style={
            backgroundImageUrl
              ? {
                  backgroundImage: `url(${backgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundAttachment: 'fixed',
                }
              : {}
          }
        >
          <h1 className="cover-title">Cosmic Spiritual Guide</h1>
          {/* TASK 1: Dynamic report title based on reportType */}
          <h2 className="cover-subtitle">{reportTitle}</h2>
          <div className="metadata" style={{ marginTop: '20mm' }}>
            <p>Prepared for</p>
            <p style={{ fontSize: '18pt', color: '#d4af37', marginTop: '5mm' }}>
              {name}
            </p>
            <p style={{ marginTop: '10mm' }}>
              {birthDate} • {birthTime}
            </p>
            <p>{location}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Birth Chart */}
      {finalBirthChartSvg && (
        <div className="print-section-wrapper">
          <div className="birth-chart-isolated chart-page-container">
            <div className="chart-container chart-page-only">
              <div dangerouslySetInnerHTML={{ __html: finalBirthChartSvg }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Core Identity */}
      {coreIdentitySection && (
        <div className="print-section-wrapper">
          <div className="content-section section-core-identity">
            <h2 className="section-header">{coreIdentitySection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(coreIdentitySection.content) }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Planetary Analysis */}
      {planetaryAnalysisSection && (
        <div className="print-section-wrapper">
          <div className="content-section">
            <h2 className="section-header">{planetaryAnalysisSection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(planetaryAnalysisSection.content) }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Relationship Matrix */}
      {relationshipMatrixSection && (
        <div className="print-section-wrapper">
          <div className="content-section section-relationship-matrix relationship-matrix-section">
            <h2 className="section-header">{relationshipMatrixSection.title || 'Relationship Matrix'}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(relationshipMatrixSection.content) }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Compatibility Analysis */}
      {(compatibilitySection || finalCompatibilityChartSvg || compatibilityScores) && (
        <div className="print-section-wrapper">
          <div className="content-section section-compatibility">

            {compatibilitySection ? (
              <>
                <h2 className="section-header">{compatibilitySection.title || 'Compatibility Analysis'}</h2>

                {finalCompatibilityChartSvg && (
                  <div className="chart-container">
                    <div dangerouslySetInnerHTML={{ __html: finalCompatibilityChartSvg }} />
                  </div>
                )}

                {compatibilityScores && (
                  <table style={{ marginTop: '10mm' }}>
                    <thead>
                      <tr>
                        <th>Dimension</th>
                        <th style={{ textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compatibilityScores.emotional !== undefined && (
                        <tr>
                          <td>Emotional Connection</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.emotional}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.communication !== undefined && (
                        <tr>
                          <td>Communication</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.communication}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.spiritual !== undefined && (
                        <tr>
                          <td>Spiritual Connection</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.spiritual}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.stability !== undefined && (
                        <tr>
                          <td>Stability</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.stability}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.physical !== undefined && (
                        <tr>
                          <td>Physical Chemistry</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.physical}%
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                <div className="analysis-block report-text-body" style={{ marginTop: '10mm' }}>
                  <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(compatibilitySection.content) }} />
                </div>
              </>
            ) : (
              <>
                <h2 className="section-header">Compatibility Analysis</h2>
                {finalCompatibilityChartSvg && (
                  <div className="chart-container">
                    <div dangerouslySetInnerHTML={{ __html: finalCompatibilityChartSvg }} />
                  </div>
                )}
                {compatibilityScores && (
                  <table style={{ marginTop: '10mm' }}>
                    <thead>
                      <tr>
                        <th>Dimension</th>
                        <th style={{ textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compatibilityScores.emotional !== undefined && (
                        <tr>
                          <td>Emotional Connection</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.emotional}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.communication !== undefined && (
                        <tr>
                          <td>Communication</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.communication}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.spiritual !== undefined && (
                        <tr>
                          <td>Spiritual Connection</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.spiritual}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.stability !== undefined && (
                        <tr>
                          <td>Stability</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.stability}%
                          </td>
                        </tr>
                      )}
                      {compatibilityScores.physical !== undefined && (
                        <tr>
                          <td>Physical Chemistry</td>
                          <td style={{ textAlign: 'right' }}>
                            {compatibilityScores.physical}%
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Section 7: Transit Forecast */}
      {transitSection && (
        <div className="print-section-wrapper">
          <div className="content-section section-forecasts">
            <h2 className="section-header">Extended Transit Forecast</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(transitSection.content) }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Section 8: Annual Forecast */}
      {annualSection && (
        <div className="print-section-wrapper">
          <div className="content-section">
            <h2 className="section-header">{annualSection.title}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(annualSection.content) }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 9: Karmic Work */}
      {karmicSection && (
        <div className="print-section-wrapper">
          <div className="content-section section-karmic">
            <h2 className="section-header">{karmicSection.title || 'Karmic & Shadow Work'}</h2>
            <div className="analysis-block report-text-body">
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(karmicSection.content) }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 10: Closing Blessing */}
      {closingSection && (
        <div className="print-section-wrapper">
          <div className="content-section section-closing">
            <h2 className="section-header">{closingSection.title}</h2>
            <div className="analysis-block report-text-body">
              {/* TASK 2: Sanitize closing content */}
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(sanitizeSignOffs(closingSection.content)) }} />
            </div>
            {/* TASK 2: Always include signature */}
            <div className="signature" style={{ marginTop: '10mm', textAlign: 'center' }}>
              <p style={{ marginBottom: '5mm', fontStyle: 'italic' }}>In Spiritual Harmony,</p>
              <h3 style={{ color: '#d4af37', fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>Cosmic Spirit Guide</h3>
            </div>
          </div>
        </div>
      )}

      {/* Render any additional sections not already covered (after closing) */}
      {sections
        .filter(
          (s) =>
            ![
              'birth_chart',
              'compatibility',
              'transit',
              'destiny_path',
              'annual_forecast',
              'annual',
              'forecast',
              'yearly',
              'karmic',
              'closing',
              'core_identity',
              'identity',
              'synthesis',
              'planetary_analysis',
              'planetary',
              'planets',
              'relationship_matrix',
              'matrix',
            ].includes(s.type)
        )
        .map((section, index) => (
          <div key={index + 100} className="print-section-wrapper">
            {renderSectionContent(section, index + 100)}
          </div>
        ))}
    </div>
  );
};

export default MasterReport;






