/* @ts-self-types="./myshape_wasm.d.ts" */

/**
 * Create an enrollment from multiple motion samples.
 *
 * `signatures_json`: JSON array of MotionSignature objects
 * `user_id`: user identifier
 * `device_json`: JSON DeviceInfo for the enrolling device
 *
 * Returns a JSON Enrollment object.
 * @param {string} signatures_json
 * @param {string} user_id
 * @param {string} device_json
 * @returns {string}
 */
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
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}
exports.create_enrollment = create_enrollment;

/**
 * Extract the raw 120-dimensional feature vector from a motion sequence.
 *
 * This is the SAME feature vector the engine uses internally for signature
 * extraction. Exposing it allows the TypeScript calibration pipeline to
 * compute PCA and population statistics in the engine's native feature space.
 *
 * Input: JSON MotionSequence (same format as extract_signature)
 * Returns: JSON number array — [120 f32 values] = [K(40) | A(25) | J(25) | J_spec(30)]
 * @param {string} motion_json
 * @returns {string}
 */
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
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
exports.extract_feature_vector = extract_feature_vector;

/**
 * Extract a Motion Signature from a motion sequence.
 *
 * `motion_json` should be a JSON MotionSequence:
 *   { "fps": 30, "frames": [{ "t": 0.0, "keypoints": [{ "x": 0, "y": 0, "z": 0 }, ...] }, ...] }
 *
 * Phase E-4: Uses calibration-aware engine. If a calibration artifact is loaded
 * with matching feature dimensions, PCA projection and population z-score
 * normalization are applied during extraction. Falls back to vacuum defaults
 * (identity projection, zero means, unit stds) if not calibrated.
 *
 * Returns a JSON FlatMotionSignature: { "vector": [128 floats], "version": 1 }
 * @param {string} motion_json
 * @returns {string}
 */
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
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
exports.extract_signature = extract_signature;

/**
 * Generate synthetic AI-forged motion data.
 *
 * The AI generates a "perfect-looking" trajectory that:
 *   - Follows the challenge geometry accurately
 *   - Lacks physiological tremor (8-12Hz band absent)
 *   - Has over-smoothed jerk (spectral slope >2.0 or near-zero)
 *   - Shows excessive temporal regularity
 *   - Lacks micro-kinetic perturbations
 *
 * This motion looks visually correct but fails deep kinematic verification.
 * @param {number} duration_s
 * @param {number} fps
 * @param {number} amplitude
 * @returns {string}
 */
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
exports.generate_ai_motion = generate_ai_motion;

/**
 * Generate a challenge for presence verification.
 *
 * Uses `Date.now()` from JavaScript (WASM-compatible) for the timestamp.
 * Returns a JSON string containing the Challenge object
 * with actions, timing constraints, nonce, and HMAC token.
 * @param {string} session_key_hex
 * @returns {string}
 */
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
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}
exports.generate_challenge = generate_challenge;

/**
 * Generate synthetic human-like motion data with realistic micro-tremor.
 *
 * Parameters:
 *   - duration_s: duration in seconds (e.g. 3.0)
 *   - fps: frames per second (e.g. 30)
 *   - amplitude: base motion amplitude in meters (e.g. 0.15)
 *
 * Returns JSON MotionSequence with 33 keypoints per frame.
 * Includes: 8-12Hz physiological tremor, 1/f-like jerk spectrum,
 * natural acceleration noise, and biomechanical micro-perturbations.
 * @param {number} duration_s
 * @param {number} fps
 * @param {number} amplitude
 * @returns {string}
 */
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
exports.generate_human_motion = generate_human_motion;

/**
 * Get calibration metadata as a JSON string.
 * Returns `null` (JS null) if not calibrated.
 * @returns {string | undefined}
 */
function get_calibration_info() {
    const ret = wasm.get_calibration_info();
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}
exports.get_calibration_info = get_calibration_info;

