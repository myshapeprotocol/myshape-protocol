# MyShape Protocol — Reference Architecture v1.0

> Derived from: Technical Specification v1.0 §7

---

## Five-Engine Architecture

```
USER DEVICE
┌─────────────────────────────────────────┐
│ LOCAL IDENTITY ENGINE (LIE)             │
│ — Device salt generation                │
│ — Local key derivation                  │
│ — Identity anchoring (no server)        │
├─────────────────────────────────────────┤
│ MOTION PROCESSING ENGINE (MPE)          │
│ — Pose estimation (MediaPipe/ARKit)     │
│ — SST normalization (18-point)          │
│ — Motion Vector generation              │
│ — Feature Pipeline (FEP §3)             │
│ — PES computation (§3.5)                │
├─────────────────────────────────────────┤
│ ZK-PROOF ENGINE (ZPE)                   │
│ — Presence Proof (PoP)                  │
│ — Motion Proof (MP)                     │
│ — Entropy Proof (EP)                    │
│ — ZK-Presence composite                 │
├─────────────────────────────────────────┤
│ PRESENCE CLIENT SDK                     │
│ — generatePresenceProof()               │
│ — verifyPresenceProof()                 │
│ — getEntropyScore()                     │
└──────────────┬──────────────────────────┘
               │ ZKP only (no raw data)
               ▼
┌─────────────────────────────────────────┐
│           PRESENCE NETWORK              │
│  ┌─────────────────────────────────┐    │
│  │    VERIFICATION NODES (VN)      │    │
│  │    — Verify ZKP validity        │    │
│  │    — Check entropy threshold    │    │
│  │    — Validate timestamp window  │    │
│  │    — Anti-replay registry       │    │
│  │    — Device revocation check    │    │
│  │    — Issue Presence Receipt     │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │    PRESENCE GATEWAYS             │    │
│  │    — Rate limiting               │    │
│  │    — Proof submission routing    │    │
│  └─────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │ Presence Receipt
               ▼
┌─────────────────────────────────────────┐
│     APPLICATIONS / PROTOCOLS            │
│     — Social, Gaming, DeFi, XR, IoT     │
│     — Only see: Presence Receipt        │
└─────────────────────────────────────────┘
```

---

## Four Security Boundaries

### Boundary 1 — Device
**Raw data never leaves the device.**
MV_raw, skeleton coordinates, and behavioral patterns stay local. The Capture Layer (§4) runs entirely on-device.

### Boundary 2 — Proof
**Only three artifacts cross the device boundary:**
- `FV_hash` — Feature Vector hash
- `PES` — Presence Entropy Score
- `ZKP` — Zero-Knowledge Presence proof

No motion data. No identity data. No device information.

### Boundary 3 — Network
**The Presence Network verifies without storing.**
Verification nodes are stateless. They validate ZKPs, check timestamps, and issue receipts. Nothing is retained.

### Boundary 4 — Application
**Applications only see Presence Receipts.**
A receipt is a signed confirmation: "at time T, a real human was present." No other data is accessible to integrators.

---

## Data Flow (Six Steps)

```
Step 1  CAPTURE    Camera → MPE
Step 2  FEATURES   MPE → FV + PES
Step 3  PROOF      ZPE → ZKP
Step 4  SUBMIT     SDK → Presence Network
Step 5  VERIFY     VN → Presence Receipt
Step 6  INTEGRATE  App uses receipt
```

---

## Implementation Status

| Engine | Status | Location |
|:-------|:-------|:---------|
| Local Identity Engine | ✅ Implemented | `src/engine/local-identity.ts` |
| Motion Processing Engine | ✅ Implemented | `src/engine/presence-entropy.ts` + `src/engine/skeleton-topology.ts` |
| ZK-Proof Engine | ✅ Implemented | `src/engine/proof-system.ts` |
| Verification Nodes | 🔜 Planned | External infrastructure |
| Presence Network | 🔜 Planned | External infrastructure |
| Client SDK | 🔜 Planned | `src/sdk/` |
