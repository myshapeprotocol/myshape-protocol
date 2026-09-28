/**
 * Cross-implementation golden-vector coverage (read-only against frozen areas).
 *
 * Locks the three in-repo CPS-0001 producers against shared golden vectors:
 *   src (app), SDK source (packages/myshape/src), and the reference verifier.
 *
 * NOTE (Batch-2B): the `pkg` oracle points at the SDK SOURCE tree, not the
 * npm artifact `@thecontinuitylab/myshape`. A signature-payload change cannot
 * be reflected in the installed published build until it is republished. So
 * this test locks the three implementations we own; republish the SDK after
 * merging this batch.
 */
import { describe, it, expect } from "vitest";
import { verifyReceipt as srcVerify, computeReceiptHash as srcHash, type ContinuityReceipt as SrcReceipt } from "@/lib/evidence/cps0001";
import { MemoryChainStore } from "@/lib/evidence/chain-store";
import { verifyReceipt as pkgVerify, signReceipt as pkgSignReceipt } from "../../packages/myshape/src/index";
import { verifyReceipt as refVerify, computeReceiptHash as refHash } from "../../continuity-protocol/reference-verifier/verifier";
import validSingle from "../../continuity-protocol/test-vectors/valid/single-engine.json";
import validMulti from "../../continuity-protocol/test-vectors/valid/multi-engine.json";
import expiredVec from "../../continuity-protocol/test-vectors/invalid/expired.json";
import tamperedVec from "../../continuity-protocol/test-vectors/invalid/tampered-evidence.json";
import { generateKeyPair } from "@/lib/crypto";
import { signReceipt as srcSignReceipt } from "@/lib/evidence/cps0001";

const V = { single: validSingle as unknown as SrcReceipt, multi: validMulti as unknown as SrcReceipt };

describe("golden vectors", () => {
  it("hash parity: src === reference", async () => {
    for (const [name, v] of Object.entries(V)) {
      const hSrc = srcHash(v);
      const hRef = await refHash(v as never);
      expect(hSrc, name).toBe(hRef);
    }
  });
  it("single valid -> VALID on src and pkg", () => {
    expect(srcVerify(V.single).status).toBe("VALID");
    expect(pkgVerify(V.single as never).status).toBe("VALID");
  });
  it("pairwise signing: src-signed verifies on pkg and vice versa", () => {
    const kp = generateKeyPair();
    const { signature: _a, ...uno } = V.single;
    const reb = { ...uno, issuer: { ...uno.issuer, publicKey: kp.publicKey } };
    const signedByPkg = pkgSignReceipt(reb as never, kp.secretKey);
    expect(srcVerify(signedByPkg as SrcReceipt).status).toBe("VALID");
    const signedBySrc = srcSignReceipt(reb as never, kp.secretKey);
    expect(pkgVerify(signedBySrc as never).status).toBe("VALID");
  });
  it("invalid vectors rejected everywhere", async () => {
    expect(srcVerify(expiredVec as unknown as SrcReceipt).status).toBe("INVALID");
    expect(srcVerify(tamperedVec as unknown as SrcReceipt).status).toBe("INVALID");
    expect(pkgVerify(expiredVec as never).status).toBe("INVALID");
    expect((await refVerify(tamperedVec as never)).status).toBe("INVALID");
  });
  it("multi vector: canonical result is VALID with V7 PASS against valid/single-engine.json", async () => {
    // Canonical oracle (continuity-protocol/expected-results.json) freezes
    // valid/multi-engine.json as VALID with V1-V7 all passing and V7 resolved
    // against valid/single-engine.json. The GAP-2 "multi must be INVALID"
    // tie-breaker was retired in Batch 2; nothing here may reintroduce it.
    const store = new MemoryChainStore();
    store.store(V.single);
    const r = srcVerify(V.multi, store);
    expect(r.status).toBe("VALID");

    // Without a trusted store the pointer cannot be resolved. Under the
    // v1.0-RC1 fail-closed rule that is CHAIN_BROKEN - still INVALID, never
    // VALID, and never a store-layer code in the core reason field.
    const r2 = srcVerify(V.multi);
    expect(r2.status).toBe("INVALID");
    if (r2.status === "INVALID") expect(r2.reason).toBe("CHAIN_BROKEN");

    const rr = await refVerify(V.multi as never);
    expect(rr.status).toBe("VALID");
  });
});