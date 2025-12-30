"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdvisorAvailabilityToggle from "@/components/AdvisorAvailabilityToggle";

// Predefined specialty options (must match backend)
const SPECIALTY_OPTIONS = [
  'Tarot Reading',
  'Astrology',
  'Natal Charts',
  'Palm Reading',
  'Numerology',
  'Crystal Healing',
  'Meditation Guidance',
  'Spiritual Coaching',
  'Dream Interpretation',
  'Energy Healing'
];

const MIN_BIO_LENGTH = 50;
const MAX_BIO_LENGTH = 2000;
const MIN_RATE = 0.50;
const MAX_RATE = 100.00;
const MIN_SPECIALTIES = 1;
const MAX_SPECIALTIES = 5;

export default function AdvisorOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingProfile, setExistingProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    bio: "",
    specialties: [],
    per_minute_rate: "",
  });

  const [errors, setErrors] = useState({});

  // Check authentication and fetch existing profile
  const checkAuthAndFetchProfile = useCallback(async () => {
    try {
      // Check authentication
      const authRes = await fetch("/api/auth/user");
      const authData = await authRes.json();
      
      if (!authData.user) {
        router.push("/login");
        return;
      }

      // Fetch existing advisor profile
      const profileRes = await fetch("/api/marketplace/advisors/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const profile = profileData.data;
          setExistingProfile(profile);
          setFormData({
            bio: profile.bio || "",
            specialties: profile.specialties || [],
            per_minute_rate: profile.per_minute_rate ? profile.per_minute_rate.toString() : "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, [checkAuthAndFetchProfile]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate bio
    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.trim().length < MIN_BIO_LENGTH) {
      newErrors.bio = `Bio must be at least ${MIN_BIO_LENGTH} characters`;
    } else if (formData.bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio must be no more than ${MAX_BIO_LENGTH} characters`;
    }

    // Validate specialties
    if (formData.specialties.length < MIN_SPECIALTIES) {
      newErrors.specialties = `Select at least ${MIN_SPECIALTIES} specialty`;
    } else if (formData.specialties.length > MAX_SPECIALTIES) {
      newErrors.specialties = `Maximum ${MAX_SPECIALTIES} specialties allowed`;
    }

    // Validate rate
    if (!formData.per_minute_rate) {
      newErrors.per_minute_rate = "Per minute rate is required";
    } else {
      const rate = parseFloat(formData.per_minute_rate);
      if (isNaN(rate) || rate < MIN_RATE || rate > MAX_RATE) {
        newErrors.per_minute_rate = `Rate must be between $${MIN_RATE} and $${MAX_RATE}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle specialty toggle
  const toggleSpecialty = (specialty) => {
    setFormData((prev) => {
      const current = prev.specialties;
      if (current.includes(specialty)) {
        // Remove if already selected
        return {
          ...prev,
          specialties: current.filter((s) => s !== specialty),
        };
      } else {
        // Add if not selected (enforce max)
        if (current.length >= MAX_SPECIALTIES) {
          return prev; // Don't add if at max
        }
        return {
          ...prev,
          specialties: [...current, specialty],
        };
      }
    });
    // Clear error when user makes a selection
    if (errors.specialties) {
      setErrors((prev) => ({ ...prev, specialties: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    if (!validateForm()) {
      setMessage("Please fix the errors below");
      return;
    }

    setSaving(true);

    try {
      const rate = parseFloat(formData.per_minute_rate);
      const response = await fetch("/api/marketplace/advisors/profile", {
        method: existingProfile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: formData.bio.trim(),
          specialties: formData.specialties,
          per_minute_rate: rate,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Profile saved successfully! Your profile is pending admin approval.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setMessage(data.error || "Failed to save profile");
      }
    } catch (err) {
      setMessage("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  // Calculate bio character count
  const bioCharCount = formData.bio.length;
  const bioCharRemaining = MAX_BIO_LENGTH - bioCharCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-purple-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 smooth-transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="glassmorphic rounded-3xl p-10 apple-shadow-lg border border-white border-opacity-40">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {existingProfile ? "Edit Advisor Profile" : "Become an Advisor"}
            </h1>
            <p className="text-gray-600">
              {existingProfile 
                ? "Update your advisor profile information"
                : "Set up your advisor profile to start offering consultations"
              }
            </p>
            {existingProfile && !existingProfile.is_advisor && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                Your profile is pending admin approval. Once approved, you'll be able to accept consultation sessions.
              </div>
            )}
          </div>

          {/* Availability Toggle - Only show if approved advisor */}
          {existingProfile && existingProfile.is_advisor && (
            <div className="mb-8">
              <AdvisorAvailabilityToggle 
                advisorProfile={existingProfile}
                onStatusChange={(newStatus, data) => {
                  // Update existing profile state when status changes
                  setExistingProfile(prev => ({
                    ...prev,
                    is_online: newStatus,
                    last_heartbeat_at: data?.last_heartbeat_at || null
                  }));
                }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => {
                  setFormData({ ...formData, bio: e.target.value });
                  if (errors.bio) {
                    setErrors((prev) => ({ ...prev, bio: undefined }));
                  }
                }}
                rows={8}
                className={`w-full p-4 rounded-xl border ${
                  errors.bio 
                    ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                    : "border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                } outline-none smooth-transition text-gray-900 bg-white bg-opacity-70 resize-none`}
                placeholder="Tell potential clients about your experience, approach, and what makes your readings special. (Minimum 50 characters)"
                required
              />
              <div className="flex items-center justify-between mt-2">
                <div>
                  {errors.bio && (
                    <p className="text-red-600 text-sm">{errors.bio}</p>
                  )}
                </div>
                <p className={`text-sm ${
                  bioCharCount < MIN_BIO_LENGTH 
                    ? "text-gray-500"
                    : bioCharRemaining < 100
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}>
                  {bioCharCount} / {MAX_BIO_LENGTH} characters
                  {bioCharCount < MIN_BIO_LENGTH && ` (${MIN_BIO_LENGTH} minimum)`}
                </p>
              </div>
            </div>

            {/* Specialties Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">
                  (Select {MIN_SPECIALTIES}-{MAX_SPECIALTIES})
                </span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPECIALTY_OPTIONS.map((specialty) => {
                  const isSelected = formData.specialties.includes(specialty);
                  const isDisabled = !isSelected && formData.specialties.length >= MAX_SPECIALTIES;
                  return (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      disabled={isDisabled}
                      className={`p-3 rounded-xl border-2 text-left smooth-transition ${
                        isSelected
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-medium"
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 bg-white bg-opacity-70 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      {specialty}
                    </button>
                  );
                })}
              </div>
              {errors.specialties && (
                <p className="text-red-600 text-sm mt-2">{errors.specialties}</p>
              )}
              {formData.specialties.length > 0 && (
                <p className="text-gray-600 text-sm mt-2">
                  Selected: {formData.specialties.length} / {MAX_SPECIALTIES}
                </p>
              )}
            </div>

            {/* Per Minute Rate Field */}
            <div>
              <label htmlFor="per_minute_rate" className="block text-sm font-medium text-gray-700 mb-2">
                Rate per Minute (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  id="per_minute_rate"
                  name="per_minute_rate"
                  type="number"
                  min={MIN_RATE}
                  max={MAX_RATE}
                  step="0.01"
                  value={formData.per_minute_rate}
                  onChange={(e) => {
                    setFormData({ ...formData, per_minute_rate: e.target.value });
                    if (errors.per_minute_rate) {
                      setErrors((prev) => ({ ...prev, per_minute_rate: undefined }));
                    }
                  }}
                  className={`w-full pl-8 pr-4 py-4 rounded-xl border ${
                    errors.per_minute_rate
                      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  } outline-none smooth-transition text-gray-900 bg-white bg-opacity-70`}
                  placeholder="0.50"
                  required
                />
              </div>
              {errors.per_minute_rate && (
                <p className="text-red-600 text-sm mt-2">{errors.per_minute_rate}</p>
              )}
              <p className="text-gray-600 text-sm mt-2">
                Minimum: ${MIN_RATE} | Maximum: ${MAX_RATE} per minute
              </p>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm ${
                message.includes("success")
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed apple-shadow-lg"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </span>
              ) : (
                existingProfile ? "Update Profile" : "Create Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

