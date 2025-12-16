#!/usr/bin/env node
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });
import { generatePremiumPdf } from "../lib/premium-pdf-generator.js";
const testUserData = {
  name: "Test User",
  birthDate: "1990-05-21",
  birthTime: "09:45",
  location: "New York, NY",
  sunSign: "Gemini",
  moonSign: "Pisces",
  risingSign: "Sagittarius",
  birthChartSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet"><circle cx="200" cy="200" r="180" fill="none" stroke="#d4af37" stroke-width="2"/><text x="200" y="200" text-anchor="middle" fill="#d4af37" font-size="24">Birth Chart</text></svg>`,
  sections: [{ type: "core_identity", title: "Core Identity", content: "## Test Section\n\nThis is a test." }, { type: "closing", title: "Closing", content: "## Closing\n\nBlessings." }]
};
async function test() {
  console.log("Testing premium PDF generator...");
  try {
    const pdfBuffer = await generatePremiumPdf(testUserData);
    const outputDir = resolve(__dirname, "../test-outputs");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = resolve(outputDir, `premium-test-${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(` PDF generated: ${outputPath}`);
    console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    return true;
  } catch (error) {
    console.error(" Error:", error.message);
    return false;
  }
}
test().then(success => process.exit(success ? 0 : 1));
