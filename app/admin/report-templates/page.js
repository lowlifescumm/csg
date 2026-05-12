'use client';
const logger = require('../../../lib/logger');

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, FileText, Copy, Check, X, Loader2 } from 'lucide-react';

export default function ReportTemplatesAdminPage() {
  const [json, setJson] = useState('');
  const [name, setName] = useState('');
  const [reportType, setReportType] = useState('ESSENTIAL');
  const [ownerId, setOwnerId] = useState('internal');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [showDesigner, setShowDesigner] = useState(false);
  const iframeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchTemplates();
    
    // Listen for messages from embedded designer
    const handleMessage = (event) => {
      // Accept messages from pdfme designer (pdfme.com) or same origin
      // For security, validate origin in production
      const allowedOrigins = [
        window.location.origin,
        'https://pdfme.com',
        'https://www.pdfme.com',
      ];
      
      if (!allowedOrigins.some(origin => event.origin.includes(origin.replace(/^https?:\/\//, '')))) {
        logger.warn('[Template Admin] Rejected message from origin:', event.origin);
        return;
      }
      
      // Handle template JSON from designer
      // pdfme Designer may send: { type: 'pdfme-template', template: {...} }
      // Or the template JSON directly
      if (event.data) {
        try {
          let templateJson;
          
          if (event.data.type === 'pdfme-template' && event.data.template) {
            templateJson = event.data.template;
          } else if (event.data.template) {
            // Direct template object
            templateJson = event.data.template;
          } else if (event.data.schemas || event.data.html || event.data.layout) {
            // Template JSON structure detected
            templateJson = event.data;
          } else {
            // Not a template message, ignore
            return;
          }
          
          setJson(JSON.stringify(templateJson, null, 2));
          setError('');
          logger.info('[Template Admin] Received template from designer');
        } catch (err) {
          logger.error('[Template Admin] Failed to parse template:', err);
          setError('Failed to parse template from designer: ' + err.message);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        if (data.user.role !== 'admin') {
          window.location.href = '/dashboard';
        }
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      logger.error('Auth error:', error);
      window.location.href = '/login';
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      if (response.ok && data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!json.trim()) {
      setError('Template JSON is required');
      return;
    }

    setLoading(true);
    setError('');
    setSaved(false);

    try {
      let templateJson;
      try {
        templateJson = typeof json === 'string' ? JSON.parse(json) : json;
      } catch (parseError) {
        setError('Invalid JSON. Please check the template JSON format.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          template_json: templateJson,
          report_type: reportType,
          owner_id: ownerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaved(true);
        setName('');
        setJson('');
        setReportType('ESSENTIAL');
        setTimeout(() => setSaved(false), 3000);
        fetchTemplates(); // Refresh list
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSampleTemplate = () => {
    const sample = {
      html: `
        <div class="report">
          <h1>{{userName}}'s Astrology Report</h1>
          <div class="chart">
            <h2>Your Sun Sign: {{userSunSign}}</h2>
            <p>{{forecastText}}</p>
          </div>
          <footer>Generated: {{generatedAt}}</footer>
        </div>
      `,
      styles: `
        .report { max-width: 800px; margin: 0 auto; padding: 1in; }
        h1 { color: #1a1a1a; font-size: 24pt; margin-bottom: 0.5em; }
        .chart { background: #f5f5f5; padding: 1em; margin: 1em 0; }
        h2 { font-size: 18pt; margin-bottom: 0.5em; }
        footer { margin-top: 2em; font-size: 10pt; color: #666; }
      `,
    };
    setJson(JSON.stringify(sample, null, 2));
    if (!name) setName('Sample Template');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Templates</h1>
          <p className="text-gray-600">
            Create and manage PDF templates for reports. Use the pdfme Designer to create templates,
            then save them here.
          </p>
        </div>

        {/* Designer Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Designer</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://pdfme.com/designer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open pdfme Designer (New Tab)
            </a>
            <button
              onClick={() => setShowDesigner(!showDesigner)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showDesigner ? 'Hide' : 'Show'} Embedded Designer
            </button>
            <button
              onClick={loadSampleTemplate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Load Sample Template
            </button>
          </div>

          {showDesigner && (
            <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src="https://pdfme.com/designer"
                className="w-full h-[600px]"
                title="pdfme Designer"
              />
            </div>
          )}
        </div>

        {/* Save Template Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Template</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Essential Report Template"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ESSENTIAL">ESSENTIAL</option>
                  <option value="ADVANCED">ADVANCED</option>
                  <option value="MASTER">MASTER</option>
                  <option value="tarot">Tarot</option>
                  <option value="birth_chart">Birth Chart</option>
                  <option value="compatibility">Compatibility</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner ID
                </label>
                <input
                  type="text"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  placeholder="internal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Template JSON *
                </label>
                <button
                  onClick={handleCopy}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                  disabled={!json}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder='Paste template JSON from pdfme Designer here...\n\nExample:\n{\n  "html": "<h1>{{userName}}</h1>",\n  "styles": "h1 { color: #000; }"\n}'
                className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste the exported JSON from the pdfme Designer or use the sample template above.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Template saved successfully!
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading || !name.trim() || !json.trim()}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Templates List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Templates</h2>
          
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates saved yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Report Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{template.id}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(template.id);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="text-purple-600 hover:text-purple-700"
                            title="Copy template ID"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {template.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {template.report_type || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(template.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setJson(JSON.stringify(template.template_json, null, 2));
                            setName(template.name);
                            setReportType(template.report_type || 'ESSENTIAL');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

