export type Detected = { entityId: string; kind: string; rupeesImpact: number };
export type Truth = { entityId: string; kind: string; rupeesImpact: number };

export type KindScore = {
  kind: string;
  truthCount: number;
  detectedCount: number;
  matched: number;
  recall: number;
  precision: number;
};

export type Scorecard = {
  truthCount: number;
  detectedCount: number;
  matched: number;
  falsePositives: number;
  missed: number;
  precision: number;
  recall: number;
  f1: number;
  truthRupees: number;
  detectedRupees: number;
  matchedRupees: number;
  rupeeRecall: number;
  byKind: KindScore[];
};

const key = (e: { entityId: string; kind: string }) => `${e.entityId}::${e.kind}`;

/**
 * Score detections against injected ground truth.
 * Matching is exact on (entity, anomaly kind) — no fuzzy credit.
 */
export function scoreDetections(detections: Detected[], truth: Truth[]): Scorecard {
  const truthKeys = new Set(truth.map(key));
  const detectionKeys = new Set(detections.map(key));

  const matchedDetections = detections.filter((d) => truthKeys.has(key(d)));
  const falsePositives = detections.filter((d) => !truthKeys.has(key(d)));
  const missed = truth.filter((t) => !detectionKeys.has(key(t)));

  const precision = detections.length === 0 ? 0 : matchedDetections.length / detections.length;
  const recall = truth.length === 0 ? 0 : matchedDetections.length / truth.length;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const truthRupees = truth.reduce((s, t) => s + t.rupeesImpact, 0);
  const detectedRupees = detections.reduce((s, d) => s + d.rupeesImpact, 0);
  const matchedRupees = matchedDetections.reduce((s, d) => s + d.rupeesImpact, 0);

  const kinds = Array.from(new Set([...truth.map((t) => t.kind), ...detections.map((d) => d.kind)]));
  const byKind: KindScore[] = kinds.map((kind) => {
    const t = truth.filter((x) => x.kind === kind);
    const d = detections.filter((x) => x.kind === kind);
    const matched = d.filter((x) => truthKeys.has(key(x))).length;
    return {
      kind,
      truthCount: t.length,
      detectedCount: d.length,
      matched,
      recall: t.length === 0 ? 0 : Number(((matched / t.length) * 100).toFixed(1)),
      precision: d.length === 0 ? 0 : Number(((matched / d.length) * 100).toFixed(1)),
    };
  });

  return {
    truthCount: truth.length,
    detectedCount: detections.length,
    matched: matchedDetections.length,
    falsePositives: falsePositives.length,
    missed: missed.length,
    precision: Number((precision * 100).toFixed(1)),
    recall: Number((recall * 100).toFixed(1)),
    f1: Number((f1 * 100).toFixed(1)),
    truthRupees,
    detectedRupees,
    matchedRupees,
    rupeeRecall: truthRupees === 0 ? 0 : Number(((matchedRupees / truthRupees) * 100).toFixed(1)),
    byKind: byKind.sort((a, b) => b.truthCount - a.truthCount),
  };
}
