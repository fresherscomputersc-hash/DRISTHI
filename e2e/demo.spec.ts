import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";

/**
 * The demo path, end to end: an alert is ranked by rupees, opens into evidence,
 * and can be moved through the case workflow. These tests assert the promise the
 * product makes — not pixel layout.
 */
const DB_PATH = path.resolve(__dirname, "../data/drishti.db");

test.describe("Drishti demo path", () => {
  test("command center ranks alerts with rupee impact", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main").getByRole("heading", { name: "Command Center" })).toBeVisible();
    await expect(page.getByText("Revenue at risk").first()).toBeVisible();

    const rows = page.locator("table tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(page.getByText(/synthetic/i).first()).toBeVisible();
  });

  test("every alert opens an evidence drawer", async ({ page }) => {
    await page.goto("/revenue?days=90");
    await page.locator('a[href*="trip="]').first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Why this fired").first()).toBeVisible();
    await expect(drawer.getByText(/Injected ground truth/i).first()).toBeVisible();
    await expect(drawer.getByText("Tickets issued").first()).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Save case" })).toBeVisible();
  });

  test("a case can be moved and persists", async ({ page }) => {
    await page.goto("/revenue?days=90");
    await page.locator('a[href*="trip="]').first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    const tripId = new URL(page.url()).searchParams.get("trip");
    expect(tripId).toBeTruthy();

    await drawer.getByLabel("Status").selectOption("acknowledged");
    await drawer.getByRole("button", { name: "Save case" }).click();
    await expect(drawer.getByRole("status")).toHaveText("Case moved to acknowledged.");

    const read = new Database(DB_PATH, { readonly: true });
    const row = read.prepare("SELECT status FROM cases WHERE trip_id = ?").get(tripId) as
      | { status: string }
      | undefined;
    read.close();
    expect(row?.status).toBe("acknowledged");

    // Leave the seeded ledger as it was found.
    const write = new Database(DB_PATH);
    write.prepare("DELETE FROM cases WHERE trip_id = ?").run(tripId);
    write.close();
  });

  test("demand recommends deployment with a stated model", async ({ page }) => {
    await page.goto("/demand");
    await expect(page.locator("#main").getByRole("heading", { name: "Demand Intelligence" })).toBeVisible();
    await expect(page.getByText("Deployment recommendation").first()).toBeVisible();
    await expect(page.getByText("Model card").first()).toBeVisible();
    await expect(page.getByText(/short of seats/i).first()).toBeVisible();
  });

  test("fleet decomposes a risk score into its factors", async ({ page }) => {
    await page.goto("/fleet");
    await page.locator('a[href*="vehicle="]').first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Score decomposition").first()).toBeVisible();
    await expect(drawer.getByText("Maintenance history").first()).toBeVisible();
  });

  test("data quality publishes measured precision", async ({ page }) => {
    await page.goto("/data-quality");
    await expect(page.locator("#main").getByRole("heading", { name: "Data Quality" })).toBeVisible();
    await expect(page.getByText("Precision").first()).toBeVisible();
    await expect(page.getByText("100.0%").first()).toBeVisible();
    await expect(page.getByText(/2,070 labelled anomalies/i)).toBeVisible();
  });
});
