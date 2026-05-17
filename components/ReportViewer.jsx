"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, FileText, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, Star, Moon, Zap, Eye, Layers } from 'lucide-react';

/**
 * ReportViewer Component
 * Displays report results with tier-specific rendering, auto-download, and download functionality
 *
 * Tier differentiation:
 * - ESSENTIAL: Tarot + Moon + Short Forecast (3 sections, compact)
 * - ADVANCED: Birth Chart + Compatibility + Extended Forecast (structured layout)
 * - MASTER: All sections including cover, charts, matrix, karmic, annual (full e-book layout)
 */

// Tier-specific configurations matching REPORT_RECIPES in premium-pdf-generator.js
const TIER_CONFIG = {
  ESSENTIAL: {
    label: 'Essential Report',
    colorScheme: 'purple',
    showCover: true,
    showTableOfContents: false,
    sections: ['cover', 'tarot', 'moon', 'transit', 'closing'],
    tierClass: 'essential-tier',
  },
  ADVANCED: {
    label: 'Advanced Report',
    colorScheme: 'violet',
    showCover: true,
    showTableOfContents: true,
    sections: ['cover', 'birth_chart', 'core_identity', 'planetary_analysis', 'transit', 'compatibility', 'closing'],
    tierClass: 'advanced-tier',
  },
  MASTER: {
    label: 'Master Report',
    colorScheme: 'rose',
    showCover: true,
    showTableOfContents: true,
    sections: ['cover', 'birth_chart', 'partner_birth_chart', 'core_identity', 'planetary_analysis', 'relationship_matrix', 'compatibility', 'transit', 'annual', 'karmic', 'closing'],
    tierClass: 'master-tier',
  },
};

const TIER_COLORS = {
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    header: 'from-purple-600 to-pink-600',
    accent: 'text-purple-600',
    coverOverlay: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900',
    sectionHeader: 'bg-purple-100 text-purple-800',
  },
  violet: {
    border: 'border-violet-500',
    bg: 'bg-violet-50',
    header: 'from-violet-600 to-indigo-600',
    accent: 'text-violet-600',
    coverOverlay: 'bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900',
    sectionHeader: 'bg-violet-100 text-violet-800',
  },
  rose: {
    border: 'border-rose-500',
    bg: 'bg-rose-50',
    header: 'from-rose-600 to-pink-600',
    accent: 'text-rose-600',
    coverOverlay: 'bg-gradient-to-br from-rose-900 via-pink-900 to-fuchsia-900',
    sectionHeader: 'bg-rose-100 text-rose-800',
  },
};

// Map section types to readable labels (fallback)
const SECTION_LABELS = {
  cover: 'Cover Page',
  tarot: 'Tarot Reading',
  moon: 'Moon Phase Reading',
  transit: 'Short-Term Forecast',
  birth_chart: 'Birth Chart Analysis',
  partner_birth_chart: 'Partner Birth Chart',
  core_identity: 'Core Identity',
  planetary_analysis: 'Planetary Analysis',
  relationship_matrix: 'Relationship Matrix',
  compatibility: 'Compatibility Analysis',
  annual_forecast: 'Annual Forecast',
  annual: 'Annual Forecast',
  karmic: 'Karmic & Shadow Work',
  closing: 'Closing Blessing',
};

// Icons for each section type
const SECTION_ICONS = {
  cover: Eye,
  tarot: BookOpen,
  moon: Moon,
  transit: Star,
  birth_chart: Star,
  partner_birth_chart: Star,
  core_identity: Layers,
  planetary_analysis: Layers,
  relationship_matrix: Layers,
  compatibility: Star,
  annual_forecast: Star,
  annual: Star,
  karmic: Zap,
  closing: BookOpen,
};

