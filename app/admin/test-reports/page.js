const logger = require('../../lib/logger');
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PremiumReportInputForm from "@/components/PremiumReportInputForm";
import {
  ArrowLeft,
  FileText,
  Moon,
  Calendar,
  Heart,
  Sparkles,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  BookOpen,
  Star,
  Zap,
} from "lucide-react";

const REPORT_TYPES = [
  {
    id: "tarot",
    name: "Tarot Reading",
    icon: BookOpen,
    color: "from-purple-500 to-pink-500",
    description: "Test tarot card interpretation",
  },
  {
    id: "moon_reading",
    name: "Moon Reading",
    icon: Moon,
    color: "from-blue-500 to-cyan-500",
    description: "Test moon phase reading",
  },
  {
    id: "birth_chart",
    name: "Birth Chart",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
    description: "Test full natal chart analysis",
  },
  {
    id: "compatibility",
    name: "Compatibility Report",
    icon: Heart,
    color: "from-pink-500 to-red-500",
    description: "Test relationship compatibility",
  },
  {
    id: "transit_forecast_short",
    name: "Short Transit Forecast",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    description: "Test 7-14 day forecast",
  },
  {
    id: "transit_forecast_extended",
    name: "Extended Transit Forecast",
    icon: Calendar,
    color: "from-indigo-500 to-purple-500",
    description: "Test 30-90 day forecast",
  },
  {
    id: "ESSENTIAL",
    name: "Essential Premium Report",
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    description: "Tarot + Moon + Short Forecast ($49)",
    premium: true,
  },
  {
    id: "ADVANCED",
    name: "Advanced Premium Report",
    icon: Sparkles,
    color: "from-violet-500 to-purple-500",
    description: "Birth Chart + Compatibility + Forecast ($149)",
    premium: true,
  },
  {
    id: "MASTER",
    name: "Master Premium Report",
    icon: FileText,
    color: "from-rose-500 to-pink-500",
    description: "All sections including Destiny Path ($249)",
    premium: true,
  },
];

const SAMPLE_DATA = {
  tarot: {
    name: "Test User",
    card_spread: [
      { card: "The High Priestess", position: "Present", orientation: "Upright" },
      { card: "The Tower", position: "Challenge", orientation: "Reversed" },
      { card: "The Star", position: "Future", orientation: "Upright" },
    ],
  },
  moon_reading: {
    name: "Test User",
    moon_phase: "Waxing Crescent",
    phase_energy: "Growth and intention setting",
    sun_sign: "Gemini",
    moon_sign: "Pisces",
  },
  birth_chart: {
    name: "Test User",
    birth_date: "1980-03-09",
    birth_time: "16:21",
    location: "Santa Cruz, CA",
    latitude: 36.9741,
    longitude: -122.0308,
    sun: "Gemini",
    moon: "Pisces",
    rising: "Sagittarius",
    planets: {},
    houses: {},
    aspects: [],
  },
  compatibility: {
    user: {
      name: "Person One",
      birth_date: "1990-05-21",
      birth_time: "09:45",
      location: "New York, NY",
    },
    partner: {
      name: "Person Two",
      birth_date: "1992-11-12",
      birth_time: "18:30",
      location: "Los Angeles, CA",
    },
    aspects: [],
    compatibility_score: 82,
  },
  transit_forecast_short: {
    name: "Test User",
    date_range: "Feb 4–Feb 18, 2025",
    transits: [
      { aspect: "Mars trine Sun", date: "Feb 6", description: "Energy boost" },
      { aspect: "Mercury square Saturn", date: "Feb 9", description: "Communication challenges" },
    ],
  },
  transit_forecast_extended: {
    name: "Test User",
    date_range: "Feb 1–Apr 30, 2025",
    transits: [
      { aspect: "Mars trine Sun", date: "Feb 6" },
      { aspect: "Saturn return begins", date: "Mar 15" },
    ],
  },
  ESSENTIAL: {
    name: "Test User",
    birth_chart_data: {
      name: "Test User",
      birth_date: "1990-01-15",
      birth_time: "14:30",
      location: "New York, USA",
      // All other fields (sun, moon, rising, tarot, moon phase, transits) will be calculated server-side
    },
  },
  ADVANCED: {
    name: "Test User",
    birth_chart_data: {
      name: "Test User",
      birth_date: "1980-03-09",
      birth_time: "16:21",
      location: "Santa Cruz, CA",
      latitude: 36.9741,
      longitude: -122.0308,
      sun: "Gemini",
      moon: "Pisces",
      rising: "Sagittarius",
      planets: {},
      houses: {},
      aspects: [],
    },
    compatibility_data: {
      user: {
        name: "Person One",
        birth_date: "1990-05-21",
        birth_time: "09:45",
        location: "New York, NY",
      },
      partner: {
        name: "Person Two",
        birth_date: "1992-11-12",
        birth_time: "18:30",
        location: "Los Angeles, CA",
      },
      aspects: [],
      compatibility_score: 82,
    },
    transit_data: {
      name: "Test User",
      date_range: "Feb 1–Apr 30, 2025",
      transits: [],
    },
  },
  MASTER: {
    name: "Test User",
    birth_chart_data: {
      name: "Test User",
      birth_date: "1980-03-09",
      birth_time: "16:21",
      location: "Santa Cruz, CA",
      latitude: 36.9741,
      longitude: -122.0308,
      sun: "Gemini",
      moon: "Pisces",
      rising: "Sagittarius",
      planets: {},
      houses: {},
      aspects: [],
    },
    compatibility_data: {
      user: {
        name: "Person One",
        birth_date: "1990-05-21",
        birth_time: "09:45",
        location: "New York, NY",
      },
      partner: {
        name: "Person Two",
        birth_date: "1992-11-12",
        birth_time: "18:30",
        location: "Los Angeles, CA",
      },
      aspects: [],
      compatibility_score: 82,
    },
    transit_data: {
      name: "Test User",
      date_range: "Feb 1–Apr 30, 2025",
      transits: [],
    },
    destiny_data: {
      cycle_name: "Saturn Return",
      start_date: "2024-07-01",
      end_date: "2026-02-14",
      themes: ["Responsibility", "Transformation"],
    },
    matrix_data: {
      pair: {
        user: { sun: "Gemini" },
        partner: { sun: "Scorpio" },
      },
      matrix_scores: {
        emotional: 78,
        communication: 64,
        spiritual: 85,
        stability: 71,
        physical: 88,
      },
    },
    karmic_data: {
      placements: {},
      aspects: [],
      nodes: { north_node: "Aries", south_node: "Libra" },
    },
  },
};

