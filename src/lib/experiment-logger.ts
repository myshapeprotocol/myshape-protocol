// ═══════════════════════════════════════════════════════════════════
// Experiment Logger — automatic run recording for all evidence engines
//
// Saves structured run data to localStorage so every phone experiment
// is preserved without manual copy-paste. Export as JSON for analysis.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = "myshape-experiment-runs";

export interface LoggedComponent {
  metric: string;
  value: number;
  threshold: number;
  status: string;
}

export interface LoggedRound {
  round: number;
  direction: string;
  directionMatch: boolean;
  magnitudeStatus: string;
  angleDeg: number;
  peakG: number;
  sampleCount: number;
  // Observational EE-003 forensics (REAL-TRY-003+): signed peak + axis so each
  // run is scientifically comparable. Strictly reads existing analyzeRound
  // output — does not change any scoring, threshold, or verdict.
  axis?: "rx" | "ry";
  expectedSign?: number;
  signedPeakDegS?: number;
}

export interface ExperimentRun {
  id: string;
  engineId: string;
  timestamp: string;
  isSimulated: boolean;
  verdict: string;
  confidence: number;
  components: LoggedComponent[];
  diagnostics: string[];
  // EE-003 / VS-001
  roundResults?: LoggedRound[];
  // VS-001
  passiveScore?: number;
  decision?: string;
  // PE-001
  imuCount?: number;
  camCount?: number;
  matchCount?: number;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveRun(run: ExperimentRun): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const runs: ExperimentRun[] = raw ? JSON.parse(raw) : [];
    runs.push(run);
    // Keep last 500 runs max (~2MB)
    if (runs.length > 500) runs.splice(0, runs.length - 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    // localStorage full or inaccessible — silent fail, don't break the experiment
  }
}

export function getRuns(): ExperimentRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getRunCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}

export function getRunsByEngine(engineId: string): ExperimentRun[] {
  return getRuns().filter((r) => r.engineId === engineId);
}

export function clearRuns(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

export function exportJSON(): string {
  const runs = getRuns();
  return JSON.stringify(runs, null, 2);
}
