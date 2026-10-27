import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function main() {
  const outputDir = path.resolve(__dirname, "../docs/submission");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Launching Chromium to capture screenshots...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // Next.js is running on port 3001
  const baseUrl = "http://localhost:3001";
  console.log(`Using Base URL: ${baseUrl}`);

  try {
    // 1. Hero Screenshot — Command Center
    console.log("1. Capturing Command Center (hero-screenshot.png)...");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);
    const heroPath = path.join(outputDir, "hero-screenshot.png");
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log(`Saved hero screenshot to ${heroPath}`);

    // 2. Revenue Integrity & Evidence Drawer
    console.log("2. Capturing Revenue Integrity with Evidence Drawer...");
    await page.goto(`${baseUrl}/revenue?days=90`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    const firstTripLink = page.locator('a[href*="trip="]').first();
    if (await firstTripLink.isVisible()) {
      await firstTripLink.click();
      await page.waitForTimeout(1500);
    }
    const evidencePath = path.join(outputDir, "revenue-evidence-screenshot.png");
    await page.screenshot({ path: evidencePath, fullPage: false });
    console.log(`Saved evidence screenshot to ${evidencePath}`);

    // 3. Demand Intelligence
    console.log("3. Capturing Demand Intelligence...");
    await page.goto(`${baseUrl}/demand`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    const demandPath = path.join(outputDir, "demand-screenshot.png");
    await page.screenshot({ path: demandPath, fullPage: false });
    console.log(`Saved demand screenshot to ${demandPath}`);

    // 4. Fleet Risk Intelligence
    console.log("4. Capturing Fleet Intelligence...");
    await page.goto(`${baseUrl}/fleet`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2000);
    const vehicleLink = page.locator('a[href*="vehicle="]').first();
    if (await vehicleLink.isVisible()) {
      await vehicleLink.click();
      await page.waitForTimeout(1500);
    }
    const fleetPath = path.join(outputDir, "fleet-screenshot.png");
    await page.screenshot({ path: fleetPath, fullPage: false });
    console.log(`Saved fleet screenshot to ${fleetPath}`);

    // 5. Pitch Deck Cover
    console.log("5. Capturing Pitch Deck Cover...");
    const deckFilePath = "file://" + path.resolve(__dirname, "../docs/submission/pitch-deck.html").replace(/\\/g, "/");
    await page.goto(deckFilePath, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    const deckPath = path.join(outputDir, "pitch-deck-screenshot.png");
    await page.screenshot({ path: deckPath, fullPage: false });
    console.log(`Saved pitch deck screenshot to ${deckPath}`);

    console.log("\nAll high-resolution submission screenshots captured successfully!");
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
