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
  compatibilityChartSvg?: string;
  sections?: ReportSection[];
  compatibilityScores?: CompatibilityScores;
  base64BackgroundImage?: string; // Base64 string (with or without data: prefix) for watermark/cover background
}

interface ReportSection {
  type: string;
  title: string;
  content: string;
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
 * Convert markdown-like text to properly formatted HTML
 * Handles headings, bold, italic, lists, paragraphs, and horizontal rules
 */
const convertMarkdownToHtml = (text: string): string => {
  if (!text) return '';
  
  // Check if content is already HTML (starts with HTML tag)
  const isHTML = /^\s*</.test(text.trim());
  if (isHTML) {
    // Content is already HTML - return as-is but ensure proper structure
    return text;
  }
  
  let html = text;
  
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
    compatibilityChartSvg,
    sections = [],
    compatibilityScores,
    base64BackgroundImage,
  } = userData;

  const processedBirthChartSvg = ensurePreserveAspectRatio(birthChartSvg);
  const processedCompatibilityChartSvg = ensurePreserveAspectRatio(compatibilityChartSvg);
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
  const finalCompatibilityChartSvg = processSvgForPdf(processedCompatibilityChartSvg);

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
              <h2 className="cover-subtitle">MASTER REPORT</h2>
              <div className="cover-divider">✦</div>
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
        return (
          <div className="report-container">
            <div className="birth-chart-isolated chart-page-container">
              <div className="chart-container chart-page-only">
                <div dangerouslySetInnerHTML={{ __html: finalBirthChartSvg }} />
              </div>
            </div>
          </div>
        );

      case 'core_identity':
        if (!coreIdentitySection) return null;
        return (
          <div className="report-container">
            <div className="content-section section-core-identity">
              <h2 className="section-header">{coreIdentitySection.title}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(coreIdentitySection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'planetary_analysis':
        if (!planetaryAnalysisSection) return null;
        return (
          <div className="report-container">
            <div className="content-section">
              <h2 className="section-header">{planetaryAnalysisSection.title}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(planetaryAnalysisSection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'relationship_matrix':
        if (!relationshipMatrixSection) return null;
        return (
          <div className="report-container">
            <div className="content-section section-relationship-matrix relationship-matrix-section">
              <h2 className="section-header">{relationshipMatrixSection.title || 'Relationship Matrix'}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(relationshipMatrixSection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'compatibility':
        if (!compatibilitySection && !finalCompatibilityChartSvg && !compatibilityScores) return null;
        return (
          <div className="report-container">
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
          </div>
        );

      case 'transit':
        if (!transitSection) return null;
        return (
          <div className="report-container">
            <div className="content-section section-forecasts">
              <h2 className="section-header">Extended Transit Forecast</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(transitSection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'annual':
        if (!annualSection) return null;
        return (
          <div className="report-container">
            <div className="content-section">
              <h2 className="section-header">{annualSection.title}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(annualSection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'karmic':
        if (!karmicSection) return null;
        return (
          <div className="report-container">
            <div className="content-section section-karmic">
              <h2 className="section-header">{karmicSection.title || 'Karmic & Shadow Work'}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(karmicSection.content) }} />
              </div>
            </div>
          </div>
        );

      case 'closing':
        if (!closingSection) return null;
        return (
          <div className="report-container">
            <div className="content-section section-closing">
              <h2 className="section-header">{closingSection.title}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(closingSection.content) }} />
              </div>
            </div>
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
          <h2 className="cover-subtitle">Master Report</h2>
          <div className="metadata" style={{ marginTop: '20mm' }}>
            <p>Prepared for</p>
            <p style={{ fontSize: '18pt', color: '#d4af37', marginTop: '5mm' }}>
              {name}
            </p>
            <p style={{ marginTop: '10mm' }}>
              {birthDate} â€¢ {birthTime}
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
              <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(closingSection.content) }} />
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







