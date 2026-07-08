# MyShape Genesis 100 — Social Media Launch Copy

> 三种叙事风格，适配不同平台。选择最匹配社区文化的版本发布。

---

## 1. 硬核极客风 — Reddit (r/cryptography, r/privacy, r/selfhosted)

**Title:** MyShape Protocol passed its Genesis Stability Audit — 3,282 lines of snapshot tests enforce numerical contracts that CI cannot silently break

**Body:**

We just completed the Genesis Stability Audit for MyShape Protocol — a sovereign 3D identity layer that verifies digital continuity without biometrics.

**The problem we're solving:** When AI can generate your face, voice, and behavior, "who are you?" is the wrong question. The right question is: **who continues to be you?**

**What we built:** A protocol that verifies the evolutionary trajectory of digital subjects — not a one-time identity check, but a cryptographic chain of presence receipts linked across time.

**The audit results:**

| Metric | Value |
|--------|-------|
| Test suite | 309 tests · 21 files · 0 TypeScript errors |
| Snapshot coverage | 3,282 lines locking 4 approximation functions |
| API contracts | 7 typed responses + 7 Zod runtime schemas (all `.strict()`) |
| CI drift protection | Snapshot mismatch + no changelog = BLOCKED |
| Stress test | Threshold drift caught in <300ms by snapshot CI |

**Why this matters:** We modified a genesis threshold from 0.80 → 0.78. All 172 engine unit tests passed (silent drift). The snapshot test caught it immediately. This is the difference between "it compiled" and "it didn't break the protocol's promises to node operators."

**Snapshot integrity proof (cold storage, SHA-256):**
```
406f33fa7c51b8a1082649e9c19bcb438b9e346d423381841e0f79947024a542
  docs/.core/approximation-snapshot-v1.0-20260708.snap
```
The snapshot is backed up in cold storage, gitignored from public repos, with a verifiable checksum. If the protocol ever produces different numerical output, any node operator can independently verify whether drift occurred by comparing against this hash. This is what "don't trust, verify" looks like in practice.

**The Protocol Covenant (5 non-negotiable promises):**

1. Numerical stability > feature velocity — every algorithm change leaves a permanent audit trail
2. Contract breaks require one version of advance notice — old routes run in parallel
3. Tests are the living spec — 3,282 lines of snapshots are more authoritative than any README
4. Transparency is the only source of trust — all approximation functions and bias ceilings are public
5. Genesis 100 is permanent — no downgrade, no expiry, no revocation

**We're recruiting the first 100 Genesis Nodes.** These 100 identities define the root entropy source of the protocol. Like Bitcoin's early nodes — founding entity status is immutable protocol-level metadata.

Not a product. Not an app. A protocol with enforceable numerical contracts.

**Full audit:** [Genesis Stability Audit v1.0](https://github.com/myshapeprotocol/myshape-protocol/blob/master/docs/genesis-stability-audit-v1.0.md)

**Join the Founding Cohort:** [myshape.com/genesis](https://www.myshape.com/genesis)

**Onboarding check (verify your environment in 30s):**
```bash
bash scripts/onboarding-check.sh
```

---

## 2. 协议愿景风 — X/Twitter Thread

**Tweet 1 (Hook):**

We wrote 3,282 lines of snapshot tests so the protocol can't silently lie to its nodes.

MyShape Protocol just passed its Genesis Stability Audit. Zero critical findings. 309 tests. CI-enforced numerical contracts.

Here's why that matters for digital identity. 🧵

**Tweet 2:**

When AI can generate your face, voice, and behavior, "who are you?" stops being the right question.

The right question: **who continues to be you?**

MyShape verifies the evolutionary trajectory of digital subjects — cryptographic presence receipts linked across time.

**Tweet 3:**

We ran a stress test. Modified a genesis threshold from 0.80 → 0.78.

Result: 172 unit tests passed. All green. Silent drift.

Snapshot CI caught it in <300ms. BLOCKED.

That's the difference between "it compiled" and "it kept its promises."

**Tweet 4:**

The Protocol Covenant — 5 non-negotiable promises every Genesis Node operator can verify:

1. Numerical stability > feature velocity
2. Contract breaks require advance notice
3. Tests are the living specification
4. All approximations and bias ceilings are public
5. Genesis 100 status is permanent and inalienable

**Tweet 5:**

We're recruiting the first 100 Genesis Nodes.

These 100 identities define the root entropy source. Like Bitcoin's early nodes — founding entity status is immutable protocol-level metadata. Never offered again.

**Tweet 6:**

Not a product. Not an app.

A protocol with enforceable numerical contracts, backed by CI-enforced snapshot testing, designed to survive from Genesis cohort to open protocol at scale.

**Join the Founding Cohort (first 100 only):** [myshape.com/genesis](https://www.myshape.com/genesis)

**Full technical brief:** [Genesis 100 Recruitment](https://github.com/myshapeprotocol/myshape-protocol/blob/master/docs/genesis-100-recruitment.md)

---

## 3. 简洁直击风 — Discord Announcement

**@everyone** or **Announcement Channel:**

```
◈ MyShape Protocol — Genesis 100 Recruitment Now Open

The Genesis Stability Audit is complete. 309 tests. 0 errors.
3-layer anti-drift protection active. The protocol is ready.

We're looking for the first 100 Genesis Nodes —
the root entropy source of the Self-Verifying Protocol.

⏳ Timeliness:
  • First 50 applicants → Genesis Cohort (positions #001–#050)
  • Remaining 50 → Founding Cohort (positions #051–#100)
  • Genesis Node status is PERMANENT — on-chain, immutable, inalienable
  • This window closes once and never reopens

What you get:
  • Permanent Genesis Node status (immutable, inalienable)
  • Cryptographic founding-entity proof
  • Your identity as part of the protocol's root trust anchor

How to claim:
  1. Run the onboarding check:
     bash scripts/onboarding-check.sh
  2. Visit https://www.myshape.com/genesis
  3. Connect wallet or enter email → complete 30s motion capture
  4. Your Genesis #XXX position is minted on-chain

What we ask:
  • One 30-second motion capture session
  • Return at least once more (continuity requires time)

Read the full audit:
  https://github.com/myshapeprotocol/myshape-protocol/blob/master/docs/genesis-stability-audit-v1.0.md

— MyShape Protocol
The Sovereign 3D Identity Layer for the Decentralized Human.
AI-native identity | zero-knowledge presence | motion-signature verification
```
