'use client';
const logger = require('../lib/logger');
import { useState } from 'react';

/**
 * Premium Report Input Form
 * 
 * Strictly separates Inputs from Outputs.
 * Only accepts raw user input - all calculations happen server-side.
 * 
 * Input Schema:
 * - name (String)
 * - birthDate (Date)
 * - birthTime (String)
 * - birthCity (String)
 * - partnerName (String, Optional)
 * - partnerBirthDate (Date, Optional)
 * - partnerBirthTime (String, Optional)
 * - partnerBirthCity (String, Optional)
 */
export default function PremiumReportInputForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  requirePartner = false 
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    birthDate: initialData.birthDate || '',
    birthTime: initialData.birthTime || '',
    birthCity: initialData.birthCity || '',
    partnerName: initialData.partnerName || '',
    partnerBirthDate: initialData.partnerBirthDate || '',
    partnerBirthTime: initialData.partnerBirthTime || '',
    partnerBirthCity: initialData.partnerBirthCity || '',
  });

  const [locationErrors, setLocationErrors] = useState({
    birth: '',
    partner: ''
  });
  const [coordinates, setCoordinates] = useState({
    birth: null,
    partner: null
  });
  const [geocoding, setGeocoding] = useState({
    birth: false,
    partner: false
  });

  /**
   * Geocode a city name to latitude/longitude
   * Uses Google Maps API if available, falls back to OpenStreetMap
   */
  const geocodeCity = async (city, type) => {
    if (!city || city.trim() === '') {
      setLocationErrors(prev => ({ ...prev, [type]: 'City is required' }));
      return null;
    }

    setGeocoding(prev => ({ ...prev, [type]: true }));
    setLocationErrors(prev => ({ ...prev, [type]: '' }));

    try {
      // Try Google Maps Geocoding API first
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (googleApiKey) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleApiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const coords = {
              latitude: location.lat,
              longitude: location.lng
            };
            setCoordinates(prev => ({ ...prev, [type]: coords }));
            setLocationErrors(prev => ({ ...prev, [type]: '' }));
            setGeocoding(prev => ({ ...prev, [type]: false }));
            return coords;
          }
        }
      }

      // Fallback to OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
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
          setCoordinates(prev => ({ ...prev, [type]: coords }));
          setLocationErrors(prev => ({ ...prev, [type]: '' }));
          setGeocoding(prev => ({ ...prev, [type]: false }));
          return coords;
        }
      }

      // All services failed
      setLocationErrors(prev => ({ 
        ...prev, 
        [type]: `Could not find "${city}". Please try a major city name (e.g., "New York, USA" or "London, UK")` 
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

  const handleGeocodeBirth = async () => {
    await geocodeCity(formData.birthCity, 'birth');
  };

  const handleGeocodePartner = async () => {
    await geocodeCity(formData.partnerBirthCity, 'partner');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.birthDate || !formData.birthTime || !formData.birthCity) {
      alert('Please fill in all required fields (name, birth date, birth time, birth city)');
      return;
    }

    // Geocode birth city if not already done
    let birthCoords = coordinates.birth;
    if (!birthCoords) {
      birthCoords = await geocodeCity(formData.birthCity, 'birth');
      if (!birthCoords) {
        alert('Could not geocode birth city. Please check the city name and try again.');
        return;
      }
    }

    // Geocode partner city if partner data is provided
    let partnerCoords = null;
    if (requirePartner || formData.partnerName || formData.partnerBirthDate || formData.partnerBirthTime || formData.partnerBirthCity) {
      if (!formData.partnerName || !formData.partnerBirthDate || !formData.partnerBirthTime || !formData.partnerBirthCity) {
        alert('Please fill in all partner fields (name, birth date, birth time, birth city) or leave all partner fields empty');
        return;
      }

      partnerCoords = coordinates.partner;
      if (!partnerCoords) {
        partnerCoords = await geocodeCity(formData.partnerBirthCity, 'partner');
        if (!partnerCoords) {
          alert('Could not geocode partner birth city. Please check the city name and try again.');
          return;
        }
      }
    }

    // Build input data object (ONLY inputs, no calculated fields)
    const inputData = {
      name: formData.name,
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      birthCity: formData.birthCity,
      birthLatitude: birthCoords.latitude,
      birthLongitude: birthCoords.longitude,
    };

    // Add partner data if provided
    if (partnerCoords) {
      inputData.partnerName = formData.partnerName;
      inputData.partnerBirthDate = formData.partnerBirthDate;
      inputData.partnerBirthTime = formData.partnerBirthTime;
      inputData.partnerBirthCity = formData.partnerBirthCity;
      inputData.partnerLatitude = partnerCoords.latitude;
      inputData.partnerLongitude = partnerCoords.longitude;
    }

    // Submit to parent
    if (onSubmit) {
      onSubmit(inputData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Information */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth City <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.birthCity}
                onChange={(e) => {
                  setFormData({ ...formData, birthCity: e.target.value });
                  setCoordinates(prev => ({ ...prev, birth: null })); // Reset coordinates when city changes
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
                placeholder="e.g., New York, USA or London, UK"
              />
              <button
                type="button"
                onClick={handleGeocodeBirth}
                disabled={!formData.birthCity || geocoding.birth}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geocoding.birth ? 'Searching...' : 'Search'}
              </button>
            </div>
            {locationErrors.birth && (
              <p className="mt-1 text-sm text-red-600">{locationErrors.birth}</p>
            )}
            {coordinates.birth && !locationErrors.birth && (
              <p className="mt-1 text-sm text-green-600">
                ✓ Location found: {coordinates.birth.latitude.toFixed(4)}°, {coordinates.birth.longitude.toFixed(4)}°
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Partner Information (Optional) */}
      {(requirePartner || formData.partnerName || formData.partnerBirthDate || formData.partnerBirthTime || formData.partnerBirthCity) && (
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Partner Information {requirePartner && <span className="text-red-500">*</span>}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Name {requirePartner && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required={requirePartner}
                placeholder="Partner's full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Birth Date {requirePartner && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={formData.partnerBirthDate}
                  onChange={(e) => setFormData({ ...formData, partnerBirthDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required={requirePartner}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner Birth Time {requirePartner && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="time"
                  value={formData.partnerBirthTime}
                  onChange={(e) => setFormData({ ...formData, partnerBirthTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required={requirePartner}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Birth City {requirePartner && <span className="text-red-500">*</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.partnerBirthCity}
                  onChange={(e) => {
                    setFormData({ ...formData, partnerBirthCity: e.target.value });
                    setCoordinates(prev => ({ ...prev, partner: null })); // Reset coordinates when city changes
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required={requirePartner}
                  placeholder="e.g., Los Angeles, USA or Paris, France"
                />
                <button
                  type="button"
                  onClick={handleGeocodePartner}
                  disabled={!formData.partnerBirthCity || geocoding.partner}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {geocoding.partner ? 'Searching...' : 'Search'}
                </button>
              </div>
              {locationErrors.partner && (
                <p className="mt-1 text-sm text-red-600">{locationErrors.partner}</p>
              )}
              {coordinates.partner && !locationErrors.partner && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Location found: {coordinates.partner.latitude.toFixed(4)}°, {coordinates.partner.longitude.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Generate Report
        </button>
      </div>
    </form>
  );
}


