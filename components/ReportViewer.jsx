"use client";
const logger = require('../lib/logger');

import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * ReportViewer Component
 * Displays report results with auto-download and download functionality
 */
export default function ReportViewer({ jobId, resultId, reportType, autoDownload = true }) {
  const [job, setJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const hasAutoDownloaded = useRef(false);

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
      // Pop-up blocked; fall back to forcing a download instead
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

        // Prefer direct URLs for PDFs (Cloudinary/S3) to avoid CORS issues
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
          // Unknown content-type – default to generic download
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

  // Poll for job completion
  useEffect(() => {
    if (!jobId || !job) return;
    
    if (job.state === 'succeeded' || job.state === 'failed') {
      return; // Stop polling if job is done
    }
    
    // Poll every 2 seconds while job is processing
    const interval = setInterval(() => {
      fetchJobStatus();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [jobId, job?.state]);

  // Auto-download when result becomes available
  useEffect(() => {
    if (result && result.id && autoDownload && !hasAutoDownloaded.current) {
      // Small delay to ensure UI is ready
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
      // Fetch result directly if we have resultId
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with download buttons */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {getReportTitle(reportType || result.reading_type)}
          </h2>
          {result.completed_at && (
            <p className="text-sm text-gray-500 mt-1">
              Completed {new Date(result.completed_at).toLocaleDateString()}
            </p>
          )}
          {autoDownloaded && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              PDF downloaded automatically
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {(result.download_url || result.id) && (
            <>
              <button
                onClick={() => handleDownload('html')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Report Content Preview */}
      <div className="prose max-w-none">
        {contentJson.sections && Array.isArray(contentJson.sections) ? (
          <div className="space-y-6">
            {contentJson.sections.map((section, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {section.title || section.type || `Section ${idx + 1}`}
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {section.content?.content || section.content || ''}
                </div>
              </div>
            ))}
          </div>
        ) : contentJson.content ? (
          <div className="text-gray-700 whitespace-pre-wrap">
            {contentJson.content}
          </div>
        ) : (
          <p className="text-gray-500 italic">Report content is being processed...</p>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">
            Status: {result.status || 'completed'}
          </span>
        </div>
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

