"use client";
import { useState, useEffect } from "react";
import { Sparkles, Heart, X, Loader2, Info } from "lucide-react";
import { zodiacSigns } from "@/lib/zodiac-data";
import * as Astronomy from 'astronomy-engine';

/**
 * Check if Mercury is currently retrograde
 * @returns {boolean} True if Mercury is retrograde
 */
function isMercuryRetrograde() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000); // +1 day
  
  const todayPos = Astronomy.GeoVector('Mercury', Astronomy.MakeTime(now), true);
  const tomorrowPos = Astronomy.GeoVector('Mercury', Astronomy.MakeTime(tomorrow), true);
  
  const todayEcl = Astronomy.Ecliptic(todayPos);
  const tomorrowEcl = Astronomy.Ecliptic(tomorrowPos);
  
  // If tomorrow's longitude is less than today's, planet is retrograde
  let diff = tomorrowEcl.elon - todayEcl.elon;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  return diff < 0;
}

/**
 * Get crystal recommendations based on active transits
 * @param {Array} activeTransits - Array of transit objects
 * @returns {Object|null} Crystal recommendation with reason, or null if no match
 */
function getCrystalsForTransits(activeTransits) {
  if (!activeTransits || !Array.isArray(activeTransits)) {
    return null;
  }

  // Check for Mars Square Saturn transit
  const marsSquareSaturn = activeTransits.find(
    transit => 
      transit.transitPlanet?.toLowerCase() === 'mars' &&
      transit.natalPlanet?.toLowerCase() === 'saturn' &&
      transit.aspect?.toLowerCase() === 'square'
  );

  if (marsSquareSaturn) {
    return {
      crystal: {
        id: "red-jasper",
        name: "Red Jasper",
        description: "Grounds your fire energy and provides stability. Strengthens courage and determination. Perfect for navigating challenging Mars-Saturn transits that create tension between action and restriction.",
        emoji: "🧱",
        color: "#dc2626",
      },
      reason: "Mars Square Saturn transit is active. This challenging aspect creates tension between your drive (Mars) and limitations (Saturn). Red Jasper helps ground this energy and provides stability during this period.",
      transitType: "Mars Square Saturn"
    };
  }

  // Check for Mercury Retrograde
  if (isMercuryRetrograde()) {
    return {
      crystal: {
        id: "blue-lace-agate",
        name: "Blue Lace Agate",
        description: "Promotes peace and tranquility. Helps release emotional blocks and encourages self-expression. Ideal for Mercury retrograde periods when communication and technology can be disrupted.",
        emoji: "💠",
        color: "#3b82f6",
      },
      reason: "Mercury is currently retrograde. This period often brings communication challenges, technology glitches, and delays. Blue Lace Agate helps calm the mind and promotes clear communication during this time.",
      transitType: "Mercury Retrograde"
    };
  }

  return null;
}

// Crystal data by element (fallback for when no transit matches)
const CRYSTALS_BY_ELEMENT = {
  Fire: [
    {
      id: "carnelian",
      name: "Carnelian",
      description: "Enhances motivation, creativity, and passion. Perfect for igniting your inner fire and taking action.",
      emoji: "🔴",
      color: "#ef4444",
    },
    {
      id: "citrine",
      name: "Citrine",
      description: "Manifests abundance and success. Clears negative energy and attracts prosperity.",
      emoji: "💛",
      color: "#fbbf24",
    },
    {
      id: "red-jasper",
      name: "Red Jasper",
      description: "Grounds your fire energy and provides stability. Strengthens courage and determination.",
      emoji: "🧱",
      color: "#dc2626",
    },
  ],
  Water: [
    {
      id: "moonstone",
      name: "Moonstone",
      description: "Enhances intuition and emotional balance. Connects you to lunar energies and inner wisdom.",
      emoji: "🌙",
      color: "#60a5fa",
    },
    {
      id: "aquamarine",
      name: "Aquamarine",
      description: "Calms emotions and promotes clear communication. Soothes anxiety and enhances compassion.",
      emoji: "💎",
      color: "#06b6d4",
    },
    {
      id: "blue-lace-agate",
      name: "Blue Lace Agate",
      description: "Promotes peace and tranquility. Helps release emotional blocks and encourages self-expression.",
      emoji: "💠",
      color: "#3b82f6",
    },
  ],
  Air: [
    {
      id: "clear-quartz",
      name: "Clear Quartz",
      description: "Amplifies energy and enhances mental clarity. Perfect for focus, communication, and learning.",
      emoji: "💎",
      color: "#e0e7ff",
    },
    {
      id: "sodalite",
      name: "Sodalite",
      description: "Stimulates logical thinking and self-expression. Encourages truth and inner peace.",
      emoji: "🔷",
      color: "#6366f1",
    },
    {
      id: "blue-apatite",
      name: "Blue Apatite",
      description: "Enhances communication and deepens knowledge. Opens the throat chakra for authentic expression.",
      emoji: "💙",
      color: "#2563eb",
    },
  ],
  Earth: [
    {
      id: "hematite",
      name: "Hematite",
      description: "Grounds and stabilizes your energy. Provides protection and helps with organization.",
      emoji: "⚫",
      color: "#374151",
    },
    {
      id: "green-aventurine",
      name: "Green Aventurine",
      description: "Attracts luck and opportunity. Promotes growth, prosperity, and emotional healing.",
      emoji: "💚",
      color: "#10b981",
    },
    {
      id: "tiger-eye",
      name: "Tiger's Eye",
      description: "Enhances practical wisdom and confidence. Protects against negative energy and increases focus.",
      emoji: "👁️",
      color: "#d97706",
    },
  ],
};

