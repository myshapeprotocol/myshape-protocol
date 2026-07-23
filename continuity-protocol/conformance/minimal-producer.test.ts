import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { verifyReceipt, verifySchema, verifyEvidenceIntegrity } from "../reference-verifier/verifier";

describe("Onboarding: Minimal Producer Output", () => {
  const receiptPath = join(__dirname, "../../cps-0001-onboarding/examples/minimal-receipt.json");

  it("minimal-receipt.json passes V₁–V₆", async () => {
    const receipt = JSON.parse(readFileSync(receiptPath, "utf-8"));
    expect(verifySchema(receipt)).toBeNull();
    const integrity = await verifyEvidenceIntegrity(receipt);
    expect(integrity).toBeNull();
    const result = await verifyReceipt(receipt);
    expect(result.status).toBe("VALID");
  });
});
