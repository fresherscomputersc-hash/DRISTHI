"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateCase } from "@/server/actions/cases";
import { Button } from "@/components/ui/button";
import type { CaseStatus } from "@/core/types";

const ASSIGNEES = [
  "R. Mohapatra (Finance)",
  "S. Patnaik (Revenue Audit)",
  "B. Das (Depot BBS)",
  "A. Behera (Depot CTC)",
  "M. Sahu (Maintenance)",
];

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
];

export function CaseForm({
  tripId,
  kind,
  rupeesImpact,
  current,
}: {
  tripId: string;
  kind: string;
  rupeesImpact: number;
  current: { status: CaseStatus; assignee: string | null; note: string | null } | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CaseStatus>(current?.status ?? "open");
  const [assignee, setAssignee] = useState(current?.assignee ?? "");
  const [note, setNote] = useState(current?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateCase({
        tripId,
        kind,
        rupeesImpact,
        status,
        assignee: assignee || null,
        note: note || null,
      });
      if (result.ok) {
        setMessage(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CaseStatus)}
            className="mt-1 h-8 w-full rounded border border-input bg-card px-2 text-body outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow">Assignee</span>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="mt-1 h-8 w-full rounded border border-input bg-card px-2 text-body outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Unassigned</option>
            {ASSIGNEES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="eyebrow">Case note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What was checked, and what was recovered?"
          className="mt-1 w-full resize-y rounded border border-input bg-card px-2 py-1.5 text-body outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="md" onClick={submit} disabled={pending}>
          {pending ? "Saving…" : "Save case"}
        </Button>
        {message ? (
          <p role="status" className="text-label text-success">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-label text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
