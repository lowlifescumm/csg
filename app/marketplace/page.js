"use client";
import { useState, useEffect } from "react";
import { Phone, MessageCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";

/**
 * Format advisor name initials for avatar fallback
 */
function getInitials(firstName, lastName) {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  return (first + last) || 'A';
}

export default function MarketplacePage() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/marketplace/advisors");
      const data = await response.json();

      if (data.success && data.data) {
        setAdvisors(data.data.advisors || []);
      } else {
        setError(data.error || "Failed to load advisors");
      }
    } catch (err) {
      console.error("Error fetching advisors:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading advisors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Live Advisors Marketplace
          </h1>
          <p className="text-xl text-gray-600">
            Connect with experienced spiritual advisors for personalized guidance
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && advisors.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Advisors Online
            </h2>
            <p className="text-gray-600">
              Check back later to connect with our advisors
            </p>
          </div>
        )}

        {/* Advisor Grid */}
        {advisors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisors.map((advisor) => {
              const initials = getInitials(advisor.first_name, advisor.last_name);
              const hasAvatar = advisor.avatar_url;

              return (
                <div
                  key={advisor.id}
                  className="glassmorphic rounded-3xl p-6 apple-shadow-lg border border-white border-opacity-40 hover:shadow-xl smooth-transition bg-white bg-opacity-70"
                >
                  {/* Avatar and Name Section */}
                  <div className="flex items-center gap-4 mb-4">
                    {hasAvatar ? (
                      <img
                        src={advisor.avatar_url}
                        alt={advisor.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-purple-200">
                        <span className="text-white font-semibold text-lg">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {advisor.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-green-600 font-medium">Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate Display */}
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {advisor.rate_display}
                    </p>
                    <p className="text-sm text-gray-500">USD per minute</p>
                  </div>

                  {/* Specialties (if available) */}
                  {advisor.specialties && advisor.specialties.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {advisor.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {advisor.specialties.length > 3 && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-500">
                          +{advisor.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bio Preview (optional) */}
                  {advisor.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {advisor.bio}
                    </p>
                  )}

                  {/* Call/Chat Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      href={`/advisor/${advisor.id}/session?type=call`}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 apple-shadow-lg"
                    >
                      <Phone className="w-5 h-5" />
                      Call
                    </Link>
                    <Link
                      href={`/advisor/${advisor.id}/session?type=chat`}
                      className="flex-1 bg-white bg-opacity-70 border-2 border-purple-300 text-purple-700 py-3 px-4 rounded-xl font-semibold smooth-transition hover:bg-opacity-90 hover:border-purple-400 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

