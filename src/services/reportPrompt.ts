import { CalculatedChartData, UserInput } from "./chartHydrator";

/**
 * Build the master prompt for spiritual reports using calculated chart data.
 * Ensures we never reference raw form inputs (sunSign, etc.) and instead rely
 * entirely on hydrated astrological data.
 */
export function generateReportPrompt(
  input: UserInput,
  calculatedData: CalculatedChartData
): string {
  if (!input?.name) {
    throw new Error("[generateReportPrompt] Missing input.name");
  }

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


