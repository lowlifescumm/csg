'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Loader2, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';

const REPORT_LABELS = {
  ESSENTIAL: 'Essential Report',
  ADVANCED: 'Advanced Report',
  MASTER: 'Master Report',
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-green-400', label: 'Completed' },
  generating: { icon: Loader2, color: 'text-blue-400', label: 'Generating...' },
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
};

export default function PremiumReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
      })
      .catch(() => {
        setReports([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  if (reports.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold gradient-text">My Premium Reports</h2>
      </div>
      <div className="space-y-3">
        {reports.map((report) => {
          const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusConf.icon;
          return (
            <div
              key={report.purchaseId}
              className="glassmorphic rounded-xl p-4 border border-white/20 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      {REPORT_LABELS[report.reportType] || report.reportType}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusIcon className={`w-3.5 h-3.5 ${statusConf.color}`} />
                      <span className={`text-xs ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                      {report.completedAt && (
                        <span className="text-xs text-purple-300">
                          {new Date(report.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {report.viewUrl && report.status === 'completed' && (
                    <Link
                      href={report.viewUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  )}
                  {report.downloadUrl && report.status === 'completed' && (
                    <a
                      href={report.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
              {report.status === 'generating' && report.progressMessage && (
                <p className="text-xs text-purple-300 mt-2 ml-[52px]">
                  {report.progressMessage}
                </p>
              )}
              {report.status === 'failed' && report.errorMessage && (
                <p className="text-xs text-red-400 mt-2 ml-[52px]">
                  {report.errorMessage}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
