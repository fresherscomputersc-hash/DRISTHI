import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

async function injectCaption(page: any, timecode: string, title: string, text: string) {
  await page.evaluate(
    ({ timecode, title, text }: { timecode: string; title: string; text: string }) => {
      let banner = document.getElementById("drishti-demo-caption");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "drishti-demo-caption";
        banner.style.position = "fixed";
        banner.style.bottom = "24px";
        banner.style.left = "50%";
        banner.style.transform = "translateX(-50%)";
        banner.style.width = "90%";
        banner.style.maxWidth = "1180px";
        banner.style.backgroundColor = "rgba(7, 11, 20, 0.95)";
        banner.style.border = "1px solid rgba(56, 189, 248, 0.4)";
        banner.style.borderRadius = "14px";
        banner.style.padding = "16px 24px";
        banner.style.boxShadow = "0 12px 45px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.3)";
        banner.style.backdropFilter = "blur(18px)";
        banner.style.zIndex = "999999";
        banner.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        banner.style.transition = "all 0.3s ease";
        banner.style.display = "flex";
        banner.style.flexDirection = "column";
        banner.style.gap = "6px";
        document.body.appendChild(banner);
      }

      banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.3);">
              ${timecode}
            </span>
            <span style="color: #ffffff; font-size: 15px; font-weight: 700; letter-spacing: -0.01em;">
              ${title}
            </span>
          </div>
          <span style="color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            DRISHTI · OSFIC 2026 DEMO
          </span>
        </div>
        <p style="color: #e2e8f0; font-size: 13.5px; line-height: 1.45; margin: 0; font-weight: 400;">
          "${text}"
        </p>
      `;
    },
    { timecode, title, text }
  );
}

async function navigateViaLink(page: any, href: string, fallbackUrl: string) {
  try {
    const link = page.locator(`aside a[href="${href}"]`).first();
    if (await link.isVisible({ timeout: 3000 })) {
      await link.click();
      await page.waitForTimeout(2000);
      return;
    }
  } catch {}
  await page.goto(fallbackUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function main() {
  const outputDir = path.resolve(__dirname, "../docs/submission");
  const tempVideoDir = path.join(outputDir, "raw-video-temp");
  if (!fs.existsSync(tempVideoDir)) {
    fs.mkdirSync(tempVideoDir, { recursive: true });
  }

  console.log("=== Starting Drishti 90-Second Walkthrough Video Recording ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const baseUrl = "http://localhost:3001";

  try {
    // -------------------------------------------------------------
    // SCENE 1: 0:00 – 0:15 | Command Center Overview
    // -------------------------------------------------------------
    console.log("[0:00 - 0:15] Scene 1: Command Center...");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);
    await injectCaption(
      page,
      "0:00 – 0:15",
      "Command Center · Single Trip-Level Truth",
      "OSRTC's ticketing, remittance, GPS telemetry, and workshop logs traditionally operate in disconnected silos. Drishti joins them into a single, trip-level truth: ₹5.76 Cr revenue over 30 days, ₹3.45L at risk, and alerts ranked strictly by rupees."
    );
    await page.waitForTimeout(3500);

    // Smooth scroll down
    await page.evaluate(() => window.scrollBy({ top: 380, behavior: "smooth" }));
    await page.waitForTimeout(4000);

    // Smooth scroll up
    await page.evaluate(() => window.scrollBy({ top: -380, behavior: "smooth" }));
    await page.waitForTimeout(4000);

    // -------------------------------------------------------------
    // SCENE 2: 0:15 – 0:35 | Revenue Integrity & Audit Evidence
    // -------------------------------------------------------------
    console.log("[0:15 - 0:35] Scene 2: Revenue Integrity & Evidence Drawer...");
    await navigateViaLink(page, "/revenue", `${baseUrl}/revenue`);
    await page.waitForTimeout(1500);
    await injectCaption(
      page,
      "0:15 – 0:35",
      "Revenue Integrity · The Audit Evidence Paradigm",
      "Our core law: 'Every alert shows its rows, its rule, and its rupees.' Clicking the top alert opens the audit evidence drawer: raw GPS breadcrumbs, missing ETM shift, the exact boolean rule, and ₹4,260 fare loss—with ground truth proving 100% precision."
    );
    await page.waitForTimeout(3000);

    // Click top alert row
    const firstTripLink = page.locator('a[href*="trip="]').first();
    if (await firstTripLink.isVisible({ timeout: 5000 })) {
      await firstTripLink.click();
      await page.waitForTimeout(2500);
    }

    // Scroll inside drawer
    await page.evaluate(() => {
      const drawer = document.querySelector('[role="dialog"]') || document.querySelector(".overflow-y-auto");
      if (drawer) drawer.scrollBy({ top: 350, behavior: "smooth" });
    });
    await page.waitForTimeout(4500);

    await page.evaluate(() => {
      const drawer = document.querySelector('[role="dialog"]') || document.querySelector(".overflow-y-auto");
      if (drawer) drawer.scrollBy({ top: -350, behavior: "smooth" });
    });
    await page.waitForTimeout(3500);

    // -------------------------------------------------------------
    // SCENE 3: 0:35 – 0:50 | Actionable Case Management Workflow
    // -------------------------------------------------------------
    console.log("[0:35 - 0:50] Scene 3: Actionable Case Management...");
    await injectCaption(
      page,
      "0:35 – 0:50",
      "Operational Actionability · Immutable Case Workflow",
      "An alert nobody owns is just a chart. The case is assigned to a depot recovery officer immutably. Crucially, resolving a case never mutates the underlying telemetry or financial detection data."
    );
    await page.waitForTimeout(2500);

    try {
      const statusSelect = page.locator('select, [role="combobox"]').first();
      if (await statusSelect.isVisible({ timeout: 3000 })) {
        await statusSelect.selectOption("acknowledged");
        await page.waitForTimeout(1500);
      }
      const saveBtn = page.getByRole("button", { name: /save case/i }).first();
      if (await saveBtn.isVisible({ timeout: 3000 })) {
        await saveBtn.click();
        await page.waitForTimeout(2500);
      }
    } catch (e) {
      console.log("Case interaction note:", e);
    }
    await page.waitForTimeout(4000);

    // -------------------------------------------------------------
    // SCENE 4: 0:50 – 1:05 | Demand Forecasting & Capacity Balancing
    // -------------------------------------------------------------
    console.log("[0:50 - 1:05] Scene 4: Demand Forecasting...");
    await navigateViaLink(page, "/demand", `${baseUrl}/demand`);
    await page.waitForTimeout(1500);
    await injectCaption(
      page,
      "0:50 – 1:05",
      "Demand Intelligence · Holt-Winters Seasonal Forecasting",
      "Additive Holt-Winters model in pure TypeScript with weekly seasonality, backtested on a 14-day holdout. Tomorrow's forecast predicts 383 boardings vs 320 seats—triggering an automated advisory to add two departures and capture ₹1.13L in fare demand."
    );
    await page.waitForTimeout(4500);

    await page.evaluate(() => window.scrollBy({ top: 350, behavior: "smooth" }));
    await page.waitForTimeout(4000);

    await page.evaluate(() => window.scrollBy({ top: -350, behavior: "smooth" }));
    await page.waitForTimeout(3000);

    // -------------------------------------------------------------
    // SCENE 5: 1:05 – 1:20 | Fleet Breakdown Risk Roster
    // -------------------------------------------------------------
    console.log("[1:05 - 1:20] Scene 5: Fleet Breakdown Risk...");
    await navigateViaLink(page, "/fleet", `${baseUrl}/fleet`);
    await page.waitForTimeout(1500);
    await injectCaption(
      page,
      "1:05 – 1:20",
      "Predictive Maintenance · 0–100 Breakdown Risk Score",
      "Instead of waiting for roadside breakdowns on NH-16, our risk engine computes an explainable 0–100 score: 30% service overdue, 25% breakdown history, 20% fleet age, 15% repeat repairs, 10% recent faults. Supervisors prioritize bay overhauls before on-road failure."
    );
    await page.waitForTimeout(3000);

    const vehicleLink = page.locator('a[href*="vehicle="]').first();
    if (await vehicleLink.isVisible({ timeout: 5000 })) {
      await vehicleLink.click();
      await page.waitForTimeout(3500);
    }
    await page.waitForTimeout(4000);

    // -------------------------------------------------------------
    // SCENE 6: 1:20 – 1:30 | Data Quality & Verification Scorecard
    // -------------------------------------------------------------
    console.log("[1:20 - 1:30] Scene 6: Data Quality & Scorecard...");
    await navigateViaLink(page, "/data-quality", `${baseUrl}/data-quality`);
    await page.waitForTimeout(1500);
    await injectCaption(
      page,
      "1:20 – 1:30",
      "Empirical Verification · 100% Precision & Recall",
      "The Data Quality console benchmarks our engines against 2,040 labeled ground-truth anomalies: 100% precision, 100% recall, 96.9% rupee recall, ₹9.76L detected, and 26 of 26 passing tests. Measured quality, zero guesswork for judges."
    );
    await page.waitForTimeout(6000);

    console.log("=== Walkthrough recording sequence finished ===");
  } catch (err) {
    console.error("Recording error:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Find the generated video file
  const files = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith(".webm"));
  if (files.length === 0) {
    console.error("No video file found in temp directory!");
    return;
  }

  const rawVideoPath = path.join(tempVideoDir, files[0]);
  const finalWebmPath = path.join(outputDir, "drishti-demo-90s.webm");
  const finalMp4Path = path.join(outputDir, "drishti-demo-90s.mp4");

  console.log(`Raw video saved: ${rawVideoPath}`);
  fs.copyFileSync(rawVideoPath, finalWebmPath);
  console.log(`Final WebM video saved: ${finalWebmPath}`);

  console.log("Converting raw video to MP4 with ffmpeg...");
  try {
    execSync(`ffmpeg -y -i "${rawVideoPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 "${finalMp4Path}"`, {
      stdio: "inherit",
    });
    console.log(`Final MP4 video generated successfully: ${finalMp4Path}`);
  } catch (err) {
    console.error("FFmpeg conversion error:", err);
  }

  try {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  } catch {}

  console.log("\n*** Video Recording Complete! ***");
  console.log(`1. WebM: ${finalWebmPath}`);
  console.log(`2. MP4:  ${finalMp4Path}`);
}

main().catch(console.error);
