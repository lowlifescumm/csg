import { CalculatedChartData, UserInput } from "./chartHydrator";
import { ReadingContext, GuestContext, isGuestContext } from "./readingContext";

/**
 * Build the master prompt for spiritual reports using calculated chart data.
 * Ensures we never reference raw form inputs (sunSign, etc.) and instead rely
 * entirely on hydrated astrological data.
 * 
 * @param input - User input data
 * @param readingContext - Reading context (either CalculatedChartData or GuestContext)
 */
export function generateReportPrompt(
  input: UserInput,
  readingContext: ReadingContext
): string {
  if (!input?.name) {
    throw new Error("[generateReportPrompt] Missing input.name");
  }

  // Handle GuestContext - users without birth charts
  if (isGuestContext(readingContext)) {
    const guestContext = readingContext as GuestContext;
    const sunSign = guestContext.sunSign || "Unknown";
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Format current planetary positions (The Sky Now)
    const skyNowList = Object.entries(guestContext.currentPlanetaryPositions)
      .map(([key, planet]) => {
        const planetName = planet.name || key.charAt(0).toUpperCase() + key.slice(1);
        return `${planetName}: ${planet.sign} ${planet.degree?.toFixed(1) || '0'}°`;
      })
      .join('\n- ');

    // Format Prashna Chart key points
    const prashnaAscendant = guestContext.prashnaChart.ascendant;
    const prashnaSun = guestContext.prashnaChart.planets.sun;
    const prashnaMoon = guestContext.prashnaChart.planets.moon;
    
    const prashnaInfo = [
      `Ascendant: ${prashnaAscendant.sign} ${prashnaAscendant.degree.toFixed(1)}°`,
      prashnaSun ? `Sun: ${prashnaSun.sign} ${prashnaSun.degree.toFixed(1)}° (House ${prashnaSun.house || 'Unknown'})` : '',
      prashnaMoon ? `Moon: ${prashnaMoon.sign} ${prashnaMoon.degree.toFixed(1)}° (House ${prashnaMoon.house || 'Unknown'})` : '',
    ].filter(Boolean).join('\n- ');

    return [
      "You are a Master of Horary Astrology, specializing in reading the stars at the moment of inquiry.",
      "",
      "**CRITICAL CONTEXT:**",
      "The user has not provided a birth chart. Do not attempt to guess their houses.",
      "",
      "**YOUR APPROACH:**",
      "Instead, act as a Master of Horary Astrology. Use the positions of the stars RIGHT NOW as the primary influence. Use their Sun Sign as a secondary filter. Focus on the collective energy of the day and how a " + sunSign + " should navigate it.",
      "",
      "**USER INFORMATION:**",
      `Name: ${input.name}`,
      `Sun Sign: ${sunSign}`,
      `Current Date: ${currentDate}`,
      "",
      "**THE SKY NOW (Current Planetary Positions):**",
      `- ${skyNowList}`,
      "",
      "**PRASHNA CHART (Chart of This Moment):**",
      `- ${prashnaInfo}`,
      `- Calculated at: ${guestContext.prashnaChart.calculatedAt.toLocaleString()}`,
      guestContext.prashnaChart.location.name 
        ? `- Location: ${guestContext.prashnaChart.location.name} (${guestContext.prashnaChart.location.latitude}, ${guestContext.prashnaChart.location.longitude})`
        : `- Location: ${guestContext.prashnaChart.location.latitude}, ${guestContext.prashnaChart.location.longitude}`,
      "",
      "**INSTRUCTIONS:**",
      "- Read the current planetary positions (The Sky Now) and the Prashna Chart (chart of this moment).",
      "- Use the Prashna Chart's house system to understand where planetary energies are focused RIGHT NOW.",
      "- Interpret how these current cosmic energies specifically affect someone with a " + sunSign + " Sun Sign.",
      "- Focus on the collective, universal energy patterns of this day.",
      "- Provide guidance on how a " + sunSign + " can best navigate today's energies.",
      "- Write with warmth, clarity, and spiritual authority.",
      "",
      "**IMPORTANT:**",
      "Mention that for a deeper, more accurate life-path reading, they should create a full profile.",
      "",
      `Based on the current planetary positions (The Sky Now), the Prashna Chart, and the ${sunSign} Sun Sign filter, write a horary astrology reading for ${input.name} for today.`,
    ].join("\n");
  }

  // Standard prompt for users with birth charts
  const calculatedData = readingContext as CalculatedChartData;

  // Standard prompt for users with birth charts
  if (!calculatedData?.planets?.sun) {
    throw new Error("[generateReportPrompt] Missing calculated sun data");
  }

  const sunSign = calculatedData.planets.sun.sign ?? "Unknown";
  const sunHouse = formatHouse(calculatedData.planets.sun.house);

  const moonSign = calculatedData.planets.moon?.sign ?? calculatedData.moonSign ?? "Unknown";
  const moonHouse = formatHouse(calculatedData.planets.moon?.house);

  const risingSign =
    calculatedData.risingSign ??
    calculatedData.houses?.[1]?.sign ??
    "Unknown";

  const saturnReturnActive = calculatedData.isSaturnReturn ? "YES" : "NO";

  return [
    "You are an expert astrologer. I will provide you with a calculated astrological profile. Do NOT recalculate planetary positions. Use the provided data as the absolute source of truth.",
    "",
    "Profile Data:",
    "",
    `Sun: ${sunSign} in House ${sunHouse}`,
    `Moon: ${moonSign} in House ${moonHouse}`,
    `Rising: ${risingSign}`,
    `Saturn Return Active: ${saturnReturnActive}`,
    "",
    `Based ONLY on this data, write a spiritual report for ${input.name}.`,
  ].join("\n");
}

function formatHouse(house: unknown): string {
  if (house === null || house === undefined || house === "") {
    return "Unknown";
  }

  if (typeof house === "number") {
    return house.toString();
  }

  return String(house);
}


