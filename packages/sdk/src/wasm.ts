// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol SDK — WASM Bridge
// ═══════════════════════════════════════════════════════════════════
//
// This module loads the MyShape WASM engine and provides a typed
// interface to its functions. The WASM binary is loaded lazily on
// first use (progressive enhancement — the SDK works without it
// for server-side operations).
//
// Browser only. Not imported in Node.js/server contexts.

/** MyShape WASM module interface */
interface WasmEngine {
  generate_challenge(session_key_hex: string): string;
  extract_signature(motion_json: string): string;
  extract_feature_vector(motion_json: string): string;
  create_enrollment(signatures_json: string, user_id: string, device_json: string): string;
  similarity(enrollment_json: string, response_json: string): number;
  verify_intent(
    enrollment_json: string,
    challenge_json: string,
    response_json: string,
    signature_json: string,
    risk_level: string,
  ): string;
  load_calibration(artifact_json: string): boolean;
  is_calibrated(): boolean;
  get_feature_dim(): number;
}

let engine: WasmEngine | null = null;
let loading: Promise<WasmEngine> | null = null;

/**
 * Load the MyShape WASM engine.
 *
 * The WASM binary (~200 KB) is loaded asynchronously on first call.
 * Subsequent calls return the cached engine.
 */
export async function loadEngine(): Promise<WasmEngine> {
  if (engine) return engine;
  if (loading) return loading;

  loading = (async () => {
    if (typeof window === "undefined") {
      throw new Error("MyShape WASM engine requires a browser environment");
    }

    // Dynamic import of the WASM JS glue code.
    // The .wasm file is loaded relative to the JS file by wasm-bindgen.
    const wasmModule = await import("../wasm/myshape_wasm.js");

    // Initialize the WASM module (triggers .wasm download)
    await wasmModule.default();

    engine = wasmModule as unknown as WasmEngine;
    return engine;
  })();

  return loading;
}

/** Check if WASM engine is loaded */
export function isEngineLoaded(): boolean {
  return engine !== null;
}

export type { WasmEngine };
