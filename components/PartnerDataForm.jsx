'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Partner Data Form Component
 * Used for collecting partner birth data for Advanced/Master premium reports
 * 
 * Required fields: birthDate, birthTime, location (with coordinates)
 * Optional: partner name
 */
export default function PartnerDataForm({ 
  isOpen, 
  onClose, 
  onComplete, 
  reportType 
}) {
  const [partnerData, setPartnerData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
  });
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipPartnerData, setSkipPartnerData] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form
      setPartnerData({
        name: '',
        birthDate: '',
        birthTime: '',
        location: '',
      });
      setCoordinates(null);
      setLocationError('');
      setShowManualEntry(false);
      setManualLat('');
      setManualLon('');
      setSkipPartnerData(false);
    }
  }, [isOpen]);

  const handleLocationSearch = async () => {
    if (!partnerData.location.trim()) {
      setLocationError('Please enter a location');
      return;
    }

    setLocationError('');
    setLoading(true);

    try {
      // Try OpenStreetMap Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(partnerData.location)}&limit=1`,
        {
          headers: {
            'User-Agent': 'CosmicSpiritualGuide/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setCoordinates({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          });
          setLocationError('');
          setShowManualEntry(false);
          return;
        }
      }
    } catch (error) {
      console.error('Location search error:', error);
    }

    // If search failed, show manual entry option
    setLocationError(`Could not find "${partnerData.location}". Please enter coordinates manually.`);
    setShowManualEntry(true);
    setLoading(false);
  };

  const handleManualCoordinates = () => {
    const latitude = parseFloat(manualLat);
    const longitude = parseFloat(manualLon);

    if (isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      setLocationError('Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180.');
      return;
    }

    setCoordinates({ latitude, longitude });
    setLocationError('');
  };

  const validatePartnerData = () => {
    if (skipPartnerData) {
      return { valid: true, data: null };
    }

    if (!partnerData.birthDate || !partnerData.birthTime) {
      return { valid: false, error: 'Birth date and time are required' };
    }

    if (!coordinates) {
      return { valid: false, error: 'Birth location coordinates are required. Please search for location or enter coordinates manually.' };
    }

    return {
      valid: true,
      data: {
        name: partnerData.name || 'Partner',
        birthDate: partnerData.birthDate,
        birthTime: partnerData.birthTime,
        birthCity: partnerData.location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (skipPartnerData) {
      onComplete({ skipPartnerData: true });
      return;
    }

    const validation = validatePartnerData();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onComplete({
      partnerData: validation.data,
      skipPartnerData: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-900 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Partner Information</h2>
            <p className="text-purple-200 text-sm">
              Required for compatibility sections in {reportType === 'ADVANCED' ? 'Advanced' : 'Master'} Report
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Required Fields Note */}
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-200 text-sm">
              <p className="font-semibold mb-1">Required Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Partner birth date</li>
                <li>Partner birth time</li>
                <li>Partner birth location (city/coordinates)</li>
              </ul>
              <p className="mt-2">Without this information, compatibility sections will be omitted from your report.</p>
            </div>
          </div>
        </div>

        {/* Skip Partner Data Option */}
        <div className="mb-6 p-4 bg-purple-500/20 border border-purple-400/30 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipPartnerData}
              onChange={(e) => {
                setSkipPartnerData(e.target.checked);
                if (e.target.checked) {
                  // Clear form when skipping
                  setPartnerData({
                    name: '',
                    birthDate: '',
                    birthTime: '',
                    location: '',
                  });
                  setCoordinates(null);
                  setLocationError('');
                }
              }}
              className="mt-1 w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <p className="text-white font-semibold">Skip partner data</p>
              <p className="text-purple-200 text-sm mt-1">
                Check this box if you don't want to include compatibility sections. You can add partner data later, but the report will not generate until you either complete the partner data or confirm you want to skip it.
              </p>
            </div>
          </label>
        </div>

        {!skipPartnerData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Partner Name (Optional) */}
            <div>
              <label htmlFor="partnerName" className="block text-sm font-medium text-purple-200 mb-2">
                Partner Name (Optional)
              </label>
              <input
                type="text"
                id="partnerName"
                value={partnerData.name}
                onChange={(e) => setPartnerData({ ...partnerData, name: e.target.value })}
                placeholder="Enter partner's name"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Birth Date (Required) */}
            <div>
              <label htmlFor="partnerBirthDate" className="block text-sm font-medium text-purple-200 mb-2">
                Birth Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="partnerBirthDate"
                value={partnerData.birthDate}
                onChange={(e) => setPartnerData({ ...partnerData, birthDate: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Birth Time (Required) */}
            <div>
              <label htmlFor="partnerBirthTime" className="block text-sm font-medium text-purple-200 mb-2">
                Birth Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                id="partnerBirthTime"
                value={partnerData.birthTime}
                onChange={(e) => setPartnerData({ ...partnerData, birthTime: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Birth Location (Required) */}
            <div>
              <label htmlFor="partnerLocation" className="block text-sm font-medium text-purple-200 mb-2">
                Birth Location <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="partnerLocation"
                  value={partnerData.location}
                  onChange={(e) => setPartnerData({ ...partnerData, location: e.target.value })}
                  placeholder="City, Country (e.g., New York, USA)"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={loading || !partnerData.location.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              {locationError && (
                <p className="mt-2 text-sm text-red-400">{locationError}</p>
              )}
              {coordinates && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Location found: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>
                </div>
              )}

              {/* Manual Coordinate Entry */}
              {showManualEntry && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-purple-200 mb-3">Enter coordinates manually:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-purple-300 mb-1">Latitude (-90 to 90)</label>
                      <input
                        type="number"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        step="any"
                        min="-90"
                        max="90"
                        placeholder="40.7128"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-300 mb-1">Longitude (-180 to 180)</label>
                      <input
                        type="number"
                        value={manualLon}
                        onChange={(e) => setManualLon(e.target.value)}
                        step="any"
                        min="-180"
                        max="180"
                        placeholder="-74.0060"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualCoordinates}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    Use These Coordinates
                  </button>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"
              >
                Continue to Checkout
              </button>
            </div>
          </form>
        )}

        {skipPartnerData && (
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold"
            >
              Continue to Checkout (Without Compatibility)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

