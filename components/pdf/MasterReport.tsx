/**
 * Premium Master Report Component
 * Renders a flowing, semantic document structure for PDF generation
 */

import React from 'react';
import '../styles/PrintReport.css';

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
  } = userData;

  // Helper to render section content
  const renderSection = (section: ReportSection, index: number) => {
    return (
      <div key={index} className="content-section">
        <h2 className="section-header">{section.title}</h2>
        <div className="analysis-block">
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
      </div>
    );
  };

  // Find specific sections by type
  const getSectionByType = (type: string): ReportSection | undefined => {
    return sections.find((s) => s.type === type);
  };

  const birthChartSection = getSectionByType('birth_chart');
  const compatibilitySection = getSectionByType('compatibility');
  const transitSection = getSectionByType('transit');
  const destinySection = getSectionByType('destiny_path');
  const karmicSection = getSectionByType('karmic');
  const closingSection = getSectionByType('closing');

  return (
    <div className="master-report">
      {/* Cover Page */}
      <div className="cover-page">
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

      {/* Birth Chart Section */}
      {birthChartSection && (
        <div className="content-section">
          <h2 className="section-header">Your Natal Chart</h2>
          <p style={{ textAlign: 'center', marginBottom: '10mm' }}>
            A map of the heavens at the exact moment you took your first breath.
          </p>

          {birthChartSvg && (
            <div className="chart-container">
              <div dangerouslySetInnerHTML={{ __html: birthChartSvg }} />
            </div>
          )}

          {(sunSign || moonSign || risingSign) && (
            <div
              className="metadata"
              style={{ textAlign: 'center', marginTop: '10mm' }}
            >
              <p>
                <strong>Sun:</strong> {sunSign || 'N/A'} •{' '}
                <strong>Moon:</strong> {moonSign || 'N/A'} •{' '}
                <strong>Rising:</strong> {risingSign || 'N/A'}
              </p>
            </div>
          )}

          <div className="analysis-block" style={{ marginTop: '10mm' }}>
            <div dangerouslySetInnerHTML={{ __html: birthChartSection.content }} />
          </div>
        </div>
      )}

      {/* Compatibility Section */}
      {compatibilitySection && (
        <div className="content-section">
          <h2 className="section-header">Compatibility Analysis</h2>

          {compatibilityChartSvg && (
            <div className="chart-container">
              <div dangerouslySetInnerHTML={{ __html: compatibilityChartSvg }} />
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

          <div className="analysis-block" style={{ marginTop: '10mm' }}>
            <div dangerouslySetInnerHTML={{ __html: compatibilitySection.content }} />
          </div>
        </div>
      )}

      {/* Transit Forecast Section */}
      {transitSection && (
        <div className="content-section">
          <h2 className="section-header">Extended Transit Forecast</h2>
          <div className="analysis-block">
            <div dangerouslySetInnerHTML={{ __html: transitSection.content }} />
          </div>
        </div>
      )}

      {/* Destiny Path Section */}
      {destinySection && (
        <div className="content-section">
          <h2 className="section-header">{destinySection.title}</h2>
          <div className="analysis-block">
            <div dangerouslySetInnerHTML={{ __html: destinySection.content }} />
          </div>
        </div>
      )}

      {/* Karmic Reading Section */}
      {karmicSection && (
        <div className="content-section">
          <h2 className="section-header">Karmic & Shadow Work</h2>
          <div className="analysis-block">
            <div dangerouslySetInnerHTML={{ __html: karmicSection.content }} />
          </div>
        </div>
      )}

      {/* Closing Blessing */}
      {closingSection && (
        <div className="content-section">
          <h2 className="section-header">{closingSection.title}</h2>
          <div className="analysis-block">
            <div dangerouslySetInnerHTML={{ __html: closingSection.content }} />
          </div>
        </div>
      )}

      {/* Render any additional sections */}
      {sections
        .filter(
          (s) =>
            !['birth_chart', 'compatibility', 'transit', 'destiny_path', 'karmic', 'closing'].includes(
              s.type
            )
        )
        .map((section, index) => renderSection(section, index + 100))}
    </div>
  );
};

export default MasterReport;

