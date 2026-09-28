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
| `N/A` | Check does not apply (e.g. V₇ for a genesis receipt). **Not a failure.** |

Overall verdict is `VALID` when every applicable check passes. `failureCode` is the
code of the first failing check in execution order V₁ → V₂ → V₃ → V₄ → V₅ → V₆ → V₇.

## Expected results

| Vector | V₁ | V₂ | V₃ | V₄ | V₅ | V₆ | V₇ | Verdict | Failure code |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| `valid/single-engine.json` | PASS | PASS | PASS | PASS | PASS | PASS | N/A | **VALID** | — |
| `valid/multi-engine.json` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **VALID** | — |
| `valid/agent-trace.json` | PASS | PASS | PASS | PASS | PASS | **FAIL** | N/A | **INVALID** | `EXPIRED` |
| `invalid/expired.json` | PASS | PASS | PASS | PASS | PASS | **FAIL** | N/A | **INVALID** | `EXPIRED` |
| `invalid/tampered-evidence.json` | PASS | PASS | PASS | PASS | **FAIL** | PASS | N/A | **INVALID** | `EVIDENCE_TAMPERED` |
| `invalid/broken-chain.json` | PASS | PASS | PASS | PASS | PASS | **FAIL** | FAIL | **INVALID** | `EXPIRED` |

### Notes per vector

- **`valid/single-engine.json`** — genesis receipt (`previousReceiptHash === null`), so V₇ is `N/A`.
- **`valid/multi-engine.json`** — non-genesis. V₇ is evaluated with `valid/single-engine.json` as the resolved predecessor; all four protocol-core checks pass.
- **`valid/agent-trace.json`** — the directory name is historical packaging metadata, **not** a normative outcome. At the fixed evaluation time this receipt is already past `expiresAt`, so the normative result is `INVALID / EXPIRED`. It is not a valid receipt despite its location.
- **`invalid/expired.json`** — structurally valid genesis receipt, expired before the evaluation time.
- **`invalid/tampered-evidence.json`** — declared `payloadDigest` does not match the recomputed digest of `payload`. The digest is inside the signed payload, so V₅ is the first failing check (not V₂).
- **`invalid/broken-chain.json`** — `previousReceiptHash` is a literal placeholder string rather than a digest of any receipt, so the V₇ chain-pointer check cannot be satisfied. At the fixed evaluation time it is *also* already past expiry; V₆ is therefore the first failing check and sets the overall verdict.

## V₇ and the trusted store

V₇ requires the predecessor to be resolved from a **trusted store**. CPS-0001
v1.0-RC1 defines **no** store interface, so outcomes such as
`PREDECESSOR_MISSING` are **integration-layer** concerns and are **not** core
conformance results. They never appear in this table. The four protocol-core V₇
failure codes are `CHAIN_BROKEN`, `SUBJECT_MISMATCH`, `ISSUER_MISMATCH`, and
`TEMPORAL_VIOLATION`.

## Coverage gaps

No published vector exercises **V₃**, or the V₇ checks `SUBJECT_MISMATCH`,
`ISSUER_MISMATCH`, and `TEMPORAL_VIOLATION`. An independent implementer can verify
those rules directly from the specification, but cannot confirm them against a
published fixture. Adding vectors for them is future work and is deliberately not
part of the current frozen set.

`PREDECESSOR_MISSING` is intentionally absent — see the store note above.

---

*Part of the Continuity Protocol Project · CPS-0001 v1.0-RC1*
