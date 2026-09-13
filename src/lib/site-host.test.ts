// ═══════════════════════════════════════════════════════════════════
// SITE FOUNDATION BATCH-001 — host classification tests
//
// Guards the domain policy:
//   MyShape canonical: https://www.myshape.com
//   Lab canonical:     https://thecontinuitylab.org
// Classification must be EXACT — substring matches must never promote
// an unrelated host into LAB branding.
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from "vitest";
import {
  classifyHost,
  LAB_CANONICAL_ORIGIN,
  MYSHAPE_CANONICAL_ORIGIN,
  normalizeHost,
} from "@/lib/site-host";

describe("normalizeHost", () => {
  it("lowercases and strips ports", () => {
    expect(normalizeHost("LocalHost:3000")).toBe("localhost");
    expect(normalizeHost("WWW.MyShape.com:443")).toBe("www.myshape.com");
    expect(normalizeHost("THECONTINUITYLAB.ORG:8443")).toBe("thecontinuitylab.org");
  });

  it("handles null / undefined / empty safely", () => {
    expect(normalizeHost(null)).toBe("");
    expect(normalizeHost(undefined)).toBe("");
    expect(normalizeHost("")).toBe("");
  });
});

describe("classifyHost — MyShape hosts", () => {
  it("classifies canonical and apex hosts as myshape", () => {
    expect(classifyHost("www.myshape.com")).toBe("myshape");
    expect(classifyHost("myshape.com")).toBe("myshape");
    expect(classifyHost("www.myshape.com:3000")).toBe("myshape");
    expect(classifyHost("MYSHAPE.COM")).toBe("myshape");
  });
});

describe("classifyHost — LAB hosts", () => {
  it("classifies canonical and www variant as lab", () => {
    expect(classifyHost("thecontinuitylab.org")).toBe("lab");
    expect(classifyHost("www.thecontinuitylab.org")).toBe("lab");
    expect(classifyHost("www.thecontinuitylab.org:3444")).toBe("lab");
    expect(classifyHost("THECONTINUITYLAB.ORG")).toBe("lab");
  });
});

describe("classifyHost — exact matching (no substring promotion)", () => {
  it("never classifies look-alike or embedded hosts as lab", () => {
    expect(classifyHost("thecontinuitylab-abc.vercel.app")).toBe("myshape");
    expect(classifyHost("evil-thecontinuitylab.org")).toBe("myshape");
    expect(classifyHost("thecontinuitylab.org.evil.com")).toBe("myshape");
    expect(classifyHost("notthecontinuitylab.org")).toBe("myshape");
    expect(classifyHost("thecontinuitylab.org.evil.com:8080")).toBe("myshape");
  });
});

describe("classifyHost — unknown / development hosts fall back to myshape", () => {
  it("treats localhost, LAN IPs and vercel previews as myshape", () => {
    expect(classifyHost("localhost")).toBe("myshape");
    expect(classifyHost("localhost:3000")).toBe("myshape");
    expect(classifyHost("127.0.0.1")).toBe("myshape");
    expect(classifyHost("192.168.0.105")).toBe("myshape");
    expect(classifyHost("myshape-protocol.vercel.app")).toBe("myshape");
  });

  it("treats missing host as myshape", () => {
    expect(classifyHost(null)).toBe("myshape");
    expect(classifyHost(undefined)).toBe("myshape");
    expect(classifyHost("")).toBe("myshape");
  });
});

describe("canonical origins are frozen", () => {
  it("matches the BATCH-001 domain policy", () => {
    expect(MYSHAPE_CANONICAL_ORIGIN).toBe("https://www.myshape.com");
    expect(LAB_CANONICAL_ORIGIN).toBe("https://thecontinuitylab.org");
  });
});