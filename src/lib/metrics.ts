/**
 * src/lib/metrics.ts
 *
 * Canonical source of truth for every publicly-quoted metric on the MyShape
 * Protocol website. Any number shown on a product surface (homepage, evidence,
 * research-observatory, protocol, whitepaper, compare) MUST come from here —
 * never a hardcoded literal in a component.
 *
 * Two rules govern this file:
 *   1. Never modify the underlying experiment data. Values are recorded as
 *      published, with provenance (kind / id / version / date). Editing a value
 *      here is a data edit, not a copy edit.
 *   2. Never delete a historical value to "unify" numbers. When a metric is
 *      superseded, keep the old entry and flip `current: false`; add a new
 *      entry with `current: true`.
 *
 * ── MetricStatus (research-confidence) ──────────────────────────────
 * A graduated confidence level for how well a published number is supported.
 * This is DISTINCT from the engine's `EvidenceStatus`
 * (src/lib/evidence/types.ts: "PASS" | "FAIL" | "INSUFFICIENT"), which is a
 * per-component runtime verdict. `MetricStatus` describes the maturity of a
 * published claim, not the outcome of a single verification.
 *
 * Level progression (weakest → strongest):
 *   HYPOTHESIS          — proposed but not yet evidenced
 *   PRELIMINARY         — early / single-lab result, small-N, not replicated
 *   OBSERVED            — measured in at least one completed run
 *   REPLICATED          — reproduced independently
 *   EXTERNALLY_REVIEWED — independently audited
 *   FALSIFIED           — shown to be false
 *
 * There is deliberately NO "SECURITY-READY" level.
 *
 * The entropy-gap claim itself is HYPOTHESIS (repositioned from the former
 * "Entropy Gap Theorem"). The PES benchmark numbers below are the PRELIMINARY
 * empirical support for it — single-lab, not externally replicated.
 */

export type MetricStatus =
  | "HYPOTHESIS"
  | "PRELIMINARY"
  | "OBSERVED"
  | "REPLICATED"
  | "EXTERNALLY_REVIEWED"
  | "FALSIFIED";

/** Ordered weakest → strongest support. */
export const METRIC_STATUS_ORDER: readonly MetricStatus[] = [
  "HYPOTHESIS",
  "PRELIMINARY",
  "OBSERVED",
  "REPLICATED",
  "EXTERNALLY_REVIEWED",
  "FALSIFIED",
] as const;

export type MetricSourceKind =
  | "experiment"
  | "benchmark"
  | "dataset"
  | "research-note";

export interface MetricSource {
  /** What kind of source produced the number. */
  kind: MetricSourceKind;
  /** Stable identifier — engine id, benchmark id, or research-note id. */
  id: string;
  /** Protocol/engine/benchmark version that produced it, if applicable. */
  version?: string;
  /**
   * Date the number was produced or last updated. ISO `YYYY-MM-DD`, or `YYYY-MM`
   * where the exact day is not recorded. Precise days should be backfilled from
   * the experiment logs when available.
   */
  date: string;
  /** Clarification — scope, caveats, or relationship to other metrics. */
  note?: string;
}

export interface Metric {
  /** Stable lookup key (e.g. "ee003.passRate"). */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Canonical numeric value. */
  value: number;
  /** Display unit ("%", "runs", "samples", "tests"). Omit for unitless ratios. */
  unit?: string;
  /** Research-confidence level of the claim this number supports. */
  status: MetricStatus;
  /** true = currently displayed; false = superseded but retained for history. */
  current: boolean;
  source: MetricSource;
}

/**
 * Canonical metrics. Each entry is a single published number with provenance.
 * Values match what the public surfaces currently quote; nothing has been
 * re-derived or "reconciled" here — that would be a data edit.
 */
