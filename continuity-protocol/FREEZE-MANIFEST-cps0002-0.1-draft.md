# CPS-0002 `cps-hsa-0.1-draft` Freeze Manifest

**Version**: `cps-hsa-0.1-draft`
**Type**: Prototype freeze candidate (NOT final protocol freeze)
**Status**: CONCEPT → PROTOTYPE PHASE COMPLETE — CONCEPT NOT FROZEN

This manifest is the exact, exhaustive list of files intended to belong to the CPS-0002
0.1-draft freeze candidate. It is intended for review and the eventual freeze commit.

---

## Normative Protocol Documents (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/CPS-0002_CONCEPT.md` | Protocol concept + problem boundary |
| `continuity-protocol/CPS-0002-VERIFIER-CONTRACT.md` | Normative verifier algorithm spec |
| `continuity-protocol/CPS-0002-TRUST-POLICY.md` | Trust model + deployment policy |
| `continuity-protocol/CPS-0002-INTEROPERABILITY-AUDIT.md` | Interoperability findings |
| `continuity-protocol/CPS-0002-THREAT-MODEL.md` | Security boundary |
| `continuity-protocol/CPS-0002-TRUST-AUDIT.md` | Trust audit findings |
| `continuity-protocol/IMPLEMENT-CPS-0002.md` | Implementation guide |

## Schema (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/cps-0002-assertion.schema.json` | JSON Schema (version `0.1-draft`) |

## Reference Implementation / Toy Attester (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/cps-0002-toy-attester/src/index.ts` | Producer + canonical payload builder |
| `continuity-protocol/cps-0002-toy-attester/verifier.ts` | Reference verifier |
| `continuity-protocol/cps-0002-toy-attester/package.json` | Package manifest |

## Independent Second Verifier (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/cps-0002-second-verifier/verifier.ts` | Independent verifier (interop proof) |
| `continuity-protocol/cps-0002-second-verifier/package.json` | Package manifest |

## Conformance Suite (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/conformance/cps0002-conformance.test.ts` | 52 conformance tests |

## Interoperability Suite (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/conformance/cps0002-interop.test.ts` | 39 interop tests |

## Test Vectors (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/test-vectors/cps0002/human-signal-01.json` | Valid vector |
| `continuity-protocol/test-vectors/cps0002/invalid-modified-signature.json` | Invalid: INVALID_SIGNATURE |
| `continuity-protocol/test-vectors/cps0002/invalid-wrong-receipt.json` | Invalid: INVALID_RECEIPT_HASH |
| `continuity-protocol/test-vectors/cps0002/invalid-expired.json` | Invalid: EXPIRED |

## Generator / Provenance Tooling (INCLUDE)

| Path | Reason |
|---|---|
| `scripts/gen-cps0002-test-vector.mjs` | Deterministic vector generator (MyShape canonical JSON; verified byte-reproducible) |

## Release Artifacts (INCLUDE)

| Path | Reason |
|---|---|
| `continuity-protocol/RELEASE-cps0002-0.1-draft.md` | This release document |
| `continuity-protocol/FREEZE-MANIFEST-cps0002-0.1-draft.md` | This manifest |

## Launch Kit (INCLUDE, whole directory verbatim)

| Path | Reason |
|---|---|
| `continuity-protocol/launch-kit/README.md` | Launch kit index |
| `continuity-protocol/launch-kit/bluesky-post.md` | Launch post (Bluesky) |
| `continuity-protocol/launch-kit/hackernews-post.md` | Launch post (Hacker News) |
| `continuity-protocol/launch-kit/linkedin-post.md` | Launch post (LinkedIn) |
| `continuity-protocol/launch-kit/reddit-post.md` | Launch post (Reddit) |
| `continuity-protocol/launch-kit/x-thread.md` | Launch thread (X) |
| `continuity-protocol/launch-kit/publish-schedule.md` | Publishing schedule |
| `continuity-protocol/launch-kit/thirty-day-review.md` | 30-day review checklist |

## EXCLUDED

| Path | Reason |
|---|---|
| (none) | All CPS-0002 freeze-surface files are intentional |

---

## CPS-0001 Frozen Surface (MUST NOT CHANGE)

The following CPS-0001 files are **frozen at `89c0c4c` (tag `v1.0-RC1`)** and MUST NOT be
modified by any CPS-0002 release:

- `src/lib/evidence/cps0001.ts`
- `packages/myshape/src/cps0001.ts`
- `continuity-protocol/reference-verifier/verifier.ts`
- `continuity-protocol/second-producer/noble-verifier.ts`
- `continuity-protocol/cli/bin/cps-verify.mjs`
- `continuity-protocol/PROTOCOL_BOUNDARY.md`
- `continuity-protocol/RELEASE-v1.0-RC1.md`
- `continuity-protocol/schemas/continuity-receipt.schema.json`
- `continuity-protocol/test-vectors/valid/*`
- `continuity-protocol/conformance/*` (CPS-0001 tests)
- `continuity-protocol/shared/jcs.ts`

## Next Action

1. Review this manifest and the release document.
2. Perform the final freeze commit (`git add <listed files>` + `git commit`).
3. Create a `cps-0002-0.1-draft` tag if desired.

**This manifest is a review/preparation artifact. No commit has been made.**