export default function ReportViewer({ jobId, resultId, reportType, autoDownload = true }) {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const hasAutoDownloaded = useRef(false);

  // Determine tier info
  const normalizedReportType = (reportType || '').toUpperCase();
  const tierConfig = TIER_CONFIG[normalizedReportType] || TIER_CONFIG.MASTER;
  const tierColors = TIER_COLORS[tierConfig.colorScheme] || TIER_COLORS.purple;

  const triggerBlobDownload = useCallback((blob, filename) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }, []);

  const openHtmlPreview = useCallback((blob) => {
    const htmlUrl = URL.createObjectURL(blob);
    const preview = window.open(htmlUrl, '_blank', 'noopener,noreferrer');
    if (!preview) {
      triggerBlobDownload(blob, 'cosmic-report.html');
    }
    setTimeout(() => URL.revokeObjectURL(htmlUrl), 60_000);
  }, [triggerBlobDownload]);

  const handleDownload = useCallback(
    async (format = 'pdf', silent = false) => {
      if (!result?.id) return;

      try {
        if (!silent) {
          setDownloading(true);
        }

        if (format === 'pdf' && result.download_url) {
          const link = document.createElement('a');
          link.href = result.download_url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }

        const response = await fetch(`/api/reports/${result.id}/download?format=${format}`);

        if (!response.ok) {
          throw new Error('Failed to download report');
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const blob = await response.blob();
        const baseFilename = `cosmic-report-${result.reading_type || reportType || 'reading'}-${result.id}`;

        if (contentType.includes('application/pdf') || format === 'pdf') {
          triggerBlobDownload(blob, `${baseFilename}.pdf`);
        } else if (contentType.includes('text/html')) {
          openHtmlPreview(blob);
        } else {
          triggerBlobDownload(blob, `${baseFilename}.${format === 'html' ? 'html' : 'txt'}`);
        }
      } catch (err) {
        logger.error('[ReportViewer] download error:', err);
        if (!silent) {
          alert(err.message || 'Failed to download report. Please try again.');
        }
      } finally {
        if (!silent) {
          setDownloading(false);
        }
      }
    },
    [result, reportType, triggerBlobDownload, openHtmlPreview]
  );

  useEffect(() => {
    if (jobId) {
      fetchJobStatus();
    } else if (resultId) {
      fetchResult();
    }
  }, [jobId, resultId]);

  useEffect(() => {
    if (!jobId || !job) return;

    if (job.state === 'succeeded' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      fetchJobStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, job?.state]);

  useEffect(() => {
    if (result && result.id && autoDownload && !hasAutoDownloaded.current) {
      const timer = setTimeout(() => {
        handleDownload('pdf', true);
        hasAutoDownloaded.current = true;
        setAutoDownloaded(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [result?.id, autoDownload, handleDownload]);

  const fetchJobStatus = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch job status');
      }

      setJob(data.job);
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/jobs/${resultId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch result');
      }

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Extract safe string content from a section
  const getSectionContent = (section) => {
    if (!section) return '';
    if (typeof section.content === 'string') return section.content;
    if (typeof section.content === 'object' && section.content !== null) {
      return section.content.content || section.content.html || '';
    }
    return '';
  };

  // --- Render Cover Page ---
  const renderCover = () => {
    if (!tierConfig.showCover) return null;
    const title = getReportTitle(normalizedReportType);
    return (
      <div className={`cover-page mb-8 rounded-2xl p-8 text-center relative overflow-hidden ${tierColors.coverOverlay}`}>
        <div className="relative z-10">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-4xl font-bold text-white mb-2">COSMIC SPIRIT GUIDE</h1>
          <h2 className="text-2xl font-semibold text-yellow-200 mb-4">{title}</h2>
          {result?.completed_at && (
            <p className="text-purple-200 text-sm">
              Completed {new Date(result.completed_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          )}
        </div>
        <div className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)`
          }}
        />
      </div>
    );
  };

  // --- Render Table of Contents ---
  const renderTableOfContents = (sections) => {
    if (!tierConfig.showTableOfContents) return null;
    if (!sections || sections.length === 0) return null;

    return (
      <nav className={`toc mb-8 rounded-xl p-6 ${tierColors.bg}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${tierColors.accent}`}>
          <BookOpen className="w-5 h-5" />
          Table of Contents
        </h3>
        <ol className="space-y-2">
          {sections.map((section, idx) => {
            if (section.type === 'cover') return null;
            const label = section.title || SECTION_LABELS[section.type] || `Section ${idx + 1}`;
            return (
              <li key={idx}>
                <button
                  onClick={() => {
                    const el = document.getElementById(`section-${idx}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    toggleSection(idx);
                  }}
                  className={`text-left text-sm hover:underline transition-colors ${tierColors.accent}`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  // --- Render a Single Section with Tier Awareness ---
  const renderSection = (section, idx) => {
    const sectionType = section.type || `section-${idx}`;
    const label = section.title || SECTION_LABELS[sectionType] || `Section ${idx + 1}`;
    const Icon = SECTION_ICONS[sectionType] || FileText;
    const isSpecial = ['birth_chart', 'partner_birth_chart', 'relationship_matrix', 'cover'].includes(sectionType);
    const isExpanded = expandedSections[idx] !== false && (isSpecial || tierConfig.showTableOfContents);

    // Special: Render chart sections visually
    if ((sectionType === 'birth_chart' || sectionType === 'partner_birth_chart') && section.chartImage) {
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{label}</h3>
          </div>
          <div className="p-4 flex justify-center">
            <div
              className="chart-container max-w-full"
              dangerouslySetInnerHTML={{ __html: section.chartImage }}
            />
          </div>
          {section.content && (
            <div className="px-4 pb-4 prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
              />
            </div>
          )}
        </div>
      );
    }

    // Special: Render matrix/relationship section with scores table
    if (sectionType === 'relationship_matrix') {
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{label}</h3>
          </div>
          <div className="p-4">
            {/* Matrix SVG chart */}
            {section.matrixChartSVG && (
              <div className="flex justify-center mb-6"
                dangerouslySetInnerHTML={{ __html: section.matrixChartSVG }}
              />
            )}
            {/* Compatibility scores table */}
            {section.compatibilityScores && (
              <table className="w-full mb-6 border-collapse">
                <thead>
                  <tr className={`border-b-2 ${tierColors.border}`}>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Dimension</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(section.compatibilityScores).map(([key, val]) => (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-2 px-3 capitalize text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="text-right py-2 px-3 font-semibold text-gray-800">{val}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {section.content && (
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default section rendering with collapsible support for long sections
    return (
      <div key={idx} id={`section-${idx}`}
        className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white transition-all duration-300 ${!isExpanded ? 'max-h-[200px] overflow-hidden' : ''}`}>
        <button
          onClick={() => toggleSection(idx)}
          className={`w-full px-4 py-3 flex items-center justify-between gap-2 ${tierColors.sectionHeader} hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{label}</h3>
          </div>
          {isSpecial ? null : (
            <span className="transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}">
              <ChevronDown className="w-5 h-5" />
            </span>
          )}
        </button>
        {isExpanded || isSpecial ? (
          <div className="px-4 pb-4 prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
            />
          </div>
        ) : (
          <div className="px-4 pb-3 text-sm text-right">
            <span className={`${tierColors.accent} font-medium cursor-pointer hover:underline`}
              onClick={(e) => { e.stopPropagation(); toggleSection(idx); }}>
              Read more ▾
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (job && job.state !== 'succeeded' && !result) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>
            {job.progress_message || `Processing... ${job.progress_percent || 0}%`}
          </span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No report available yet.</p>
      </div>
    );
  }

  const contentJson = typeof result.content_json === 'string'
    ? JSON.parse(result.content_json)
    : result.content_json;

  const sections = contentJson?.sections || [];

  // Tier badge for visual identification
  const renderTierBadge = () => (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase
      ${tierConfig.colorScheme === 'rose' ? 'bg-rose-100 text-rose-700' :
        tierConfig.colorScheme === 'violet' ? 'bg-violet-100 text-violet-700' :
        'bg-purple-100 text-purple-700'}`}>
      {tierConfig.label}
    </span>
  );

  return (
    <div className={`report-viewer ${tierConfig.tierClass} max-w-4xl mx-auto`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {getReportTitle(normalizedReportType)}
            {renderTierBadge()}
          </h2>
          {result.completed_at && (
            <p className="text-sm text-gray-500 mt-1">
              Completed {new Date(result.completed_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {(result.download_url || result.id) && (
            <>
              <button
                onClick={() => handleDownload('html')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ background: tierColors.header }}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download HTML
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: tierColors.header }}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {autoDownloaded ? 'Download PDF Again' : 'Download PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cover Page */}
      {renderCover()}

      {/* Table of Contents */}
      {renderTableOfContents(sections)}

      {/* Content Sections */}
      <div className="space-y-2">
        {sections.length > 0 ? (
          sections.map((section, idx) => renderSection(section, idx))
        ) : (
          contentJson.content ? (
            <div className="text-gray-700 whitespace-pre-wrap prose max-w-none">
              {contentJson.content}
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-8">
              Report content is being processed...
            </p>
          )
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-8 pt-4 border-t flex items-center gap-2 text-sm text-gray-500">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span>Status: {result.status || 'completed'}</span>
        <span className="ml-auto text-xs opacity-60">{tierConfig.label}</span>
      </div>
    </div>
  );
}

function getReportTitle(reportType) {
  const titles = {
    'tarot': 'Tarot Reading',
    'moon_reading': 'Moon Phase Reading',
    'birth_chart': 'Birth Chart Analysis',
    'compatibility': 'Compatibility Report',
    'transit_forecast_short': 'Short-Term Forecast',
    'transit_forecast_extended': 'Extended Forecast',
    'ESSENTIAL': 'Essential Report',
    'ADVANCED': 'Advanced Report',
    'MASTER': 'Master Report',
  };

  return titles[reportType] || 'Spiritual Reading';
}

// Minimal markdown-to-HTML converter for section content
function convertMarkdownToHtml(text) {
  if (!text) return '';
  if (/^\s*</.test(text.trim())) return text; // already HTML

  let html = text
    .replace(/^---$/gm, '<hr />')
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/_(?!_)(.*?)_(?!_)/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');

  // Convert double newlines to paragraphs
  html = html.split(/\n\n+/)
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|li|hr)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  return html;
}