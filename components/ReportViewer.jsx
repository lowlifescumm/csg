"use client";

import { apiClient } from '@/lib/api-client';
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

// Tier-specific configurations matching actual backend section generation in pdf-generator.js
const TIER_CONFIG = {
  ESSENTIAL: {
    label: 'Essential Report',
    colorScheme: 'purple',
    showCover: false,
    showTableOfContents: false,
    sections: ['tarot', 'moon', 'transit', 'closing'],
    tierClass: 'essential-tier',
  },
  ADVANCED: {
    label: 'Advanced Report',
    colorScheme: 'violet',
    showCover: true,
    showTableOfContents: true,
    sections: ['advanced_houses', 'advanced_aspects', 'advanced_career', 'advanced_relationships', 'advanced_life_purpose', 'advanced_financial', 'advanced_health', 'compatibility', 'transit', 'closing'],
    tierClass: 'advanced-tier',
  },
  MASTER: {
    label: 'Master Report',
    colorScheme: 'rose',
    showCover: true,
    showTableOfContents: true,
    sections: ['birth_chart', 'partner_birth_chart', 'compatibility', 'transit', 'annual_forecast', 'saturn_return', 'midlife_transits', 'matrix', 'karmic', 'closing'],
    tierClass: 'master-tier',
  },
  COMPATIBILITY: {
    label: 'Compatibility Report',
    colorScheme: 'violet',
    showCover: true,
    showTableOfContents: true,
    sections: ['compatibility', 'relationship_matrix', 'closing'],
    tierClass: 'compatibility-tier',
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
  matrix: 'Relationship Matrix',
  compatibility: 'Compatibility Analysis',
  annual_forecast: 'Annual Forecast',
  annual: 'Annual Forecast',
  karmic: 'Karmic & Shadow Work',
  closing: 'Closing Blessing',
  advanced_houses: 'Planetary Houses',
  advanced_aspects: 'Aspect Interpretations',
  advanced_career: 'Career Path',
  advanced_relationships: 'Relationship Insights',
  advanced_life_purpose: 'Life Purpose',
  advanced_financial: 'Financial Outlook',
  advanced_health: 'Health & Wellness',
  saturn_return: 'Saturn Return',
  midlife_transits: 'Midlife Transits',
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
  matrix: Layers,
  compatibility: Star,
  annual_forecast: Star,
  annual: Star,
  karmic: Zap,
  closing: BookOpen,
  advanced_houses: Star,
  advanced_aspects: Star,
  advanced_career: Star,
  advanced_relationships: Star,
  advanced_life_purpose: Star,
  advanced_financial: Star,
  advanced_health: Star,
  saturn_return: Star,
  midlife_transits: Star,
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

  // Determine tier info from prop or loaded result
  const normalizedReportType = (result?.reading_type || reportType || '').toUpperCase();
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
    // Give the browser time to start the download before revoking.
    // 1s is too short for large files on slow connections; 30s is safer.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
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
        console.error('[ReportViewer] download error:', err);
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
      const data = await apiClient.get(`/api/jobs/${jobId}`, { timeout: 10000, retry: false });
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
      const data = await apiClient.get(`/api/reports/${resultId}`, { timeout: 30000 });
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
    const isMaster = (normalizedReportType || '').toUpperCase() === 'MASTER';
    return (
      <div className={`cover-page mb-8 rounded-2xl p-8 text-center relative overflow-hidden ${tierColors.coverOverlay}`}>
        <div className="relative z-10">
          {isMaster && (
            <>
              <div className="text-5xl mb-3">🌟</div>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent mx-auto mb-4" />
            </>
          )}
          <div className="text-6xl mb-4">{isMaster ? '🌌' : '✨'}</div>
          <h1 className="text-4xl font-bold text-white mb-2">COSMIC SPIRIT GUIDE</h1>
          <h2 className={`text-2xl font-semibold mb-4 ${isMaster ? 'text-yellow-200' : 'text-yellow-200'}`}>{title}</h2>
          {isMaster && (
            <p className="text-rose-200 text-sm italic mb-3">
              A complete astrological journey through the cosmos
            </p>
          )}
          {result?.completed_at && (
            <p className={`text-sm ${isMaster ? 'text-rose-200' : 'text-purple-200'}`}>
              Completed {new Date(result.completed_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          )}
          {isMaster && (
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent mx-auto mt-4" />
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
    const isChartSection = ['birth_chart', 'partner_birth_chart', 'advanced_houses'].includes(sectionType);
    const isMatrixSection = ['relationship_matrix', 'matrix'].includes(sectionType);
    const isClosingSection = sectionType === 'closing';
    const isSpecial = isChartSection || isMatrixSection || sectionType === 'cover';
    const isExpanded = expandedSections[idx] !== false && (isSpecial || isClosingSection || tierConfig.showTableOfContents);
    const normalizedType = (normalizedReportType || '').toUpperCase();

    // Special: Render chart sections visually
    if (isChartSection && section.chartImage) {
      const isPartner = sectionType === 'partner_birth_chart';
      const dataSource = section.chartDataSource;
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{label}</h3>
            {isPartner && (
              <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Unverified
              </span>
            )}
          </div>
          <div className="p-4 flex justify-center">
            <div
              className="chart-container max-w-full"
              dangerouslySetInnerHTML={{ __html: section.chartImage }}
            />
          </div>
          {isPartner && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                <span>
                  <strong>Data source:</strong>{' '}
                  {dataSource?.label || 'Based on birth data you entered for your partner'}
                  . This chart was calculated from birth data you provided for your partner. The placements shown are astrological calculations based on that data and have not been independently verified by your partner.
                </span>
              </div>
            </div>
          )}
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
    if (isMatrixSection) {
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{label}</h3>
          </div>
          <div className="p-4">
            {section.matrixChartSVG && (
              <div className="flex justify-center mb-6"
                dangerouslySetInnerHTML={{ __html: section.matrixChartSVG }}
              />
            )}
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

    // Closing section - render distinctively per tier
    if (isClosingSection) {
      if (normalizedType === 'MASTER') {
        return (
          <div key={idx} id={`section-${idx}`}
            className={`section-block rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-rose-50 via-white to-pink-50 border-2 ${tierColors.border} shadow-lg`}>
            <div className="px-6 py-5 text-center border-b border-rose-200">
              <div className="text-4xl mb-3">🙏</div>
              <h3 className="text-xl font-bold text-rose-800">{label}</h3>
            </div>
            <div className="px-6 py-5 prose max-w-none">
              <div className="text-gray-700 leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
              />
            </div>
            <div className="px-6 py-3 text-center text-xs text-rose-400 border-t border-rose-200">
              ✦ Master Report · Cosmic Spirit Guide ✦
            </div>
          </div>
        );
      }
      if (normalizedType === 'ADVANCED') {
        return (
          <div key={idx} id={`section-${idx}`}
            className={`section-block rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 border ${tierColors.border}`}>
            <div className="px-5 py-4 border-b border-violet-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💫</span>
                <h3 className="text-lg font-bold text-violet-800">{label}</h3>
              </div>
            </div>
            <div className="px-5 py-4 prose max-w-none">
              <div className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
              />
            </div>
          </div>
        );
      }
      // Essential: simple warm closing without collapsible
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-lg overflow-hidden mb-4 border ${tierColors.border} bg-gradient-to-r from-purple-50 to-pink-50`}>
          <div className="px-4 py-2.5 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="text-base font-semibold text-purple-800">{label}</h3>
            </div>
          </div>
          <div className="px-4 py-3 prose max-w-none">
            <div className="text-gray-700 text-sm"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
            />
          </div>
        </div>
      );
    }

    // Default section rendering with tier-specific layouts
    const isMaster = normalizedType === 'MASTER';
    const isAdvanced = normalizedType === 'ADVANCED';
    const isEssential = normalizedType === 'ESSENTIAL';

    // Master tier: elaborate section with story-like layout
    if (isMaster) {
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-8 border ${tierColors.border} bg-white shadow-sm`}>
          <div className={`px-5 py-4 flex items-center gap-3 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <div className="p-2 rounded-full bg-white/80">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">{label}</h3>
          </div>
          <div className="p-5 prose max-w-none">
            <div className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
            />
          </div>
          {section.summary && (
            <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Key Insight</p>
              <p className="text-sm text-amber-900">{section.summary}</p>
            </div>
          )}
        </div>
      );
    }

    // Advanced tier: structured chapter with section number prefix
    if (isAdvanced) {
      return (
        <div key={idx} id={`section-${idx}`}
          className={`section-block rounded-xl overflow-hidden mb-6 border ${tierColors.border} bg-white`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${tierColors.border} ${tierColors.sectionHeader}`}>
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-bold">{label}</h3>
          </div>
          <div className="px-4 pb-4 prose max-w-none">
            <div className="text-gray-700"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
            />
          </div>
          {section.summary && (
            <div className="mx-4 mb-4 p-2 bg-violet-50 border-l-4 border-violet-400 rounded">
              <p className="text-xs text-violet-700">{section.summary}</p>
            </div>
          )}
        </div>
      );
    }

    // Essential tier: compact card with collapsible content
    return (
      <div key={idx} id={`section-${idx}`}
        className={`section-block rounded-lg overflow-hidden mb-4 border ${tierColors.border} bg-white transition-all duration-300 ${!isExpanded ? 'max-h-[200px] overflow-hidden' : ''}`}>
        <button
          onClick={() => toggleSection(idx)}
          className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 ${tierColors.sectionHeader} hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <h3 className="text-base font-semibold">{label}</h3>
          </div>
          <span className={`transition-transform duration-200 ${isExpanded ? '' : ''}`}>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {isExpanded ? (
          <div className="px-4 py-3 prose max-w-none">
            <div className="text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(getSectionContent(section)) }}
            />
          </div>
        ) : (
          <div className="px-4 pb-2.5 text-sm text-right">
            <span className={`${tierColors.accent} font-medium cursor-pointer hover:underline text-xs`}
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

  // Filter sections by tier configuration. Cover is rendered separately via renderCover().
  const allowedTypes = new Set(tierConfig.sections);
  const displaySections = sections.filter((s) => {
    const t = s.type;
    if (t === 'cover') return false;
    if (allowedTypes.has(t)) return true;
    return false;
  });

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
      {renderTableOfContents(displaySections)}

      {/* Content Sections */}
      <div className="space-y-2">
        {displaySections.length > 0 ? (
          displaySections.map((section, idx) => renderSection(section, idx))
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

      {/* Decorative Divider */}
      <div className={`mt-10 mb-2 text-center text-xs ${tierColors.accent} opacity-40`}>
        {normalizedReportType === 'MASTER' ? '✦ ✦ ✦ End of Master Report ✦ ✦ ✦' :
         normalizedReportType === 'ADVANCED' ? '✦ ✦ ✦ End of Advanced Report ✦ ✦ ✦' :
         '✦ ✦ ✦ End of Report ✦ ✦ ✦'}
      </div>

      {/* Status Badge */}
      <div className="mt-2 pt-4 border-t flex items-center gap-2 text-sm text-gray-500">
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
    'COMPATIBILITY': 'Compatibility Report',
    'transit_forecast_short': 'Short-Term Forecast',
    'transit_forecast_extended': 'Extended Forecast',
    'ESSENTIAL': 'Essential Report',
    'ADVANCED': 'Advanced Report',
    'MASTER': 'Master Report',
  };

  return titles[reportType] || 'Spiritual Reading';
}

// Basic HTML sanitizer for client-side use (strips scripts and event handlers)
function sanitizeClientHtml(html) {
  if (!html) return '';
  return html
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe, object, embed
    .replace(/<(iframe|object|embed|form|input|textarea|button)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove javascript: and data: URLs
    .replace(/(href|src|action)\s*=\s*["']?(?:javascript:|data:text\/html)/gi, '')
    // Remove on* event handlers
    .replace(/\s+on\w+\s*=\s*["']?[^"'>]*/gi, '');
}

// Minimal markdown-to-HTML converter for section content
function convertMarkdownToHtml(text) {
  if (!text) return '';

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

  // Sanitize any embedded HTML (LLM-generated content may contain raw HTML)
  return sanitizeClientHtml(html);
}