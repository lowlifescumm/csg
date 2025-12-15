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
  base64BackgroundImage?: string; // Base64 string for watermark/cover background
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

const ensurePreserveAspectRatio = (svgString?: string) => {
  if (!svgString) return undefined;
  if (/preserveAspectRatio=/i.test(svgString)) return svgString;
  return svgString.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
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

  // Helper to render section content
  const renderSection = (section: ReportSection, index: number) => {
    return (
      <div key={index} className="content-section">
        <h2 className="section-header">{section.title}</h2>
        <div className="analysis-block report-text-body">
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
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
            backgroundImage: `url(data:image/png;base64,${base64BackgroundImage})`,
          }}
        />
      )}

      {/* 1. Title Page */}
      <div
        className="cover-page"
        style={
          base64BackgroundImage
            ? {
                backgroundImage: `url(data:image/png;base64,${base64BackgroundImage})`,
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
            {birthDate} • {birthTime}
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
            <div dangerouslySetInnerHTML={{ __html: coreIdentitySection.content }} />
          </div>
        </div>
      )}
      {planetaryAnalysisSection && (
        <div className="content-section">
          <h2 className="section-header">{planetaryAnalysisSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: planetaryAnalysisSection.content }} />
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
                <div dangerouslySetInnerHTML={{ __html: relationshipMatrixSection.content }} />
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
                <div dangerouslySetInnerHTML={{ __html: compatibilitySection.content }} />
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
            <div dangerouslySetInnerHTML={{ __html: transitSection.content }} />
          </div>
        </div>
      )}
      <div className="page-break" />
      {annualSection && (
        <div className="content-section">
          <h2 className="section-header">{annualSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: annualSection.content }} />
          </div>
        </div>
      )}

      {/* 6. Karmic Work */}
      <div className="page-break" />
      {karmicSection && (
        <div className="content-section">
          <h2 className="section-header">{karmicSection.title || 'Karmic & Shadow Work'}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: karmicSection.content }} />
          </div>
        </div>
      )}

      {/* 7. Closing Blessing */}
      <div className="page-break" />
      {closingSection && (
        <div className="content-section">
          <h2 className="section-header">{closingSection.title}</h2>
          <div className="analysis-block report-text-body">
            <div dangerouslySetInnerHTML={{ __html: closingSection.content }} />
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