// Element explanations
const ELEMENT_EXPLANATIONS = {
  Fire: "Fire energy is passionate, dynamic, and transformative. Today's fire element encourages you to take bold action, express your creativity, and embrace your inner drive. Fire crystals help channel this energy into productive manifestation.",
  Water: "Water energy flows with intuition, emotion, and deep healing. Today's water element invites you to connect with your feelings, trust your instincts, and nurture your emotional well-being. Water crystals enhance your sensitivity and compassion.",
  Air: "Air energy brings clarity, communication, and intellectual growth. Today's air element supports learning, sharing ideas, and connecting with others. Air crystals help clear mental fog and enhance your ability to express yourself authentically.",
  Earth: "Earth energy provides stability, grounding, and practical wisdom. Today's earth element encourages you to build solid foundations, stay organized, and manifest your goals through steady action. Earth crystals help you stay centered and focused.",
};

/**
 * CrystalsWidget - Displays today's element and recommended crystals
 * 
 * Props:
 * - moonPhase: Moon phase data (optional)
 * - userSign: User's zodiac sign (optional)
 * - activeTransits: Array of active transit objects (optional)
 */
export default function CrystalsWidget({ moonPhase, userSign, activeTransits }) {
  const [elementData, setElementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrystal, setSelectedCrystal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState({});

  // Safely extract moonPhase, ensuring we never render objects
  const safeMoonPhase = moonPhase && typeof moonPhase === 'object' && Object.keys(moonPhase).length > 0 ? moonPhase : null;

  useEffect(() => {
    fetchElementData();
  }, [safeMoonPhase, userSign]);

  const fetchElementData = async () => {
    try {
      const res = await fetch("/api/element/today");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setElementData(data);
        }
      }
    } catch (err) {
      console.log("Could not fetch element data, computing from moon phase:", err);
      // Compute from moon phase if available
      if (safeMoonPhase?.zodiacSign) {
        const element = getElementFromSign(safeMoonPhase.zodiacSign);
        setElementData({
          success: true,
          element,
          sign: safeMoonPhase.zodiacSign,
          explanation: ELEMENT_EXPLANATIONS[element] || "",
        });
      } else if (userSign) {
        const element = getElementFromSign(userSign);
        setElementData({
          success: true,
          element,
          sign: userSign,
          explanation: ELEMENT_EXPLANATIONS[element] || "",
        });
      } else {
        // Default to Fire
        setElementData({
          success: true,
          element: "Fire",
          sign: null,
          explanation: ELEMENT_EXPLANATIONS["Fire"],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getElementFromSign = (sign) => {
    const signData = zodiacSigns.find((s) => s.name === sign);
    return signData?.element || "Fire";
  };

  const handleLearnMore = (crystal) => {
    setSelectedCrystal(crystal);
    setShowModal(true);
    // Check if crystal is favorited
    checkFavoriteStatus(crystal.id);
  };

  const checkFavoriteStatus = async (crystalId) => {
    try {
      const res = await fetch(`/api/user/favorites?type=crystal&itemId=${crystalId}`);
      if (res.ok) {
        const data = await res.json();
        setFavoriteStatus((prev) => ({
          ...prev,
          [crystalId]: data.isFavorited || false,
        }));
      }
    } catch (err) {
      console.log("Could not check favorite status:", err);
    }
  };

  const handleAddToFavorites = async () => {
    if (!selectedCrystal) return;

    setFavoriting(true);
    try {
      const res = await fetch("/api/user/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "crystal",
          itemId: selectedCrystal.id,
          name: selectedCrystal.name,
          metadata: {
            element: elementData?.element,
            description: selectedCrystal.description,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFavoriteStatus((prev) => ({
          ...prev,
          [selectedCrystal.id]: true,
        }));
      }
    } catch (err) {
      console.error("Error adding to favorites:", err);
    } finally {
      setFavoriting(false);
    }
  };

  if (loading) {
    return (
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  const element = elementData?.element || "Fire";
  
  // Get transit-based crystal recommendation
  const transitCrystal = getCrystalsForTransits(activeTransits);
  
  // Use transit-based crystal if available, otherwise fall back to element-based
  const crystals = transitCrystal 
    ? [transitCrystal.crystal] 
    : (CRYSTALS_BY_ELEMENT[element] || CRYSTALS_BY_ELEMENT["Fire"]);
  
  const isFavorited = selectedCrystal ? favoriteStatus[selectedCrystal.id] : false;

  // Element icons
  const elementIcons = {
    Fire: "🔥",
    Water: "💧",
    Air: "💨",
    Earth: "🌍",
  };

  // Element colors
  const elementColors = {
    Fire: "from-red-500 to-orange-500",
    Water: "from-blue-500 to-cyan-500",
    Air: "from-sky-400 to-blue-400",
    Earth: "from-green-600 to-emerald-500",
  };

  return (
    <>
      <div className="glassmorphic rounded-3xl p-6 sm:p-8 apple-shadow-lg border border-white border-opacity-40 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold gradient-text mb-2">Today's Element & Crystals</h2>
            <p className="text-purple-200 text-sm sm:text-base">Personalized crystal recommendations</p>
          </div>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${elementColors[element]} flex items-center justify-center text-3xl`}>
            {elementIcons[element]}
          </div>
        </div>

        {/* Element Display */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{elementIcons[element]}</span>
            <h3 className="text-xl font-semibold text-white">{element} Element</h3>
          </div>
          {elementData?.sign && (
            <p className="text-purple-200 text-sm mb-2">
              Based on {elementData.sign} energy
            </p>
          )}
          <p className="text-purple-200 text-sm leading-relaxed">
            {elementData?.explanation || ELEMENT_EXPLANATIONS[element]}
          </p>
        </div>

        {/* Recommended Crystals */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">
            {transitCrystal ? "Recommended Crystal" : "Recommended Crystals"}
          </h4>
          
          {/* Transit-based recommendation reason */}
          {transitCrystal && (
            <div className="mb-4 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-200 font-medium text-sm mb-1">
                    Recommended for: <span className="text-white">{transitCrystal.transitType}</span>
                  </p>
                  <p className="text-blue-200/90 text-sm leading-relaxed">
                    {transitCrystal.reason}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className={`grid gap-4 ${transitCrystal ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {crystals.map((crystal) => (
              <div
                key={crystal.id}
                className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 smooth-transition cursor-pointer"
                onClick={() => handleLearnMore(crystal)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{crystal.emoji}</div>
                  <div className="flex-1">
                    <h5 className="text-white font-semibold text-lg">{crystal.name}</h5>
                    <div
                      className="w-6 h-1 rounded-full mt-1"
                      style={{ backgroundColor: crystal.color }}
                    />
                  </div>
                </div>
                <p className="text-purple-200 text-sm leading-relaxed mb-3 line-clamp-3">
                  {crystal.description}
                </p>
                <button className="text-purple-300 hover:text-purple-200 text-sm font-medium smooth-transition flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  <span>Learn why</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learn Why Modal */}
      {showModal && selectedCrystal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-800 rounded-3xl p-8 apple-shadow-xl border border-white border-opacity-40 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white hover:text-purple-200 smooth-transition"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">{selectedCrystal.emoji}</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedCrystal.name}</h3>
                <div
                  className="w-12 h-2 rounded-full mt-2"
                  style={{ backgroundColor: selectedCrystal.color }}
                />
              </div>
            </div>

            <div className="mb-6">
              {transitCrystal && selectedCrystal.id === transitCrystal.crystal.id ? (
                <>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    Why {selectedCrystal.name} for {transitCrystal.transitType}?
                  </h4>
                  <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <p className="text-blue-200 text-sm font-medium mb-2">
                      Transit Recommendation
                    </p>
                    <p className="text-blue-100 text-sm leading-relaxed mb-3">
                      {transitCrystal.reason}
                    </p>
                  </div>
                  <p className="text-purple-200 leading-relaxed mb-4">{selectedCrystal.description}</p>
                </>
              ) : (
                <>
                  <h4 className="text-lg font-semibold text-white mb-3">Why {selectedCrystal.name} for {element} Energy?</h4>
                  <p className="text-purple-200 leading-relaxed mb-4">{selectedCrystal.description}</p>
                  <p className="text-purple-200/80 text-sm leading-relaxed">
                    {elementData?.explanation || ELEMENT_EXPLANATIONS[element]} This crystal helps you align with today's {element.toLowerCase()} energy and maximize its benefits in your spiritual practice.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToFavorites}
                disabled={favoriting || isFavorited}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold smooth-transition flex items-center justify-center gap-2 ${
                  isFavorited
                    ? "bg-green-500/20 text-green-200 border border-green-400/30"
                    : "bg-white bg-opacity-10 text-white hover:bg-opacity-20 border border-white border-opacity-20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {favoriting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : isFavorited ? (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    <span>Favorited</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Add to Favorites</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white bg-opacity-10 text-white font-semibold rounded-xl hover:bg-opacity-20 smooth-transition border border-white border-opacity-20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

