"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// wasm/myshape_wasm.js
var require_myshape_wasm = __commonJS({
  "wasm/myshape_wasm.js"(exports2, module2) {
    "use strict";
    function create_enrollment(signatures_json, user_id, device_json) {
      let deferred5_0;
      let deferred5_1;
      try {
        const ptr0 = passStringToWasm0(signatures_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(user_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(device_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.create_enrollment(ptr0, len0, ptr1, len1, ptr2, len2);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
          ptr4 = 0;
          len4 = 0;
          throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
      } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
      }
    }
    exports2.create_enrollment = create_enrollment;
    function extract_feature_vector(motion_json) {
      let deferred3_0;
      let deferred3_1;
      try {
        const ptr0 = passStringToWasm0(motion_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.extract_feature_vector(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
          ptr2 = 0;
          len2 = 0;
          throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
      } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
      }
    }
    exports2.extract_feature_vector = extract_feature_vector;
    function extract_signature(motion_json) {
      let deferred3_0;
      let deferred3_1;
      try {
        const ptr0 = passStringToWasm0(motion_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.extract_signature(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
          ptr2 = 0;
          len2 = 0;
          throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
      } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
      }
    }
    exports2.extract_signature = extract_signature;
    function generate_ai_motion(duration_s, fps, amplitude) {
      let deferred1_0;
      let deferred1_1;
      try {
        const ret = wasm.generate_ai_motion(duration_s, fps, amplitude);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
      } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
      }
    }
    exports2.generate_ai_motion = generate_ai_motion;
    function generate_challenge(session_key_hex) {
      let deferred3_0;
      let deferred3_1;
      try {
        const ptr0 = passStringToWasm0(session_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.generate_challenge(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
          ptr2 = 0;
          len2 = 0;
          throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
      } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
      }
    }
    exports2.generate_challenge = generate_challenge;
    function generate_human_motion(duration_s, fps, amplitude) {
      let deferred1_0;
      let deferred1_1;
      try {
        const ret = wasm.generate_human_motion(duration_s, fps, amplitude);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
      } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
      }
    }
    exports2.generate_human_motion = generate_human_motion;
    function get_calibration_info() {
      const ret = wasm.get_calibration_info();
      let v1;
      if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
      }
      return v1;
    }
    exports2.get_calibration_info = get_calibration_info;
    function get_feature_dim() {
      const ret = wasm.get_feature_dim();
      return ret >>> 0;
    }
    exports2.get_feature_dim = get_feature_dim;
    function init_panic_hook() {
      wasm.init_panic_hook();
    }
    exports2.init_panic_hook = init_panic_hook;
    function is_calibrated() {
      const ret = wasm.is_calibrated();
      return ret !== 0;
    }
    exports2.is_calibrated = is_calibrated;
    function load_calibration(artifact_json) {
      const ptr0 = passStringToWasm0(artifact_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ret = wasm.load_calibration(ptr0, len0);
      if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
      }
      return ret[0] !== 0;
    }
    exports2.load_calibration = load_calibration;
    function reset_calibration() {
      wasm.reset_calibration();
    }
    exports2.reset_calibration = reset_calibration;
    function similarity(enrollment_json, response_json) {
      const ptr0 = passStringToWasm0(enrollment_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(response_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      const ret = wasm.similarity(ptr0, len0, ptr1, len1);
      return ret;
    }
    exports2.similarity = similarity;
    function verify_intent(enrollment_json, challenge_json, response_json, signature_json, risk_level) {
      let deferred7_0;
      let deferred7_1;
      try {
        const ptr0 = passStringToWasm0(enrollment_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(challenge_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(response_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(signature_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(risk_level, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.verify_intent(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        var ptr6 = ret[0];
        var len6 = ret[1];
        if (ret[3]) {
          ptr6 = 0;
          len6 = 0;
          throw takeFromExternrefTable0(ret[2]);
        }
        deferred7_0 = ptr6;
        deferred7_1 = len6;
        return getStringFromWasm0(ptr6, len6);
      } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
      }
    }
    exports2.verify_intent = verify_intent;
    function __wbg_get_imports() {
      const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_function_acc5528be2b923f2: function(arg0) {
          const ret = typeof arg0 === "function";
          return ret;
        },
        __wbg___wbindgen_is_object_0beba4a1980d3eea: function(arg0) {
          const val = arg0;
          const ret = typeof val === "object" && val !== null;
          return ret;
        },
        __wbg___wbindgen_is_string_1fca8072260dd261: function(arg0) {
          const ret = typeof arg0 === "string";
          return ret;
        },
        __wbg___wbindgen_is_undefined_721f8decd50c87a3: function(arg0) {
          const ret = arg0 === void 0;
          return ret;
        },
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
          throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_5575218572ead796: function() {
          return handleError(function(arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
          }, arguments);
        },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
          const ret = arg0.crypto;
          return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
          let deferred0_0;
          let deferred0_1;
          try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
          } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
          }
        },
        __wbg_getRandomValues_a697888e9ba1eee3: function() {
          return handleError(function(arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
          }, arguments);
        },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() {
          return handleError(function(arg0, arg1) {
            arg0.getRandomValues(arg1);
          }, arguments);
        },
        __wbg_length_589238bdcf171f0e: function(arg0) {
          const ret = arg0.length;
          return ret;
        },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
          const ret = arg0.msCrypto;
          return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
          const ret = new Error();
          return ret;
        },
        __wbg_new_with_length_9b650f44b5c44a4e: function(arg0) {
          const ret = new Uint8Array(arg0 >>> 0);
          return ret;
        },
        __wbg_node_84ea875411254db1: function(arg0) {
          const ret = arg0.node;
          return ret;
        },
        __wbg_now_d2e0afbad4edbe82: function() {
          const ret = Date.now();
          return ret;
        },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
          const ret = arg0.process;
          return ret;
        },
        __wbg_prototypesetcall_d721637c7ca66eb8: function(arg0, arg1, arg2) {
          Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() {
          return handleError(function(arg0, arg1) {
            arg0.randomFillSync(arg1);
          }, arguments);
        },
        __wbg_require_b4edbdcf3e2a1ef0: function() {
          return handleError(function() {
            const ret = module2.require;
            return ret;
          }, arguments);
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
          const ret = arg1.stack;
          const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          const len1 = WASM_VECTOR_LEN;
          getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
          getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_2fee5048bcca5938: function() {
          const ret = typeof globalThis === "undefined" ? null : globalThis;
          return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_ce44e66a4935da8c: function() {
          const ret = typeof global === "undefined" ? null : global;
          return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_44f6e0cb5e67cdad: function() {
          const ret = typeof self === "undefined" ? null : self;
          return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_168f178805d978fe: function() {
          const ret = typeof window === "undefined" ? null : window;
          return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_b0e8ac4ed313fea8: function(arg0, arg1, arg2) {
          const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
          return ret;
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
          const ret = arg0.versions;
          return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
          const ret = getArrayU8FromWasm0(arg0, arg1);
          return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
          const ret = getStringFromWasm0(arg0, arg1);
          return ret;
        },
        __wbindgen_init_externref_table: function() {
          const table = wasm.__wbindgen_externrefs;
          const offset = table.grow(4);
          table.set(0, void 0);
          table.set(offset + 0, void 0);
          table.set(offset + 1, null);
          table.set(offset + 2, true);
          table.set(offset + 3, false);
        }
      };
      return {
        __proto__: null,
        "./myshape_wasm_bg.js": import0
      };
    }
    function addToExternrefTable0(obj) {
      const idx = wasm.__externref_table_alloc();
      wasm.__wbindgen_externrefs.set(idx, obj);
      return idx;
    }
    function getArrayU8FromWasm0(ptr, len) {
      ptr = ptr >>> 0;
      return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
    }
    var cachedDataViewMemory0 = null;
    function getDataViewMemory0() {
      if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
      }
      return cachedDataViewMemory0;
    }
    function getStringFromWasm0(ptr, len) {
      return decodeText(ptr >>> 0, len);
    }
    var cachedUint8ArrayMemory0 = null;
    function getUint8ArrayMemory0() {
      if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
      }
      return cachedUint8ArrayMemory0;
    }
    function handleError(f, args) {
      try {
        return f.apply(this, args);
      } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
      }
    }
    function isLikeNone(x) {
      return x === void 0 || x === null;
    }
    function passStringToWasm0(arg, malloc, realloc) {
      if (realloc === void 0) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr2 = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr2;
      }
      let len = arg.length;
      let ptr = malloc(len, 1) >>> 0;
      const mem = getUint8ArrayMemory0();
      let offset = 0;
      for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 127) break;
        mem[ptr + offset] = code;
      }
      if (offset !== len) {
        if (offset !== 0) {
          arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
      }
      WASM_VECTOR_LEN = offset;
      return ptr;
    }
    function takeFromExternrefTable0(idx) {
      const value = wasm.__wbindgen_externrefs.get(idx);
      wasm.__externref_table_dealloc(idx);
      return value;
    }
    var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    function decodeText(ptr, len) {
      return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
    }
    var cachedTextEncoder = new TextEncoder();
    if (!("encodeInto" in cachedTextEncoder)) {
      cachedTextEncoder.encodeInto = function(arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length
        };
      };
    }
    var WASM_VECTOR_LEN = 0;
    var wasmPath = `${__dirname}/myshape_wasm_bg.wasm`;
    var wasmBytes = require("fs").readFileSync(wasmPath);
    var wasmModule = new WebAssembly.Module(wasmBytes);
    var wasmInstance = new WebAssembly.Instance(wasmModule, __wbg_get_imports());
    var wasm = wasmInstance.exports;
    wasm.__wbindgen_start();
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MyShapeClient: () => MyShapeClient
});
module.exports = __toCommonJS(index_exports);

// src/wasm.ts
var engine = null;
var loading = null;
async function loadEngine() {
  if (engine) return engine;
  if (loading) return loading;
  loading = (async () => {
    if (typeof window === "undefined") {
      throw new Error("MyShape WASM engine requires a browser environment");
    }
    const wasmModule = await Promise.resolve().then(() => __toESM(require_myshape_wasm()));
    await wasmModule.default();
    engine = wasmModule;
    return engine;
  })();
  return loading;
}

// src/client.ts
var DEFAULT_BASE_URL = "https://api.myshape.com";
var MyShapeClient = class {
  constructor(config) {
    if (!config.apiKey) {
      throw new Error("MyShapeClient: apiKey is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }
  // ── Presence Verification ────────────────────────────────────────
  /**
   * Verify human presence using motion capture.
   *
   * This is the main entry point. It:
   * 1. Generates a cryptographic challenge
   * 2. Captures user motion via camera (you provide the MotionSequence)
   * 3. Extracts a motion signature via WASM
   * 4. Verifies the signature against the challenge
   *
   * @param motion - MotionSequence captured from the camera
   * @param riskLevel - "low" (10% FAR), "medium" (5% FAR), or "high" (1% FAR)
   * @returns VerificationResult
   *
   * @example
   * ```typescript
   * const client = new MyShapeClient({ apiKey: 'ms_live_...' });
   * const motion = await captureMotion(camera); // your camera code
   * const result = await client.verifyPresence(motion, 'medium');
   * console.log(result.valid ? 'Human ✓' : `Rejected: ${result.rejectionReason}`);
   * ```
   */
  async verifyPresence(motion, riskLevel = "medium") {
    const engine2 = await loadEngine();
    const sessionKey = generateSessionKey();
    const challengeJson = engine2.generate_challenge(sessionKey);
    const challenge = {
      sessionKey,
      data: challengeJson,
      expiresAt: new Date(Date.now() + 6e4).toISOString()
    };
    const signatureJson = engine2.extract_signature(JSON.stringify(motion));
    const signature = JSON.parse(signatureJson);
    const verifyJson = engine2.verify_intent(
      signatureJson,
      // enrollment: self-enrollment for presence check
      challenge.data,
      signatureJson,
      // response: same signature for presence-only
      signatureJson,
      riskLevel
    );
    const result = JSON.parse(verifyJson);
    const proof = JSON.stringify({
      signature,
      challenge: challenge.data,
      sessionKey: challenge.sessionKey,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    let serverResult = null;
    try {
      serverResult = await this._validate({
        enrollmentId: "presence-only",
        proof,
        challenge: challenge.data
      });
    } catch {
    }
    const pes = this._extractPes(result, signature);
    const factors = this._extractFactors(result);
    const threshold = riskLevel === "low" ? 0.7 : riskLevel === "medium" ? 0.75 : 0.8;
    return {
      valid: serverResult ? serverResult.valid : result.accept === true,
      pes,
      similarity: result.presence_score ?? 0,
      threshold,
      riskLevel,
      rejectionReason: result.reject_reason ?? void 0,
      factors
    };
  }
  // ── Enrollment ───────────────────────────────────────────────────
  /**
   * Create an enrollment from multiple motion samples.
   *
   * @param samples - Array of MotionSequences (3-5 recommended)
   * @param userId - Your internal user identifier
   * @param device - Device info for the enrolling device
   * @returns Enrollment data (store this server-side)
   */
  async createEnrollment(samples, userId, device) {
    const engine2 = await loadEngine();
    const signatures = samples.map((s) => {
      const json = engine2.extract_signature(JSON.stringify(s));
      return JSON.parse(json);
    });
    const enrollmentJson = engine2.create_enrollment(
      JSON.stringify(signatures),
      userId,
      JSON.stringify(device)
    );
    const raw = JSON.parse(enrollmentJson);
    return {
      id: generateId("enr"),
      userId,
      device,
      signatureBlob: JSON.stringify(raw),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      sampleCount: samples.length
    };
  }
  // ── Server-Side Validation ───────────────────────────────────────
  /**
   * Validate a presence proof on the MyShape server.
   *
   * This performs an additional server-side check:
   * - API key authorization
   * - Rate limiting
   * - Calibrated thresholds (if available)
   * - Cross-session continuity checks
   *
   * Call this from your backend for maximum security.
   *
   * @param enrollmentId - Enrollment to verify against
   * @param proof - Proof generated by verifyPresence()
   * @returns ValidateResponse
   */
  async validate(enrollmentId, proof) {
    return this._validate({ enrollmentId, proof, challenge: "" });
  }
  // ── Utility ──────────────────────────────────────────────────────
  /**
   * Check if the WASM engine is loaded and calibrated.
   */
  async getEngineStatus() {
    try {
      const engine2 = await loadEngine();
      return {
        loaded: true,
        calibrated: engine2.is_calibrated(),
        featureDim: engine2.get_feature_dim()
      };
    } catch {
      return { loaded: false, calibrated: false, featureDim: 120 };
    }
  }
  // ── Private ──────────────────────────────────────────────────────
  async _validate(body) {
    const res = await fetch(`${this.baseUrl}/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Validation failed (HTTP ${res.status})`);
    }
    return res.json();
  }
  _extractPes(raw, signature) {
    const factors = raw.factors;
    if (factors) {
      const { kinematicScore, accelerationScore, jerkScore, jerkSpectrumScore } = factors;
      const weights = [0.25, 0.25, 0.25, 0.25];
      return weights[0] * (kinematicScore ?? 0) + weights[1] * (accelerationScore ?? 0) + weights[2] * (jerkScore ?? 0) + weights[3] * (jerkSpectrumScore ?? 0);
    }
    return raw.presence_score ?? 0;
  }
  _extractFactors(raw) {
    const f = raw.factors ?? {};
    return {
      kinematicScore: f.kinematicScore ?? 0,
      accelerationScore: f.accelerationScore ?? 0,
      jerkScore: f.jerkScore ?? 0,
      jerkSpectrumScore: f.jerkSpectrumScore ?? 0,
      combinedScore: (f.kinematicScore ?? 0) + (f.accelerationScore ?? 0) + (f.jerkScore ?? 0) + (f.jerkSpectrumScore ?? 0)
    };
  }
};
function generateSessionKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function generateId(prefix) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MyShapeClient
});
