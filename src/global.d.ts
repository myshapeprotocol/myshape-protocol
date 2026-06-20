/* ── 全局类型声明 ── */

// MediaPipe Pose
interface PoseResult {
  poseLandmarks?: Array<{ x: number; y: number; z: number }>;
}

interface PoseInstance {
  setOptions(opts: Record<string, unknown>): void;
  onResults(cb: (results: PoseResult) => void): void;
  send(opts: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

interface PoseConstructor {
  new (opts: { locateFile: (file: string) => string }): PoseInstance;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
  Pose?: PoseConstructor;
}
