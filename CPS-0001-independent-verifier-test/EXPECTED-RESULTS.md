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
| `valid/agent-trace.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | **FAIL** | **INVALID** | `CHAIN_BROKEN` |
| `invalid/expired.json` | PASS | PASS | N/A | PASS | PASS | PASS | **FAIL** | **INVALID** | `EXPIRED` |
| `invalid/tampered-evidence.json` | PASS | PASS | N/A | PASS | PASS | **FAIL** | PASS | **INVALID** | `EVIDENCE_TAMPERED` |
| `invalid/broken-chain.json` | PASS | PASS | **FAIL** | PASS | PASS | PASS | **FAIL** | **INVALID** | `CHAIN_BROKEN` |

### Notes per vector

- **`valid/single-engine.json`** — genesis receipt (`previousReceiptHash === null`), so V₇ is `N/A`.
- **`valid/multi-engine.json`** — non-genesis. V₇ is evaluated with `valid/single-engine.json` as the resolved predecessor; all four protocol-core checks pass.
- **`valid/agent-trace.json`** — the directory name is historical packaging metadata, **not** a normative outcome. It is a **non-genesis** receipt whose `previousReceiptHash` resolves to no receipt in the published vector set, so under the normative fail-closed rule **V₇ FAILS** and supplies `CHAIN_BROKEN`. It is also already past `expiresAt` at the fixed evaluation time, so V₆ fails as well — but V₇ precedes V₆ in the normative order, so the reported code is `CHAIN_BROKEN`, not `EXPIRED`. It is not a valid receipt despite its location, and V₇ is **not** `N/A` here.
- **`invalid/expired.json`** — structurally valid genesis receipt, expired before the evaluation time.
- **`invalid/tampered-evidence.json`** — declared `payloadDigest` does not match the recomputed digest of `payload`. The digest is inside the signed payload, so V₅ is the first failing check (not V₂).
- **`invalid/broken-chain.json`** — `previousReceiptHash` is a literal placeholder string rather than a digest of any receipt, so it cannot be resolved to a predecessor. Under the normative fail-closed rule **V₇ FAILS** with `CHAIN_BROKEN`. It is *also* already past expiry at the fixed evaluation time, so V₆ fails as well, but V₇ precedes V₆ in the normative order and therefore sets the reported first-failure code.

## V₇ and the trusted store

V₇ requires the predecessor to be resolved from a **trusted store**. CPS-0001
v1.0-RC1 defines **no** store interface, so outcomes such as
`PREDECESSOR_MISSING` are **integration-layer** concerns and are **not** core
conformance results. They never appear in this table. The four protocol-core V₇
failure codes are `CHAIN_BROKEN`, `SUBJECT_MISMATCH`, `ISSUER_MISMATCH`, and
`TEMPORAL_VIOLATION`.

**Fail-closed at the layer boundary.** When a non-genesis receipt's predecessor
cannot be resolved, the store/integration layer may report that the predecessor is
unavailable, but the **core conformance** result is fixed: **V₇ = FAIL** with
`CHAIN_BROKEN` and an overall `INVALID`. `PREDECESSOR_MISSING` is never a core
verdict and is never a member of the v1.0-RC1 core failure-code vocabulary.
V₇ = `N/A` is permitted for exactly one case — a genesis receipt
(`previousReceiptHash === null`).

## Coverage gaps

No published vector exercises **V₃**, or the V₇ checks `SUBJECT_MISMATCH`,
`ISSUER_MISMATCH`, and `TEMPORAL_VIOLATION`. An independent implementer can verify
those rules directly from the specification, but cannot confirm them against a
published fixture. Adding vectors for them is future work and is deliberately not
part of the current frozen set.

`CHAIN_BROKEN` **is** exercised, by `valid/agent-trace.json` and
`invalid/broken-chain.json`, both via the fail-closed unresolvable-predecessor
path.

`PREDECESSOR_MISSING` is intentionally absent — it is a store/integration-layer
outcome, not a CPS-0001 core conformance result. See the store note above.

---

*Part of the Continuity Protocol Project · CPS-0001 v1.0-RC1*