export default function TestReportsPage() {
  const router = useRouter();
  const [testing, setTesting] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewingContent, setViewingContent] = useState(false);
  const [customDataInputs, setCustomDataInputs] = useState({});
  const [customDataMap, setCustomDataMap] = useState({});
  const [editingReport, setEditingReport] = useState(null);
  const [customDataError, setCustomDataError] = useState(null);
  const [formData, setFormData] = useState({});
  const [engine, setEngine] = useState('puppeteer');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  // Location geocoding state for compatibility form
  const [locationCoords, setLocationCoords] = useState({});
  const [geocoding, setGeocoding] = useState({ user: false, partner: false });
  const [locationErrors, setLocationErrors] = useState({ user: '', partner: '' });

  // Fetch templates when component mounts or engine changes
  const fetchTemplates = async () => {
    if (engine === 'template') {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/admin/templates');
        const data = await response.json();
        if (response.ok && data.templates) {
          setTemplates(data.templates);
        }
      } catch (error) {
        logger.error('Failed to fetch templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    }
  };

  // Load templates when engine is set to 'template'
  useEffect(() => {
    if (engine === 'template') {
      fetchTemplates();
    }
  }, [engine]);

  const handleTestReport = async (reportType) => {
    setTesting(reportType);
    setResult(null);
    setError(null);
    setViewingContent(false);

    try {
      let parsedCustomData = null;
      if (customDataMap[reportType]) {
        parsedCustomData = customDataMap[reportType];
      }

      // Build query params for engine selection
      const queryParams = new URLSearchParams();
      if (engine === 'template') {
        queryParams.set('engine', 'template');
        if (templateId) {
          queryParams.set('templateId', templateId);
        }
      } else if (engine === 'premium') {
        queryParams.set('engine', 'premium');
      }

      const response = await fetch(`/api/admin/test-report?${queryParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_type: reportType,
          generate_html: true,
          generate_pdf: true,
          ...(parsedCustomData ? { data: parsedCustomData } : {}),
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/pdf')) {
        // Handle PDF response - download as blob
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `test-report-${reportType}-${new Date().toISOString()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setTesting(null);
        return;
      } else if (contentType.includes('text/html')) {
        // Handle HTML response - open in new window
        const html = await response.text();
        const win = window.open();
        if (win) {
          win.document.write(html);
          win.document.close();
        } else {
          setError('Popup blocked. Please allow popups for this site to view HTML reports.');
        }
        setTesting(null);
        return;
      } else if (contentType.includes('application/json')) {
        // Handle JSON response - parse and handle success/error
        const data = await response.json();

        if (response.ok) {
          setResult({
            reportType,
            ...data,
          });
          
          // Auto-download PDF if available
          if (data.pdfUrl) {
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = data.pdfUrl;
              link.download = `test-report-${reportType}-${new Date().toISOString()}.pdf`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, 500);
          }
        } else {
          setError(data.error || "Failed to generate report");
        }
      } else {
        // Unknown content type - try to parse as text
        const text = await response.text();
        setError(`Unexpected response type: ${contentType}. Response: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setTesting(null);
    }
  };

  const downloadReport = () => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${result.reportType}-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    if (!result?.html) return;

    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${result.reportType}-${new Date().toISOString()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    if (!result?.pdfUrl && !result?.html) return;

    try {
      // If PDF URL exists, download directly
      if (result.pdfUrl) {
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = `test-report-${result.reportType}-${new Date().toISOString()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Otherwise, trigger PDF generation via API
      const response = await fetch(`/api/admin/test-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: result.reportType,
          generate_pdf: true,
          regenerate: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.pdfUrl) {
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `test-report-${result.reportType}-${new Date().toISOString()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('PDF generation failed. Please try again.');
      }
    } catch (err) {
      logger.error('PDF download error:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const openCustomDataEditor = (reportId) => {
    // For premium reports (ADVANCED, MASTER), use the simplified input form
    if (reportId === 'ADVANCED' || reportId === 'MASTER') {
      // Initialize with sample data if available
      if (!formData[reportId]) {
        const sample = SAMPLE_DATA[reportId] || {};
        setFormData((prev) => ({
          ...prev,
          [reportId]: {
            name: sample.name || sample.birth_chart_data?.name || '',
            birthDate: sample.birth_chart_data?.birth_date || '',
            birthTime: sample.birth_chart_data?.birth_time || '',
            birthCity: sample.birth_chart_data?.location || '',
            partnerName: sample.compatibility_data?.partner?.name || '',
            partnerBirthDate: sample.compatibility_data?.partner?.birth_date || '',
            partnerBirthTime: sample.compatibility_data?.partner?.birth_time || '',
            partnerBirthCity: sample.compatibility_data?.partner?.location || '',
          },
        }));
      }
      setCustomDataError(null);
      setEditingReport(reportId);
      return;
    }

    // For other reports, use the old form system
    if (!formData[reportId]) {
      const sample = SAMPLE_DATA[reportId] || SAMPLE_DATA[reportId?.toUpperCase()] || {};
      setFormData((prev) => ({
        ...prev,
        [reportId]: initializeFormData(reportId, sample),
      }));
    }
    setCustomDataError(null);
    setEditingReport(reportId);
  };

  const initializeFormData = (reportId, sample) => {
    // Return flattened form data structure based on report type
    if (reportId === 'tarot') {
      return {
        name: sample.name || '',
        cards: sample.card_spread || [{ card: '', position: '', orientation: 'Upright' }],
      };
    } else if (reportId === 'moon_reading') {
      return {
        name: sample.name || '',
        moon_phase: sample.moon_phase || '',
        phase_energy: sample.phase_energy || '',
        sun_sign: sample.sun_sign || '',
        moon_sign: sample.moon_sign || '',
      };
    } else if (reportId === 'birth_chart') {
      return {
        name: sample.name || '',
        birth_date: sample.birth_date || '',
        birth_time: sample.birth_time || '',
        location: sample.location || '',
        latitude: sample.latitude || '',
        longitude: sample.longitude || '',
        sun: sample.sun || '',
        moon: sample.moon || '',
        rising: sample.rising || '',
      };
    } else if (reportId === 'compatibility') {
      return {
        user_name: sample.user?.name || '',
        user_birth_date: sample.user?.birth_date || '',
        user_birth_time: sample.user?.birth_time || '',
        user_location: sample.user?.location || '',
        partner_name: sample.partner?.name || '',
        partner_birth_date: sample.partner?.birth_date || '',
        partner_birth_time: sample.partner?.birth_time || '',
        partner_location: sample.partner?.location || '',
        compatibility_score: sample.compatibility_score || 0,
      };
    } else if (reportId === 'transit_forecast_short' || reportId === 'transit_forecast_extended') {
      return {
        name: sample.name || '',
        date_range: sample.date_range || '',
        transits: sample.transits || [{ aspect: '', date: '', description: '' }],
      };
    } else if (reportId === 'ESSENTIAL') {
      return {
        name: sample.name || '',
        birthDate: sample.birth_chart_data?.birth_date || '',
        birthTime: sample.birth_chart_data?.birth_time || '',
        birthCity: sample.birth_chart_data?.location || '',
      };
    } else if (reportId === 'ADVANCED') {
      return {
        name: sample.name || '',
        birth_name: sample.birth_chart_data?.name || '',
        birth_date: sample.birth_chart_data?.birth_date || '',
        birth_time: sample.birth_chart_data?.birth_time || '',
        birth_location: sample.birth_chart_data?.location || '',
        birth_latitude: sample.birth_chart_data?.latitude || '',
        birth_longitude: sample.birth_chart_data?.longitude || '',
        birth_sun: sample.birth_chart_data?.sun || '',
        birth_moon: sample.birth_chart_data?.moon || '',
        birth_rising: sample.birth_chart_data?.rising || '',
        user_name: sample.compatibility_data?.user?.name || '',
        user_birth_date: sample.compatibility_data?.user?.birth_date || '',
        user_birth_time: sample.compatibility_data?.user?.birth_time || '',
        user_location: sample.compatibility_data?.user?.location || '',
        partner_name: sample.compatibility_data?.partner?.name || '',
        partner_birth_date: sample.compatibility_data?.partner?.birth_date || '',
        partner_birth_time: sample.compatibility_data?.partner?.birth_time || '',
        partner_location: sample.compatibility_data?.partner?.location || '',
        compatibility_score: sample.compatibility_data?.compatibility_score || 0,
        transit_name: sample.transit_data?.name || '',
        transit_date_range: sample.transit_data?.date_range || '',
      };
    } else if (reportId === 'MASTER') {
      return {
        name: sample.name || '',
        birth_name: sample.birth_chart_data?.name || '',
        birth_date: sample.birth_chart_data?.birth_date || '',
        birth_time: sample.birth_chart_data?.birth_time || '',
        birth_location: sample.birth_chart_data?.location || '',
        birth_latitude: sample.birth_chart_data?.latitude || '',
        birth_longitude: sample.birth_chart_data?.longitude || '',
        birth_sun: sample.birth_chart_data?.sun || '',
        birth_moon: sample.birth_chart_data?.moon || '',
        birth_rising: sample.birth_chart_data?.rising || '',
        user_name: sample.compatibility_data?.user?.name || '',
        user_birth_date: sample.compatibility_data?.user?.birth_date || '',
        user_birth_time: sample.compatibility_data?.user?.birth_time || '',
        user_location: sample.compatibility_data?.user?.location || '',
        partner_name: sample.compatibility_data?.partner?.name || '',
        partner_birth_date: sample.compatibility_data?.partner?.birth_date || '',
        partner_birth_time: sample.compatibility_data?.partner?.birth_time || '',
        partner_location: sample.compatibility_data?.partner?.location || '',
        // compatibility_score will be calculated from birth charts
        transit_name: sample.transit_data?.name || '',
        transit_date_range: sample.transit_data?.date_range || '',
        destiny_cycle_name: sample.destiny_data?.cycle_name || '',
        destiny_start_date: sample.destiny_data?.start_date || '',
        destiny_end_date: sample.destiny_data?.end_date || '',
        // matrix_user_sun, matrix_partner_sun, and matrix scores will be calculated from birth data
        karmic_north_node: sample.karmic_data?.nodes?.north_node || '',
        karmic_south_node: sample.karmic_data?.nodes?.south_node || '',
      };
    }
    return {};
  };

  const buildDataFromForm = (reportId, formValues) => {
    // Build the data object from form values
    if (reportId === 'tarot') {
      return {
        name: formValues.name || 'Test User',
        card_spread: formValues.cards || [],
      };
    } else if (reportId === 'moon_reading') {
      return {
        name: formValues.name || 'Test User',
        moon_phase: formValues.moon_phase || '',
        phase_energy: formValues.phase_energy || '',
        // sun_sign, moon_sign will be calculated from birth data
      };
    } else if (reportId === 'birth_chart') {
      return {
        name: formValues.name || 'Test User',
        birth_date: formValues.birth_date || '',
        birth_time: formValues.birth_time || '',
        location: formValues.location || '',
        latitude: parseFloat(formValues.latitude) || 0,
        longitude: parseFloat(formValues.longitude) || 0,
        // sun, moon, rising will be calculated from birth data
        planets: {},
        houses: {},
        aspects: [],
      };
    } else if (reportId === 'compatibility') {
      // Include coordinates if available
      const userCoords = locationCoords.user;
      const partnerCoords = locationCoords.partner;
      
      return {
        user: {
          name: formValues.user_name || 'Person One',
          birth_date: formValues.user_birth_date || '',
          birth_time: formValues.user_birth_time || '',
          location: formValues.user_location || '',
          latitude: userCoords?.latitude,
          longitude: userCoords?.longitude,
        },
        partner: {
          name: formValues.partner_name || 'Person Two',
          birth_date: formValues.partner_birth_date || '',
          birth_time: formValues.partner_birth_time || '',
          location: formValues.partner_location || '',
          latitude: partnerCoords?.latitude,
          longitude: partnerCoords?.longitude,
        },
        aspects: [],
        // compatibility_score will be calculated from birth charts
      };
    } else if (reportId === 'transit_forecast_short' || reportId === 'transit_forecast_extended') {
      return {
        name: formValues.name || 'Test User',
        date_range: formValues.date_range || '',
        transits: formValues.transits || [],
      };
    } else if (reportId === 'ESSENTIAL') {
      // Only submit birth data - all other fields will be calculated by backend
      return {
        name: formValues.name || 'Test User',
        birthDate: formValues.birthDate || '',
        birthTime: formValues.birthTime || '',
        birthCity: formValues.birthCity || '',
      };
    } else if (reportId === 'ADVANCED') {
      return {
        name: formValues.name || 'Test User',
        birth_chart_data: {
          name: formValues.birth_name || formValues.name || 'Test User',
          birth_date: formValues.birth_date || '',
          birth_time: formValues.birth_time || '',
          location: formValues.birth_location || '',
          latitude: parseFloat(formValues.birth_latitude) || 0,
          longitude: parseFloat(formValues.birth_longitude) || 0,
          // sun, moon, rising will be calculated from birth data
          planets: {},
          houses: {},
          aspects: [],
        },
        compatibility_data: {
          user: {
            name: formValues.user_name || 'Person One',
            birth_date: formValues.user_birth_date || '',
            birth_time: formValues.user_birth_time || '',
            location: formValues.user_location || '',
          },
          partner: {
            name: formValues.partner_name || 'Person Two',
            birth_date: formValues.partner_birth_date || '',
            birth_time: formValues.partner_birth_time || '',
            location: formValues.partner_location || '',
          },
          aspects: [],
          // compatibility_score will be calculated from birth charts
        },
        transit_data: {
          name: formValues.transit_name || formValues.name || 'Test User',
          date_range: formValues.transit_date_range || '',
          transits: [],
        },
      };
    } else if (reportId === 'MASTER') {
      return {
        name: formValues.name || 'Test User',
        birth_chart_data: {
          name: formValues.birth_name || formValues.name || 'Test User',
          birth_date: formValues.birth_date || '',
          birth_time: formValues.birth_time || '',
          location: formValues.birth_location || '',
          latitude: parseFloat(formValues.birth_latitude) || 0,
          longitude: parseFloat(formValues.birth_longitude) || 0,
          // sun, moon, rising will be calculated from birth data
          planets: {},
          houses: {},
          aspects: [],
        },
        compatibility_data: {
          user: {
            name: formValues.user_name || 'Person One',
            birth_date: formValues.user_birth_date || '',
            birth_time: formValues.user_birth_time || '',
            location: formValues.user_location || '',
          },
          partner: {
            name: formValues.partner_name || 'Person Two',
            birth_date: formValues.partner_birth_date || '',
            birth_time: formValues.partner_birth_time || '',
            location: formValues.partner_location || '',
          },
          aspects: [],
          // compatibility_score will be calculated from birth charts
        },
        transit_data: {
          name: formValues.transit_name || formValues.name || 'Test User',
          date_range: formValues.transit_date_range || '',
          transits: [],
        },
        destiny_data: {
          cycle_name: formValues.destiny_cycle_name || 'Saturn Return',
          start_date: formValues.destiny_start_date || '',
          end_date: formValues.destiny_end_date || '',
          themes: ['Responsibility', 'Transformation'],
        },
        matrix_data: {
          pair: {
            // user and partner sun signs will be calculated from birth data
          },
          matrix_scores: {
            // matrix scores will be calculated from birth charts
          },
        },
        karmic_data: {
          placements: {},
          aspects: [],
          nodes: {
            north_node: formValues.karmic_north_node || 'Aries',
            south_node: formValues.karmic_south_node || 'Libra',
          },
        },
      };
    }
    return {};
  };

  const handleSaveCustomData = () => {
    if (!editingReport) return;
    
    // For premium reports, data is saved via PremiumReportInputForm onSubmit
    // This function is only for non-premium reports
    if (editingReport === 'ADVANCED' || editingReport === 'MASTER') {
      return;
    }
    
    const currentFormData = formData[editingReport] || {};
    
    // Validate required fields based on report type
    const validationErrors = validateFormData(editingReport, currentFormData);
    
    if (validationErrors.length > 0) {
      setCustomDataError(validationErrors.join(', '));
      return;
    }
    
    // Build data object from form
    const builtData = buildDataFromForm(editingReport, currentFormData);
    
    setCustomDataMap((prev) => ({
      ...prev,
      [editingReport]: builtData,
    }));
    setCustomDataError(null);
    setEditingReport(null);
  };

  const handlePremiumReportSubmit = (inputData) => {
    if (!editingReport) return;

    // Build the data structure expected by the report generator
    // This converts raw inputs to the format needed for report generation
    const builtData = {
      name: inputData.name,
      birth_chart_data: {
        name: inputData.name,
        birth_date: inputData.birthDate,
        birth_time: inputData.birthTime,
        location: inputData.birthCity,
        latitude: inputData.birthLatitude,
        longitude: inputData.birthLongitude,
        // These will be calculated server-side
        sun: '',
        moon: '',
        rising: '',
        planets: {},
        houses: {},
        aspects: [],
      },
    };

    // Add compatibility data if partner info is provided
    if (inputData.partnerName && inputData.partnerBirthDate && inputData.partnerBirthTime && inputData.partnerBirthCity) {
      builtData.compatibility_data = {
        user: {
          name: inputData.name,
          birth_date: inputData.birthDate,
          birth_time: inputData.birthTime,
          location: inputData.birthCity,
        },
        partner: {
          name: inputData.partnerName,
          birth_date: inputData.partnerBirthDate,
          birth_time: inputData.partnerBirthTime,
          location: inputData.partnerBirthCity,
        },
        aspects: [],
        compatibility_score: 0, // Will be calculated server-side
      };
    }

    // Add transit data (will be calculated server-side)
    builtData.transit_data = {
      name: inputData.name,
      date_range: '',
      transits: [],
    };

    // Add MASTER-specific data (will be calculated server-side)
    if (editingReport === 'MASTER') {
      builtData.destiny_data = {
        cycle_name: '',
        start_date: '',
        end_date: '',
        themes: [],
      };
      builtData.matrix_data = {
        pair: {
          user: { sun: '' },
          partner: { sun: '' },
        },
        matrix_scores: {
          emotional: 0,
          communication: 0,
          spiritual: 0,
          stability: 0,
          physical: 0,
        },
      };
      builtData.karmic_data = {
        placements: {},
        aspects: [],
        nodes: {
          north_node: '',
          south_node: '',
        },
      };
    }

    // Save to custom data map
    setCustomDataMap((prev) => ({
      ...prev,
      [editingReport]: builtData,
    }));
    setCustomDataError(null);
    setEditingReport(null);
  };

  const validateFormData = (reportId, formValues) => {
    // Premium reports (ESSENTIAL, ADVANCED, MASTER) use PremiumReportInputForm which handles its own validation
    if (reportId === 'ESSENTIAL' || reportId === 'ADVANCED' || reportId === 'MASTER') {
      return [];
    }

    const errors = [];
    
    if (reportId === 'birth_chart') {
      if (!formValues.birth_date) errors.push('Birth date is required');
      if (!formValues.birth_time) errors.push('Birth time is required');
      if (!formValues.latitude || isNaN(parseFloat(formValues.latitude))) errors.push('Valid latitude is required');
      if (!formValues.longitude || isNaN(parseFloat(formValues.longitude))) errors.push('Valid longitude is required');
    }
    
    if (reportId === 'compatibility') {
      if (!formValues.user_birth_date) errors.push('User birth date is required');
      if (!formValues.user_birth_time) errors.push('User birth time is required');
      if (!formValues.partner_birth_date) errors.push('Partner birth date is required');
      if (!formValues.partner_birth_time) errors.push('Partner birth time is required');
      const score = parseInt(formValues.compatibility_score);
      if (isNaN(score) || score < 0 || score > 100) errors.push('Compatibility score must be between 0-100');
    }
    
    return errors;
  };

  const handleRemoveCustomData = (reportId) => {
    setCustomDataMap((prev) => {
      const updated = { ...prev };
      delete updated[reportId];
      return updated;
    });
    setCustomDataInputs((prev) => {
      const updated = { ...prev };
      delete updated[reportId];
      return updated;
    });
    setFormData((prev) => {
      const updated = { ...prev };
      delete updated[reportId];
      return updated;
    });
    if (editingReport === reportId) {
      setEditingReport(null);
      setCustomDataError(null);
    }
    // Clear location coordinates when removing custom data
    setLocationCoords({});
    setLocationErrors({ user: '', partner: '' });
  };

  // Geocode location for compatibility form
  const geocodeLocation = async (location, type) => {
    if (!location || location.trim() === '') {
      setLocationErrors(prev => ({ ...prev, [type]: 'Location is required' }));
      return null;
    }

    setGeocoding(prev => ({ ...prev, [type]: true }));
    setLocationErrors(prev => ({ ...prev, [type]: '' }));

    try {
      // Try Google Maps Geocoding API first
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (googleApiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            const coords = {
              latitude: loc.lat,
              longitude: loc.lng
            };
            setLocationCoords(prev => ({ ...prev, [type]: coords }));
            setLocationErrors(prev => ({ ...prev, [type]: '' }));
            setGeocoding(prev => ({ ...prev, [type]: false }));
            return coords;
          }
        }
      }

      // Fallback to OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'CosmicSpiritualGuide/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const coords = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          };
          setLocationCoords(prev => ({ ...prev, [type]: coords }));
          setLocationErrors(prev => ({ ...prev, [type]: '' }));
          setGeocoding(prev => ({ ...prev, [type]: false }));
          return coords;
        }
      }

      // All services failed
      setLocationErrors(prev => ({ 
        ...prev, 
        [type]: `Could not find "${location}". Please try a major city name (e.g., "New York, USA" or "London, UK")` 
      }));
      setGeocoding(prev => ({ ...prev, [type]: false }));
      return null;
    } catch (error) {
      logger.error(`Geocoding error for ${type}:`, error);
      setLocationErrors(prev => ({ 
        ...prev, 
        [type]: 'Geocoding service unavailable. Please try again.' 
      }));
      setGeocoding(prev => ({ ...prev, [type]: false }));
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Test Report Generation</h1>
                <p className="text-gray-600">Generate and verify report quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Engine & Template Selection */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">PDF Generation Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engine
              </label>
              <select
                value={engine}
                onChange={(e) => {
                  setEngine(e.target.value);
                  if (e.target.value === 'template') {
                    fetchTemplates();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="puppeteer">Puppeteer (Default HTML)</option>
                <option value="template">Template Engine (pdfme)</option>
                <option value="premium">Premium E-book Generator (React + Print CSS)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {engine === 'puppeteer' 
                  ? 'Uses the standard HTML-to-PDF pipeline'
                  : engine === 'template'
                  ? 'Uses WYSIWYG templates from the template library'
                  : 'Uses React component with premium print styling'}
              </p>
            </div>
            
            {engine === 'template' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template (Optional - auto-selects if not specified)
                </label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading templates...
                  </div>
                ) : (
                  <>
                    <select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Auto-select (use default for report type)</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.report_type || 'N/A'})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to auto-select a template for the report type, or choose a specific template.
                    </p>
                    {templates.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600">
                        No templates found. <Link href="/admin/report-templates" className="underline">Create one here</Link>.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Report Type Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Individual Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.filter((r) => !r.premium).map((report) => {
              const Icon = report.icon;
              const isTesting = testing === report.id;
              const hasCustomData = Boolean(customDataMap[report.id]);
              return (
                <div
                  key={report.id}
                  className={`relative bg-gradient-to-r ${report.color} text-white rounded-xl p-6 hover:shadow-lg transition-all text-left group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8" />
                    {isTesting && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                  <p className="text-sm text-white/80">{report.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTestReport(report.id)}
                      disabled={isTesting || testing !== null}
                      className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTesting ? "Generating..." : "Generate Report"}
                    </button>
                    <button
                      onClick={() => openCustomDataEditor(report.id)}
                      disabled={testing !== null && testing !== report.id}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasCustomData ? "Edit Data" : "Customize Data"}
                    </button>
                    {hasCustomData && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-white/20 rounded-full">
                        Custom data set
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Premium Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REPORT_TYPES.filter((r) => r.premium).map((report) => {
              const Icon = report.icon;
              const isTesting = testing === report.id;
              const hasCustomData = Boolean(customDataMap[report.id]);
              return (
                <div
                  key={report.id}
                  className={`relative bg-gradient-to-r ${report.color} text-white rounded-xl p-6 hover:shadow-lg transition-all text-left group border-2 border-yellow-400/50`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8" />
                    {isTesting && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                  <p className="text-sm text-white/80">{report.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTestReport(report.id)}
                      disabled={isTesting || testing !== null}
                      className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isTesting ? "Generating..." : "Generate Report"}
                    </button>
                    <button
                      onClick={() => openCustomDataEditor(report.id)}
                      disabled={testing !== null && testing !== report.id}
                      className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasCustomData ? "Edit Data" : "Customize Data"}
                    </button>
                    {hasCustomData && (
                      <span className="inline-flex items-center px-2 py-1 text-xs bg-white/20 rounded-full">
                        Custom data set
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Report Generated Successfully
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result.report_type} • {result.metadata?.content_length || 0} characters
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewingContent(!viewingContent)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                >
                  <Eye className="w-4 h-4" />
                  {viewingContent ? "Hide" : "View"}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Download TXT
                </button>
                {result.html && (
                  <>
                    <button
                      onClick={downloadHTML}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download HTML
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
                    >
                      <FileText className="w-4 h-4" />
                      Download PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {result.sections && result.sections.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Sections: {result.sections.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.sections.map((section, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {section.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingContent && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}

            {viewingContent && result.html && (
              <div className="mt-4 border-t border-gray-200 pt-6">
                <h4 className="font-semibold mb-2">HTML Preview</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono">
                    {result.html.substring(0, 2000)}
                    {result.html.length > 2000 && "\n\n... (truncated, download full HTML to view)"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Data Editor */}
        {editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Customize Data – {reportIdToName(editingReport)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {editingReport === 'ESSENTIAL' || editingReport === 'ADVANCED' || editingReport === 'MASTER' 
                      ? 'Enter your birth information. All calculations (signs, scores, transits, moon phase, tarot) will be done automatically.'
                      : 'Fill out the form fields to customize the test data. All fields are validated to prevent invalid data.'}
                  </p>
                </div>
                <button
                  onClick={() => setEditingReport(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {customDataError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{customDataError}</p>
                </div>
              )}
              
              {/* Use PremiumReportInputForm for ESSENTIAL, ADVANCED and MASTER reports */}
              {(editingReport === 'ESSENTIAL' || editingReport === 'ADVANCED' || editingReport === 'MASTER') ? (
                <PremiumReportInputForm
                  initialData={formData[editingReport] || {}}
                  onSubmit={handlePremiumReportSubmit}
                  onCancel={() => setEditingReport(null)}
                  requirePartner={editingReport === 'MASTER'} // MASTER reports require partner data
                />
              ) : (
                <>
                  <div className="space-y-4">
                    {renderFormFields(editingReport, formData[editingReport] || {}, (field, value) => {
                      setFormData((prev) => ({
                        ...prev,
                        [editingReport]: {
                          ...(prev[editingReport] || {}),
                          [field]: value,
                        },
                      }));
                    }, {
                      geocoding,
                      locationCoords,
                      locationErrors,
                      geocodeLocation,
                      setLocationCoords,
                    })}
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-3 justify-between items-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleRemoveCustomData(editingReport)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove custom data
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingReport(null)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCustomData}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Save & Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Quality Checklist</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Content is accurate and personalized (not generic)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Tone is warm, spiritual, and authoritative</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>No mentions of AI, software, or internal mechanics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Data is interpreted, not just repeated</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Includes actionable guidance and next steps</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function reportIdToName(reportId) {
  const match = REPORT_TYPES.find((report) => report.id === reportId);
  return match ? match.name : reportId;
}

function renderFormFields(reportId, formValues, onChange, geocodingHelpers = {}) {
  const { geocoding = {}, locationCoords = {}, locationErrors = {}, geocodeLocation, setLocationCoords } = geocodingHelpers;
  
  const handleChange = (field) => (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(field, value);
  };

  const handleArrayChange = (field, index, subField) => (e) => {
    const currentArray = formValues[field] || [];
    const updatedArray = [...currentArray];
    if (!updatedArray[index]) updatedArray[index] = {};
    updatedArray[index][subField] = e.target.value;
    onChange(field, updatedArray);
  };

  const addArrayItem = (field, defaultItem) => () => {
    const currentArray = formValues[field] || [];
    onChange(field, [...currentArray, { ...defaultItem }]);
  };

  const removeArrayItem = (field, index) => () => {
    const currentArray = formValues[field] || [];
    onChange(field, currentArray.filter((_, i) => i !== index));
  };

  if (reportId === 'tarot') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Test User"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarot Cards</label>
          {(formValues.cards || []).map((card, idx) => (
            <div key={idx} className="mb-2 p-3 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={card.card || ''}
                  onChange={handleArrayChange('cards', idx, 'card')}
                  placeholder="Card name"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={card.position || ''}
                  onChange={handleArrayChange('cards', idx, 'position')}
                  placeholder="Position"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <select
                  value={card.orientation || 'Upright'}
                  onChange={handleArrayChange('cards', idx, 'orientation')}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option>Upright</option>
                  <option>Reversed</option>
                </select>
              </div>
              <button
                type="button"
                onClick={removeArrayItem('cards', idx)}
                className="mt-1 text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addArrayItem('cards', { card: '', position: '', orientation: 'Upright' })}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            + Add Card
          </button>
        </div>
      </>
    );
  }

  if (reportId === 'moon_reading') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Moon Phase</label>
          <input
            type="text"
            value={formValues.moon_phase || ''}
            onChange={handleChange('moon_phase')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Waxing Crescent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phase Energy</label>
          <input
            type="text"
            value={formValues.phase_energy || ''}
            onChange={handleChange('phase_energy')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Growth and intention setting"
          />
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Sun and Moon signs will be calculated automatically from birth date, time, and location.
          </p>
        </div>
      </>
    );
  }

  if (reportId === 'birth_chart') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formValues.birth_date || ''}
              onChange={handleChange('birth_date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time <span className="text-red-500">*</span></label>
            <input
              type="time"
              value={formValues.birth_time || ''}
              onChange={handleChange('birth_time')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formValues.location || ''}
            onChange={handleChange('location')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="City, State"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.0001"
              value={formValues.latitude || ''}
              onChange={handleChange('latitude')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="36.9741"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.0001"
              value={formValues.longitude || ''}
              onChange={handleChange('longitude')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="-122.0308"
              required
            />
          </div>
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Sun, Moon, and Rising signs will be calculated automatically from birth date, time, and location.
          </p>
        </div>
      </>
    );
  }

  if (reportId === 'compatibility') {
    return (
      <>
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formValues.user_name || ''}
                onChange={handleChange('user_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formValues.user_birth_date || ''}
                onChange={handleChange('user_birth_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formValues.user_birth_time || ''}
                onChange={handleChange('user_birth_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formValues.user_location || ''}
                  onChange={(e) => {
                    handleChange('user_location')(e);
                    if (setLocationCoords) {
                      setLocationCoords(prev => ({ ...prev, user: null })); // Reset coordinates when location changes
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., New York, USA"
                />
                <button
                  type="button"
                  onClick={() => geocodeLocation(formValues.user_location || '', 'user')}
                  disabled={!formValues.user_location || geocoding.user}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {geocoding.user ? 'Searching...' : 'Search'}
                </button>
              </div>
              {locationErrors.user && (
                <p className="mt-1 text-sm text-red-600">{locationErrors.user}</p>
              )}
              {locationCoords.user && !locationErrors.user && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Location found: {locationCoords.user.latitude.toFixed(4)}°, {locationCoords.user.longitude.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Partner Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formValues.partner_name || ''}
                onChange={handleChange('partner_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formValues.partner_birth_date || ''}
                onChange={handleChange('partner_birth_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formValues.partner_birth_time || ''}
                onChange={handleChange('partner_birth_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formValues.partner_location || ''}
                  onChange={(e) => {
                    handleChange('partner_location')(e);
                    if (setLocationCoords) {
                      setLocationCoords(prev => ({ ...prev, partner: null })); // Reset coordinates when location changes
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Los Angeles, USA"
                />
                <button
                  type="button"
                  onClick={() => geocodeLocation(formValues.partner_location || '', 'partner')}
                  disabled={!formValues.partner_location || geocoding.partner}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {geocoding.partner ? 'Searching...' : 'Search'}
                </button>
              </div>
              {locationErrors.partner && (
                <p className="mt-1 text-sm text-red-600">{locationErrors.partner}</p>
              )}
              {locationCoords.partner && !locationErrors.partner && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Location found: {locationCoords.partner.latitude.toFixed(4)}°, {locationCoords.partner.longitude.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Compatibility score will be calculated automatically from birth chart data.
          </p>
        </div>
      </>
    );
  }

  if (reportId === 'transit_forecast_short' || reportId === 'transit_forecast_extended') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <input
            type="text"
            value={formValues.date_range || ''}
            onChange={handleChange('date_range')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Feb 4–Feb 18, 2025"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transits</label>
          {(formValues.transits || []).map((transit, idx) => (
            <div key={idx} className="mb-2 p-3 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={transit.aspect || ''}
                  onChange={handleArrayChange('transits', idx, 'aspect')}
                  placeholder="Aspect (e.g., Mars trine Sun)"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={transit.date || ''}
                  onChange={handleArrayChange('transits', idx, 'date')}
                  placeholder="Date"
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={removeArrayItem('transits', idx)}
                className="mt-1 text-xs text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addArrayItem('transits', { aspect: '', date: '' })}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            + Add Transit
          </button>
        </div>
      </>
    );
  }

  // For premium reports (ESSENTIAL, ADVANCED, MASTER), render nested forms
  if (reportId === 'ESSENTIAL') {
    // ESSENTIAL now only asks for birth data - all other fields calculated by backend
    return (
      <>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only birth data is required. Moon phase, tarot cards, and transits will be calculated automatically by the backend.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
            placeholder="Your full name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formValues.birthDate || ''}
              onChange={handleChange('birthDate')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formValues.birthTime || ''}
              onChange={handleChange('birthTime')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formValues.birthCity || ''}
            onChange={handleChange('birthCity')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
            placeholder="e.g., New York, USA or London, UK"
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a city name. The system will automatically find the coordinates.
          </p>
        </div>
      </>
    );
  }

  // For ADVANCED and MASTER, render more complex nested forms
  if (reportId === 'ADVANCED' || reportId === 'MASTER') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formValues.name || ''}
            onChange={handleChange('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        {/* Birth Chart Data */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Birth Chart Data</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formValues.birth_name || ''}
                onChange={handleChange('birth_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formValues.birth_date || ''}
                onChange={handleChange('birth_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formValues.birth_time || ''}
                onChange={handleChange('birth_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formValues.birth_location || ''}
                onChange={handleChange('birth_location')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.0001"
                value={formValues.birth_latitude || ''}
                onChange={handleChange('birth_latitude')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.0001"
                value={formValues.birth_longitude || ''}
                onChange={handleChange('birth_longitude')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Sun, Moon, and Rising signs will be calculated automatically from birth date, time, and location.
              </p>
            </div>
          </div>
        </div>

        {/* Compatibility Data */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Compatibility Data</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formValues.user_name || ''}
                onChange={handleChange('user_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Birth Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formValues.user_birth_date || ''}
                onChange={handleChange('user_birth_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Birth Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formValues.user_birth_time || ''}
                onChange={handleChange('user_birth_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Location</label>
              <input
                type="text"
                value={formValues.user_location || ''}
                onChange={handleChange('user_location')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formValues.partner_name || ''}
                onChange={handleChange('partner_name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Birth Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formValues.partner_birth_date || ''}
                onChange={handleChange('partner_birth_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Birth Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={formValues.partner_birth_time || ''}
                onChange={handleChange('partner_birth_time')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner Location</label>
              <input
                type="text"
                value={formValues.partner_location || ''}
                onChange={handleChange('partner_location')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Compatibility score will be calculated automatically from birth chart data.
            </p>
          </div>
        </div>

        {/* Transit Data */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Transit Data</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formValues.transit_name || ''}
              onChange={handleChange('transit_name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <input
              type="text"
              value={formValues.transit_date_range || ''}
              onChange={handleChange('transit_date_range')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* MASTER-only fields */}
        {reportId === 'MASTER' && (
          <>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Destiny Data</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
                  <input
                    type="text"
                    value={formValues.destiny_cycle_name || ''}
                    onChange={handleChange('destiny_cycle_name')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formValues.destiny_start_date || ''}
                    onChange={handleChange('destiny_start_date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formValues.destiny_end_date || ''}
                    onChange={handleChange('destiny_end_date')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Relationship Matrix Data</h4>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Sun signs and relationship matrix scores (emotional, communication, spiritual, stability, physical) will be calculated automatically from birth chart data.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Karmic Data</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">North Node</label>
                  <select
                    value={formValues.karmic_north_node || ''}
                    onChange={handleChange('karmic_north_node')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(sign => (
                      <option key={sign} value={sign}>{sign}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">South Node</label>
                  <select
                    value={formValues.karmic_south_node || ''}
                    onChange={handleChange('karmic_south_node')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map(sign => (
                      <option key={sign} value={sign}>{sign}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return <div className="text-gray-600">Form not available for this report type</div>;
}