/**
 * Get the raw feature dimension (120 for the current engine).
 * @returns {number}
 */
function get_feature_dim() {
    const ret = wasm.get_feature_dim();
    return ret >>> 0;
}
exports.get_feature_dim = get_feature_dim;

function init_panic_hook() {
    wasm.init_panic_hook();
}
exports.init_panic_hook = init_panic_hook;

/**
 * Check whether a calibration artifact is currently active.
 * @returns {boolean}
 */
function is_calibrated() {
    const ret = wasm.is_calibrated();
    return ret !== 0;
}
exports.is_calibrated = is_calibrated;

/**
 * Load a calibration artifact from JSON.
 *
 * The artifact is produced by the TypeScript Phase E-2 calibration pipeline
 * (runCalibration()). Once loaded, the engine uses:
 *   - ROC operating points for verification thresholds
 *   - Population feature statistics for z-score normalization (if dims match)
 *   - PCA projection matrix (if dims match)
 *
 * Returns `true` if calibration was successfully parsed and activated.
 * Returns `false` if the JSON represents an empty/vacuum calibration.
 * Throws a JS error if the JSON is malformed.
 * @param {string} artifact_json
 * @returns {boolean}
 */
function load_calibration(artifact_json) {
    const ptr0 = passStringToWasm0(artifact_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.load_calibration(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}
exports.load_calibration = load_calibration;

/**
 * Reset calibration to vacuum state (for testing).
 */
function reset_calibration() {
    wasm.reset_calibration();
}
exports.reset_calibration = reset_calibration;

/**
 * Compute the similarity score between two motion signatures.
 *
 * Uses L2-normalized distance (captures both direction and magnitude).
 * Returns a value in [0.0, 1.0] where 1.0 = identical.
 * Returns -1.0 on parse error.
 * @param {string} enrollment_json
 * @param {string} response_json
 * @returns {number}
 */
function similarity(enrollment_json, response_json) {
    const ptr0 = passStringToWasm0(enrollment_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(response_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.similarity(ptr0, len0, ptr1, len1);
    return ret;
}
exports.similarity = similarity;

/**
 * Verify a challenge response against an enrolled signature.
 *
 * `enrollment_json`: JSON Enrollment object
 * `challenge_json`: JSON Challenge object (the challenge that was issued)
 * `response_json`: JSON ChallengeResponse object
 * `signature_json`: JSON MotionSignature extracted from the response
 * `risk_level`: "low" | "medium" | "high"
 *
 * Returns a JSON VerificationResult with presence_score, factor breakdown, and accept/reject.
 * @param {string} enrollment_json
 * @param {string} challenge_json
 * @param {string} response_json
 * @param {string} signature_json
 * @param {string} risk_level
 * @returns {string}
 */
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
            ptr6 = 0; len6 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred7_0 = ptr6;
        deferred7_1 = len6;
        return getStringFromWasm0(ptr6, len6);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
}
exports.verify_intent = verify_intent;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_function_acc5528be2b923f2: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_0beba4a1980d3eea: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_1fca8072260dd261: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_721f8decd50c87a3: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_5575218572ead796: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
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
        __wbg_getRandomValues_a697888e9ba1eee3: function() { return handleError(function (arg0, arg1) {
            globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
        }, arguments); },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
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
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_2fee5048bcca5938: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_ce44e66a4935da8c: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_44f6e0cb5e67cdad: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_168f178805d978fe: function() {
            const ret = typeof window === 'undefined' ? null : window;
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
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./myshape_wasm_bg.js": import0,
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

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
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
    return x === undefined || x === null;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
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

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
function decodeText(ptr, len) {
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

const wasmPath = `${__dirname}/myshape_wasm_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
let wasmInstance = new WebAssembly.Instance(wasmModule, __wbg_get_imports());
let wasm = wasmInstance.exports;
wasm.__wbindgen_start();
