# CPS-0001 HTTP Verifier Plugin

**A portable verifier for HTTP-based Continuity Receipt consumption.**

Designed to be embeddable in HTTP gateways — Express, Envoy, Kong, NGINX, Cloudflare Workers.

---

## What It Does

```
X-Continuity-Receipt: eyJwcm90b2NvbFZlcnNpb24iOiIxLjAi...
                         ↓
              parseReceiptHeader(header)
                         ↓
              verifyReceipt(receipt)      ← V₁ V₃ V₄ V₅ V₆
                         ↓
              allow / deny + risk score
```

The plugin reads a Continuity Receipt from an HTTP header, verifies it against CPS-0001, and returns a decision. It does not know which evidence engine was used. It does not inspect evidence payload content. It only needs the receipt and the protocol specification.

## Why It Matters

This is the **first Consumer** — a software component that makes authorization decisions based on CPS-0001 receipts without knowing how they were produced.

The complete protocol loop is now closed:

```
Producer          Receipt          Verifier          Consumer
(any engine)  →  (CPS-0001)   →   (V₁-V₇)      →   allow/deny
```

## Imports

The plugin imports only:
- `continuity-protocol/reference-verifier/verifier` (pure protocol types; V₁, V₃–V₆ helper, plus a V₇ hash-only helper — not a full CPS-0001 conformance oracle)

It does NOT import:
- MyShape SDK
- EE-001 / EE-002 / EE-003 / VS-001
- IMU, camera, MediaPipe, PES
- Any engine-specific code

## API

```typescript
import { verifyHeader, parseReceiptHeader, serializeReceiptHeader, computeRiskScore } from "./index";

// Parse a base64url receipt from HTTP header
const receipt = parseReceiptHeader(req.headers["x-continuity-receipt"]);

// Verify and get a decision
const decision = await verifyHeader(headerValue);
// { allow: true, statusCode: 200, riskScore: 0, reason: "...", verification: {...} }

// Compute risk score for a valid receipt
const risk = computeRiskScore(receipt);

// Serialize a receipt to header value
const header = serializeReceiptHeader(receipt);
```

## Express Middleware

```typescript
import { continuityMiddleware } from "./middleware";

// Protect all /api/sensitive routes
app.use("/api/sensitive", continuityMiddleware());

// With options
app.use("/api/admin", continuityMiddleware({
  maxRisk: 0.3,         // stricter risk threshold
  attachReceipt: true,  // attach receipt to req for downstream handlers
}));

// Downstream handler
app.post("/api/admin/config", (req, res) => {
  // req.continuityReceipt — the verified receipt
  // req.continuityRisk     — risk score 0-1
  res.json({ status: "authorized" });
});
```

## Gateway Embedding

The core logic (`index.ts`) is designed to be embedded in any HTTP proxy:

| Gateway | Integration Point |
|:---|:---|
| Envoy | External auth filter (gRPC/HTTP) |
| Kong | Custom plugin (Lua → Node.js sidecar) |
| NGINX | `auth_request` subrequest |
| Cloudflare Worker | `fetch` handler |

All require an adapter layer for header mapping, configuration, and lifecycle — not yet implemented.

## Compatibility Matrix

| Producer | Receipt | Plugin Verdict | Notes |
|:---|:---|:---|:---|
| Dummy Engine (`second-producer/`) | ✅ Valid | PASS | No IMU, no camera — pure protocol object |
| MyShape EE-001 (verify page) | ✅ Valid | PASS | Self-issued, passes V₁-V₆ |
| Tampered evidence | ❌ Invalid | REJECT (V₅) | payloadDigest mismatch |
| Expired receipt | ❌ Invalid | REJECT (V₆) | past expiresAt |
| Broken chain | ❌ Invalid | REJECT (V₇) | predecessor hash mismatch |

## Test Coverage

| Category | Status |
|:---|:---|
| Header parsing (valid/missing/malformed) | ✅ |
| Valid receipt → ALLOW | ✅ |
| Expired receipt → DENY | ✅ |
| Tampered evidence → DENY (V₅) | ✅ |
| Risk scoring (recent/high-confidence → low risk) | ✅ |
| Engine independence (dummy engine receipts pass) | ✅ |
| Q₃ proof (no MyShape imports in plugin) | ✅ |
