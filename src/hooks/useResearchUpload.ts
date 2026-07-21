"use client";

/**
 * useResearchUpload — Anonymous motion landmark research upload hook.
 *
 * Generates ephemeral session UUID, detects coarse device info,
 * and provides a fire-and-forget upload function for Phase E-1 data collection.
 *
 * Privacy: no cookies, no fingerprint, no email. UUID is session-scoped.
 */

import { useState, useCallback, useRef } from "react";
import type {
  ResearchUploadPayload,
  ResearchUploadResponse,
  ResearchDeviceInfo,
  LightingCondition,
  LandmarkFrameEntry,
  PhaseMetadata,
} from "@/types/research";

export type UploadState = "idle" | "uploading" | "success" | "error";

interface UseResearchUploadReturn {
  /** Current upload state */
  state: UploadState;
  /** Last error message (if state === "error") */
  error: string | null;
  /** The generated session UUID (available after first call) */
  sessionId: string;
  /** Coarse device info (available after first call) */
  deviceInfo: ResearchDeviceInfo;
  /** Initiate an anonymous research upload */
  upload: (data: UploadData) => Promise<boolean>;
  /** Reset state back to idle */
  reset: () => void;
}

export interface UploadData {
  landmarks: LandmarkFrameEntry[];
  pesScore: number;
  pesMicroTiming: number;
  pesNoiseResidual: number;
  pesFreqEntropy: number;
  pesBioPerturb: number;
  totalFrames: number;
  validFrames: number;
  durationMs: number;
  lighting: LightingCondition;
  phases: PhaseMetadata[];
}

// ── UUID v4 generator (crypto-safe, no external deps) ──

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Coarse device detection ──

function detectOS(): ResearchDeviceInfo["os"] {
  if (typeof window === "undefined") return "Unknown";
  const ua = window.navigator.userAgent;
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  return "Unknown";
}

function detectBrowser(): ResearchDeviceInfo["browser"] {
  if (typeof window === "undefined") return "Unknown";
  const ua = window.navigator.userAgent;
  // Check Firefox first (its UA contains "like Gecko" but also "Firefox")
  if (/Firefox/i.test(ua)) return "Firefox";
  // Edge before Chrome (Edge UA contains "Chrome")
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  return "Unknown";
}

function detectIMU(): boolean {
  if (typeof window === "undefined") return false;
  return "DeviceMotionEvent" in window;
}

function getDeviceInfo(): ResearchDeviceInfo {
  return {
    os: detectOS(),
    browser: detectBrowser(),
    viewportWidth: typeof window !== "undefined" ? window.innerWidth : 0,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    imuAvailable: detectIMU(),
  };
}

// ── Hook ──

export function useResearchUpload(): UseResearchUploadReturn {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(generateUUID());
  const deviceInfoRef = useRef<ResearchDeviceInfo>(getDeviceInfo());

  const upload = useCallback(
    async (data: UploadData): Promise<boolean> => {
      setState("uploading");
      setError(null);

      // Route C: Auto-attach Genesis node_handle if available
      const nodeHandle = typeof window !== "undefined"
        ? sessionStorage.getItem("sovereign_node_handle") ?? null
        : null;

      const payload: ResearchUploadPayload = {
        session_id: sessionIdRef.current,
        ...(nodeHandle ? { node_handle: nodeHandle } : {}),
        device: deviceInfoRef.current,
        lighting: data.lighting,
        duration_ms: data.durationMs,
        landmarks: data.landmarks,
        pes_score: data.pesScore,
        pes_micro_timing: data.pesMicroTiming,
        pes_noise_residual: data.pesNoiseResidual,
        pes_freq_entropy: data.pesFreqEntropy,
        pes_bio_perturb: data.pesBioPerturb,
        total_frames: data.totalFrames,
        valid_frames: data.validFrames,
        phases: data.phases,
      };

      try {
        const res = await fetch("/api/research/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json: ResearchUploadResponse = await res.json();

        if (res.ok && json.success) {
          setState("success");
          return true;
        }

        setState("error");
        setError(json.error ?? `HTTP ${res.status}`);
        return false;
      } catch (err: unknown) {
        setState("error");
        setError(err instanceof Error ? err.message : "Network error");
        return false;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  return {
    state,
    error,
    sessionId: sessionIdRef.current,
    deviceInfo: deviceInfoRef.current,
    upload,
    reset,
  };
}
