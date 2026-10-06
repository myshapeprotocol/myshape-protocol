# CPS-0001 Expected Results — frozen v1.0-RC1 vectors

**This artifact contains outcomes, not rules.**

Expected outcomes are derived from the normative CPS-0001 specification. If this
artifact conflicts with the normative specification, **the specification wins.**

The canonical normative specification is [`../CPS0001.md`](../CPS0001.md)
(repository root). This table and its machine-readable companion
[`expected-results.json`](expected-results.json) are **fixtures**, not a second
specification: they state what the frozen vectors are expected to do, and nothing
about how the protocol works.

**Independence.** These outcomes are derived solely from the specification, the
normative JSON Schema, and the test vectors. No implementation, SDK, CLI, reference
verifier, conformance suite, test file, or datastore was consulted. An independent
implementer can use this table without reading any MyShape source code.

## Fixed evaluation time

```
evaluationTime = 2026-09-20T00:00:00Z
```

Time-sensitive checks — V₄ condition 2 (`interval.end <= now`) and V₆ freshness —
**must** be evaluated against this fixed verification time rather than a live system
clock, so results are reproducible.

## Outcome vocabulary

| Value | Meaning |
|:---|:---|
| `PASS` | Check applied; receipt satisfied it. |
| `FAIL` | Check applied; receipt violated it. |
| `N/A` | Check does not apply. Permitted **only** for V₇ on a genesis receipt (`previousReceiptHash === null`). **Not a failure.** |

Overall verdict is `VALID` when every applicable check passes. The **normative
evaluation order** is **V₁ → V₂ → V₇ → V₃ → V₄ → V₅ → V₆** (canonical
specification, *Evaluation order and first-failure rule*). `failureCode` is the code
of the **first failing check in that order**, and a later failure never displaces
it — a verifier may continue evaluating the remaining checks for diagnostics, but
the normative first-failure code MUST NOT be overridden. The table columns below
are listed in that normative order.

## Expected results

| Vector | V₁ | V₂ | V₇ | V₃ | V₄ | V₅ | V₆ | Verdict | Failure code |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| `valid/single-engine.json` | PASS | PASS | N/A | PASS | PASS | PASS | PASS | **VALID** | — |
| `valid/multi-engine.json` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **VALID** | — |
| `valid/agent-trace.json` | PASS | PASS | N/A | PASS | PASS | PASS | **FAIL** | **INVALID** | `EXPIRED` |
| `invalid/expired.json` | PASS | PASS | N/A | PASS | PASS | PASS | **FAIL** | **INVALID** | `EXPIRED` |
| `invalid/tampered-evidence.json` | PASS | PASS | N/A | PASS | PASS | **FAIL** | PASS | **INVALID** | `EVIDENCE_TAMPERED` |
| `invalid/broken-chain.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | **FAIL** | **INVALID** | `PREDECESSOR_MISSING` |
| `valid/n2-predecessor.json` | PASS | PASS | N/A | PASS | PASS | PASS | PASS | **VALID** | — |
| `invalid/inconsistent-assertions.json` | PASS | PASS | N/A | **FAIL** | PASS | PASS | PASS | **INVALID** | `INCONSISTENT_ASSERTIONS` |
| `invalid/subject-mismatch.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | PASS | **INVALID** | `SUBJECT_MISMATCH` |
| `invalid/issuer-mismatch.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | PASS | **INVALID** | `ISSUER_MISMATCH` |
| `invalid/chain-temporal-violation.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | PASS | **INVALID** | `TEMPORAL_VIOLATION` |

### Notes per vector

- **`valid/single-engine.json`** — genesis receipt (`previousReceiptHash === null`), so V₇ is `N/A`.
- **`valid/multi-engine.json`** — non-genesis. V₇ is evaluated with `valid/single-engine.json` as the resolved predecessor; all four protocol-core checks pass.
- **`valid/agent-trace.json`** — the directory name is historical packaging metadata, **not** a normative outcome. This is a **genesis** receipt: `previousReceiptHash` is `null`, so V₇ does not apply and is reported `N/A`. The fail-closed rule is scoped to non-genesis receipts and does not apply here. At the fixed evaluation time the receipt is already past `expiresAt`, so V₆ fails and supplies the first-failure code `EXPIRED`. It is not a valid receipt despite its location.
- **`invalid/expired.json`** — structurally valid genesis receipt, expired before the evaluation time.
- **`invalid/tampered-evidence.json`** — declared `payloadDigest` does not match the recomputed digest of `payload`. The digest is inside the signed payload, so V₅ is the first failing check (not V₂).
- **`invalid/broken-chain.json`** — `previousReceiptHash` is a literal placeholder string rather than a digest of any receipt, so it cannot be resolved to a predecessor in the trusted store. **V₇ FAILS** with `PREDECESSOR_MISSING`. It is *also* already past expiry at the fixed evaluation time, so V₆ fails as well, but V₇ precedes V₆ in the normative order and therefore sets the reported first-failure code.
- **`valid/n2-predecessor.json`** — N-2 dedicated predecessor fixture. Genesis receipt (`previousReceiptHash === null`), so V₇ is `N/A` and it is fully **VALID**. It is the resolved predecessor for the three N-2 V₇ child vectors below. Its JCS receipt hash is `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead`. It shares issuer id `n2-issuer-0001` and the N-2 public key with `inconsistent-assertions`, `subject-mismatch` and `chain-temporal-violation`.
- **`invalid/inconsistent-assertions.json`** — N-2 V₃ negative vector. Genesis receipt, so V₇ is `N/A` and the chain dimension is fully isolated. Claims `continuityMaintained = true` while `observationOccurred = false` — the single normative V₃ failure condition. V₇ does not apply and V₃ precedes V₄–V₆, so V₃ supplies the first-failure code.
- **`invalid/subject-mismatch.json`** — N-2 V₇ check-2 negative vector. Non-genesis; resolves to `valid/n2-predecessor.json`. V₇ check 1 (hash) passes, check 2 fails because this receipt's `subject.id` differs from the predecessor's, and checks 3 and 4 hold. Exactly one V₇ condition fails.
- **`invalid/issuer-mismatch.json`** — N-2 V₇ check-3 negative vector. Non-genesis; resolves to `valid/n2-predecessor.json`. V₇ checks 1 and 2 pass; check 3 fails because this receipt carries issuer id `n2-issuer-0002` while the predecessor carries `n2-issuer-0001`. **Both use the same public key**, so the check isolates the issuer identity label and introduces no signing-key ambiguity. Exactly one V₇ condition fails.
- **`invalid/chain-temporal-violation.json`** — N-2 V₇ check-4 negative vector. Non-genesis; resolves to `valid/n2-predecessor.json`. V₇ checks 1, 2 and 3 pass; check 4 fails because `predecessor.interval.end` (`2026-07-23T10:00:10Z`) is later than this receipt's `interval.start` (`2026-07-23T09:00:00Z`). The receipt's own temporal consistency is intact — all five V₄ conditions hold — and V₇ precedes V₄ in the normative order in any case. Exactly one V₇ condition fails.

