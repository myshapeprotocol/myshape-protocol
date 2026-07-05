import {
  __commonJS,
  __require
} from "./chunk-EBO3CZXG.mjs";

// wasm/myshape_wasm.js
var require_myshape_wasm = __commonJS({
  "wasm/myshape_wasm.js"(exports, module) {
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
    exports.create_enrollment = create_enrollment;
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
    exports.extract_feature_vector = extract_feature_vector;
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
    exports.extract_signature = extract_signature;
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
    exports.generate_challenge = generate_challenge;
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
    function get_feature_dim() {
      const ret = wasm.get_feature_dim();
      return ret >>> 0;
    }
    exports.get_feature_dim = get_feature_dim;
    function init_panic_hook() {
      wasm.init_panic_hook();
    }
    exports.init_panic_hook = init_panic_hook;
    function is_calibrated() {
      const ret = wasm.is_calibrated();
      return ret !== 0;
    }
    exports.is_calibrated = is_calibrated;
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
    function reset_calibration() {
      wasm.reset_calibration();
    }
    exports.reset_calibration = reset_calibration;
    function similarity(enrollment_json, response_json) {
      const ptr0 = passStringToWasm0(enrollment_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len0 = WASM_VECTOR_LEN;
      const ptr1 = passStringToWasm0(response_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      const ret = wasm.similarity(ptr0, len0, ptr1, len1);
      return ret;
    }
    exports.similarity = similarity;
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
    exports.verify_intent = verify_intent;
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
            const ret = module.require;
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
    var wasmBytes = __require("fs").readFileSync(wasmPath);
    var wasmModule = new WebAssembly.Module(wasmBytes);
    var wasmInstance = new WebAssembly.Instance(wasmModule, __wbg_get_imports());
    var wasm = wasmInstance.exports;
    wasm.__wbindgen_start();
  }
});
export default require_myshape_wasm();
