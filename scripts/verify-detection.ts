import { scoreDetections } from "../src/core/scorecard";
import { getScorecardForWindow } from "../src/server/queries/revenue";
import { inr, num, pct } from "../src/lib/utils";

/**
 * Prints the detection scorecard against the injected ground truth.
 * `npm run verify` — the same numbers the Revenue Integrity page displays.
 */
const { detections, truth } = getScorecardForWindow(90);
const card = scoreDetections(
  detections.map((d) => ({ entityId: d.tripId, kind: d.kind, rupeesImpact: d.rupeesImpact })),
  truth,
);

console.log("\nDrishti — detection quality vs injected ground truth (90 days)\n");
console.log(`  Ground-truth anomalies   ${num(card.truthCount)}`);
console.log(`  Detected                 ${num(card.detectedCount)}`);
console.log(`  Matched                  ${num(card.matched)}`);
console.log(`  False positives          ${num(card.falsePositives)}`);
console.log(`  Missed                   ${num(card.missed)}`);
console.log(`  Precision                ${pct(card.precision, 1)}`);
console.log(`  Recall                   ${pct(card.recall, 1)}`);
console.log(`  F1                       ${pct(card.f1, 1)}`);
console.log(`  Rupees detected          ${inr(card.detectedRupees)}`);
console.log(`  Rupee recall             ${pct(card.rupeeRecall, 1)}`);
console.log("");
for (const kind of card.byKind) {
  console.log(
    `  ${kind.kind.padEnd(20)} truth ${String(kind.truthCount).padStart(4)}  detected ${String(
      kind.detectedCount,
    ).padStart(4)}  matched ${String(kind.matched).padStart(4)}  recall ${pct(kind.recall, 1)}`,
  );
}
console.log("");
