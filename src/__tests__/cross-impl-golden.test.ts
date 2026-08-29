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
  it("GAP-2: multi vector signature-era mismatch surfaced by src, schema-only by ref", async () => {
    const r = srcVerify(V.multi);
    if (r.status !== "INVALID") {
      throw new Error(`GAP-2: expected multi vector to fail on src verifier, got ${r.status}`);
    }
    expect(["CHAIN_BROKEN", "INVALID_SIGNATURE", "PREDECESSOR_MISSING"]).toContain(r.reason);
    const rr = await refVerify(V.multi as never);
    expect(rr.status).toBe("VALID");
  });
});