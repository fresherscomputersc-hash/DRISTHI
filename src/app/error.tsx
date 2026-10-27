"use client";

import { DatabaseZap } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message ?? "";
  const looksLikeMissingData =
    /no such table|unable to open database|drishti\.db/i.test(message);

  return (
    <div className="mx-auto mt-10 max-w-xl">
      <div className="surface p-6">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-warning-subtle text-warning">
          <DatabaseZap className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-3 text-title font-bold">
          {looksLikeMissingData ? "The dataset has not been built yet" : "Something broke while reading the ledger"}
        </h2>
        <p className="mt-1 text-body text-muted-foreground">
          {looksLikeMissingData
            ? "Drishti reads a local SQLite file. Generate it once, then reload this page."
            : "The console could not finish this view. The underlying query is shown below — no data was changed."}
        </p>

        {looksLikeMissingData ? (
          <pre className="mt-3 overflow-x-auto rounded border border-border bg-muted/50 px-3 py-2 font-mono text-label">
            npm run seed{"\n"}npm run dev
          </pre>
        ) : (
          <pre className="mt-3 max-h-40 overflow-auto rounded border border-border bg-muted/50 px-3 py-2 font-mono text-micro text-muted-foreground">
            {message || "Unknown error"}
            {error.digest ? `\n\ndigest ${error.digest}` : ""}
          </pre>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-8 items-center rounded bg-primary px-3 text-body font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-8 items-center rounded border border-border px-3 text-body hover:bg-muted/60"
          >
            Back to Command Center
          </a>
        </div>
      </div>
    </div>
  );
}
