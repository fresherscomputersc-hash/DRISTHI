"use server";

import { revalidatePath } from "next/cache";
import { getSqlite } from "@/db/client";
import type { CaseStatus } from "@/core/types";

export type CaseActionInput = {
  tripId: string;
  kind: string;
  rupeesImpact: number;
  status: CaseStatus;
  assignee?: string | null;
  note?: string | null;
};

export type CaseActionResult = { ok: boolean; message: string };

export async function updateCase(input: CaseActionInput): Promise<CaseActionResult> {
  const allowed: CaseStatus[] = ["open", "acknowledged", "assigned", "resolved"];
  if (!allowed.includes(input.status)) {
    return { ok: false, message: "Unknown case status." };
  }
  if (input.status === "assigned" && !input.assignee) {
    return { ok: false, message: "Choose an assignee before moving the case to Assigned." };
  }

  const db = getSqlite();
  const caseKey = `${input.tripId}:${input.kind}`;
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT id FROM cases WHERE case_key = ?")
    .get(caseKey) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE cases
       SET status = ?, assignee = COALESCE(?, assignee), note = COALESCE(?, note), updated_at = ?
       WHERE id = ?`,
    ).run(input.status, input.assignee ?? null, input.note ?? null, now, existing.id);
  } else {
    db.prepare(
      `INSERT INTO cases (case_key, trip_id, kind, rupees_impact, status, assignee, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      caseKey,
      input.tripId,
      input.kind,
      input.rupeesImpact,
      input.status,
      input.assignee ?? null,
      input.note ?? null,
      now,
      now,
    );
  }

  revalidatePath("/revenue");
  revalidatePath("/");

  return {
    ok: true,
    message:
      input.status === "resolved"
        ? "Case resolved and removed from the open queue."
        : `Case moved to ${input.status}.`,
  };
}