export const METRICS = [
  // ── Experiment counts ──
  {
    key: "experiments.total",
    label: "Total experiments run",
    value: 576,
    unit: "experiments",
    status: "OBSERVED",
    current: true,
    source: {
      kind: "experiment",
      id: "all-engines",
      date: "2026-07-19",
      note: "Point-in-time total across EE-001/EE-002/EE-003 + VS-001. Superseded by later runs; the public surface has not been updated.",
    },
  },
  {
    key: "experiments.pesEntropy",
    label: "PES entropy-scoring experiments",
    value: 381,
    unit: "experiments",
    status: "OBSERVED",
    current: true,
    source: {
      kind: "experiment",
      id: "EE-001",
      date: "2026-07-26",
      note: "Subset of the total: 4-dimensional entropy scoring (the entropy-gap line of work).",
    },
  },

  // ── Dataset / sample counts ──
  {
    key: "dataset.benchmarkSamples",
    label: "Benchmark samples",
    value: 281,
    unit: "samples",
    status: "OBSERVED",
    current: true,
    source: { kind: "dataset", id: "PES-Benchmark", date: "2026-07" },
  },

  // ── EE-002 — cross-modal causal coupling ──
  {
    key: "ee002.trials",
    label: "EE-002 cross-modal trials",
    value: 316,
    unit: "trials",
    status: "OBSERVED",
    current: true,
    source: { kind: "experiment", id: "EE-002", date: "2026-07" },
  },
  {
    key: "ee002.temporalAlignmentRate",
    label: "EE-002 temporal alignment rate",
    value: 100,
    unit: "%",
    status: "OBSERVED",
    current: true,
    source: {
      kind: "experiment",
      id: "EE-002",
      date: "2026-07",
      note: "Cross-modal temporal alignment succeeded on all 316 trials. Distinct from the full pass rate.",
    },
  },
  {
    key: "ee002.passRate",
    label: "EE-002 full pass rate",
    value: 58,
    unit: "%",
    status: "OBSERVED",
    current: true,
    source: {
      kind: "experiment",
      id: "EE-002",
      date: "2026-07",
      note: "Full causal-coupling pass rate — distinct from the 100% temporal-alignment rate on the same N.",
    },
  },

  // ── EE-003 — challenge-response ──
  {
    key: "ee003.trials",
    label: "EE-003 challenge-response trials",
    value: 200,
    unit: "runs",
    status: "OBSERVED",
    current: true,
    source: { kind: "experiment", id: "EE-003", date: "2026-07" },
  },
  {
    key: "ee003.passRate",
    label: "EE-003 pass rate",
    value: 59,
    unit: "%",
    status: "OBSERVED",
    current: true,
    source: { kind: "experiment", id: "EE-003", date: "2026-07" },
  },

  // ── VS-001 — verification session ──
  {
    key: "vs001.sessions",
    label: "VS-001 verification sessions",
    value: 60,
    unit: "sessions",
    status: "OBSERVED",
    current: true,
    source: { kind: "experiment", id: "VS-001", date: "2026-07" },
  },
  {
    key: "vs001.passRate",
    label: "VS-001 dual-engine pass rate",
    value: 93,
    unit: "%",
    status: "OBSERVED",
    current: true,
    source: { kind: "experiment", id: "VS-001", date: "2026-07" },
  },

  // ── Reference verifier / conformance ──
  {
    key: "referenceVerifier.tests",
    label: "Reference verifier conformance tests",
    value: 120,
    unit: "tests",
    status: "OBSERVED",
    current: true,
    source: {
      kind: "benchmark",
      id: "CPS-0001-conformance",
      date: "2026-07",
      note: "Conformance-suite test count. Also quoted on the evidence page next to a 'PES benchmark' label — that label pairing is unresolved (see report).",
    },
  },

  // ── PES benchmark — human-vs-AI separation ──
  {
    key: "pes.cohensD",
    label: "PES human-vs-AI Cohen's d",
    value: 2.1,
    status: "PRELIMINARY",
    current: true,
    source: {
      kind: "benchmark",
      id: "PES-Benchmark",
      date: "2026-07",
      note: "Single-lab benchmark result; not externally replicated.",
    },
  },
  {
    key: "pes.auc",
    label: "PES human-vs-AI AUC",
    value: 0.94,
    status: "PRELIMINARY",
    current: true,
    source: {
      kind: "benchmark",
      id: "PES-Benchmark",
      date: "2026-07",
      note: "Single-lab benchmark result; not externally replicated.",
    },
  },

  // ── PES benchmark — illustrative table rows ──
  {
    key: "pes.benchmark.genuine",
    label: "PES benchmark — genuine human score",
    value: 0.9817,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Illustrative benchmark row." },
  },
  {
    key: "pes.benchmark.aiForgery",
    label: "PES benchmark — AI forgery score",
    value: 0.5857,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Illustrative benchmark row." },
  },
  {
    key: "pes.benchmark.impostor",
    label: "PES benchmark — impostor score",
    value: 0,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Illustrative benchmark row." },
  },
  {
    key: "pes.benchmark.gap",
    label: "PES benchmark — human−AI gap",
    value: 0.396,
    status: "OBSERVED",
    current: true,
    source: {
      kind: "benchmark",
      id: "PES-Benchmark",
      date: "2026-07",
      note: "Human−AI gap = genuine − AI-forgery (0.9817 − 0.5857 = 0.3960).",
    },
  },

  // ── PES component sub-scores (illustrative single sample) ──
  {
    key: "pes.components.kinematics",
    label: "PES kinematics sub-score",
    value: 0.42,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Bone length ratios. Illustrative sample, not an aggregate." },
  },
  {
    key: "pes.components.acceleration",
    label: "PES acceleration sub-score",
    value: 0.88,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Hurst exponent. Illustrative sample, not an aggregate." },
  },
  {
    key: "pes.components.jerk",
    label: "PES jerk sub-score",
    value: 0.15,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "MAD + lag-1. Illustrative sample, not an aggregate." },
  },
  {
    key: "pes.components.jerkSpectrum",
    label: "PES jerk-spectrum sub-score",
    value: 0.71,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "1/f scaling. Illustrative sample, not an aggregate." },
  },
  {
    key: "pes.components.composite",
    label: "PES composite score",
    value: 0.94,
    status: "OBSERVED",
    current: true,
    source: { kind: "benchmark", id: "PES-Benchmark", date: "2026-07", note: "Composite PES score. Illustrative sample, not an aggregate." },
  },
] as const satisfies readonly Metric[];

export type MetricKey = (typeof METRICS)[number]["key"];

const byKey = new Map<string, Metric>(METRICS.map((m) => [m.key, m]));

/** Canonical metric by key. Throws on an unknown key so a bad reference fails loudly. */
export function getMetric(key: MetricKey): Metric {
  const m = byKey.get(key);
  if (!m) throw new Error(`[metrics] unknown metric key: ${key}`);
  return m;
}

/** Canonical numeric value for a key — the common consumer convenience. */
export function metricValue(key: MetricKey): number {
  return getMetric(key).value;
}
