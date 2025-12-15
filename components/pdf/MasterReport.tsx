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
  return img.startsWith('data:image') ? img : `data:image/png;base64,${img}`;
};

export const MasterReport: React.FC<MasterReportProps> = ({ userData }) => {
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

  // Helper to render section content
  const renderSection = (section: ReportSection, index: number) => {
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

      {/* 1. Title Page */}
      <div
        className="cover-page"
        style={
          backgroundImageUrl
            ? {
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
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

      {/* 2. Birth Chart (forced to its own page) */}
      <div className="page-break" />
      {processedBirthChartSvg && (
        <div className="birth-chart-isolated chart-page-container">
          <div className="chart-container chart-page-only">
            <div dangerouslySetInnerHTML={{ __html: processedBirthChartSvg }} />
          </div>
        </div>
      )}

      {/* 3. Core Identity & Planetary Analysis */}
      <div className="page-break" />
      {coreIdentitySection && (
        <div className="content-section">
          <h2 className="section-header">{coreIdentitySection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(coreIdentitySection.content) }} />
          </div>
        </div>
      )}
      {planetaryAnalysisSection && (
        <div className="content-section">
          <h2 className="section-header">{planetaryAnalysisSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(planetaryAnalysisSection.content) }} />
          </div>
        </div>
      )}

      {/* 4. Relationship Matrix & Compatibility */}
      <div className="page-break" />
      {(relationshipMatrixSection || compatibilitySection || processedCompatibilityChartSvg || compatibilityScores) && (
        <div className="content-section">
          {relationshipMatrixSection && (
            <>
              <h2 className="section-header">{relationshipMatrixSection.title || 'Relationship Matrix'}</h2>
              <div className="analysis-block report-text-body">
                <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(relationshipMatrixSection.content) }} />
              </div>
            </>
          )}

          {compatibilitySection && (
            <>
              <h2 className="section-header">{compatibilitySection.title || 'Compatibility Analysis'}</h2>

              {processedCompatibilityChartSvg && (
                <div className="chart-container">
                  <div dangerouslySetInnerHTML={{ __html: processedCompatibilityChartSvg }} />
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
          )}

          {!compatibilitySection && compatibilityScores && (
            <>
              <h2 className="section-header">Compatibility Analysis</h2>
              {processedCompatibilityChartSvg && (
                <div className="chart-container">
                  <div dangerouslySetInnerHTML={{ __html: processedCompatibilityChartSvg }} />
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
      )}

      {/* 5. Forecasts (Transit THEN Annual) */}
      <div className="page-break" />
      {transitSection && (
        <div className="content-section">
          <h2 className="section-header">Extended Transit Forecast</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(transitSection.content) }} />
          </div>
        </div>
      )}
      <div className="page-break" />
      {annualSection && (
        <div className="content-section">
          <h2 className="section-header">{annualSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(annualSection.content) }} />
          </div>
        </div>
      )}

      {/* 6. Karmic Work */}
      <div className="page-break" />
      {karmicSection && (
        <div className="content-section">
          <h2 className="section-header">{karmicSection.title || 'Karmic & Shadow Work'}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(karmicSection.content) }} />
          </div>
        </div>
      )}

      {/* 7. Closing Blessing */}
      <div className="page-break" />
      {closingSection && (
        <div className="content-section">
          <h2 className="section-header">{closingSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(closingSection.content) }} />
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
        .map((section, index) => renderSection(section, index + 100))}
    </div>
  );
};

export default MasterReport;