## Predecessor bindings (normative fixture wiring)

V₇ requires the predecessor to be resolved from a **trusted store**. The bindings below are part of the published conformance materials and must not be left implicit. Each child's `previousReceiptHash` MUST equal `SHA-256(JCS(predecessor))` for the predecessor file named here.

| Child vector | Resolved predecessor | `predecessorHash` |
|:---|:---|:---|
| `valid/multi-engine.json` | `valid/single-engine.json` | `55c4110f5a8fba68ee944bb49311f77048a358e08bb43d01be3e8ffc9414c5cc` |
| `invalid/subject-mismatch.json` | `valid/n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |
| `invalid/issuer-mismatch.json` | `valid/n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |
| `invalid/chain-temporal-violation.json` | `valid/n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |

**How to compute it**

```
predecessorHash = SHA-256( UTF-8( JCS( predecessor receipt JSON ) ) )
```

`JCS` is RFC 8785 canonical JSON, per CPS-0001 Annex N-2: object keys sorted ascending by UTF-16 code unit, no insignificant whitespace, `null` preserved, numbers in ECMAScript `Number::toString` form, strings escaped per JSON.

> **Acceptance note.** A verifier that cannot resolve these bindings will — correctly — report `PREDECESSOR_MISSING` instead of the expected failure code. A correct implementation is not in conflict with these expectations; it must simply wire the store as documented here.

## V₇ and the trusted store

V₇ requires the predecessor to be resolved from a **trusted store**. The five
protocol-core V₇ failure codes are `CHAIN_BROKEN`, `PREDECESSOR_MISSING`,
`SUBJECT_MISMATCH`, `ISSUER_MISMATCH`, and `TEMPORAL_VIOLATION`.
`PREDECESSOR_MISSING` is the core failure code for a non-genesis receipt whose
predecessor cannot be resolved from the trusted store.

**Unresolved predecessor.** When a non-genesis receipt's predecessor cannot be
resolved from the trusted store, the **core conformance** result is fixed:
**V₇ = FAIL** with `PREDECESSOR_MISSING` and an overall `INVALID`.
V₇ = `N/A` is permitted for exactly one case — a genesis receipt
(`previousReceiptHash === null`).

## Coverage

**No remaining negative-coverage gap.** The V₃ rule and four of the five
protocol-core V₇ failure codes are now exercised by published fixtures.

| Rule / failure code | Exercised by |
|:---|:---|
| `INCONSISTENT_ASSERTIONS` (V₃) | `invalid/inconsistent-assertions.json` |
| `PREDECESSOR_MISSING` (V₇, predecessor not found in trusted store) | `invalid/broken-chain.json` |
| V₇ check 1 **PASS** | `valid/multi-engine.json` and all three N-2 child vectors |
| `SUBJECT_MISMATCH` (V₇ check 2) | `invalid/subject-mismatch.json` |
| `ISSUER_MISMATCH` (V₇ check 3) | `invalid/issuer-mismatch.json` |
| `TEMPORAL_VIOLATION` (V₇ check 4) | `invalid/chain-temporal-violation.json` |

**Still absent (P2, deliberately).** A V₇ check-1 *failure* (`CHAIN_BROKEN`) in
which the predecessor resolves but its JCS hash does not equal the pointer is not
constructible as a receipt fixture: the predecessor is resolved **by** that
pointer, so a mismatch would require a store integrity failure rather than a
receipt property.

`valid/agent-trace.json` does **not** exercise the unresolved-predecessor path —
it is a genesis receipt (`previousReceiptHash === null`), so its V₇ is `N/A`.

`PREDECESSOR_MISSING` is exercised by `invalid/broken-chain.json` — see the
coverage table above.

---

*Part of the Continuity Protocol Project · CPS-0001 v1.0-RC1*
