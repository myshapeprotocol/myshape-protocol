# CPS-0001 Independent Implementation Test Package

## Purpose

This package is for an independent implementation test of CPS-0001 v1.0-RC1.

The purpose is to determine whether an independent developer can implement verification from the supplied normative materials without relying on the original implementation.

This is:

- not a product evaluation
- not a security audit
- not an endorsement request
- not an investment discussion

## Package contents

- `spec/CPS0001.md` — CPS-0001 v1.0-RC1 specification (**normative**, byte-identical to the repository-root canonical source)
- `schema/continuity-receipt.schema.json` — Continuity Receipt JSON Schema (**normative**, byte-identical to the canonical schema)
- `vectors/` — eleven receipt files for verification testing (frozen; byte-identical to the canonical vectors)
- `EXPECTED-RESULTS.md` / `expected-results.json` — expected outcomes per vector (**outcomes, not rules**; if these conflict with the specification, the specification wins)
- `TEST-BRIEF.md` — instructions, procedure, and reporting format

The normative specification is `spec/CPS0001.md` in this package, a byte-identical
copy of the repository-root `CPS0001.md`. It contains the full normative
verification contract (V₁–V₇ with conditions and failure codes) and the canonical
signing payload. No other material is needed, and reading the specification must
be sufficient — you should not need any MyShape source to be conformant.

## Independence

Participants may use:

- any programming language
- any runtime
- standard cryptographic libraries
- standard JSON/JCS libraries
- public standards documentation

Participants must NOT use:

- the MyShape repository implementation
- SDK or source code of the original implementation
- any reference implementation
- internal tests
- internal helpers
- internal application state or storage

## Fixed evaluation time

All time-dependent verification must use:

`2026-09-20T00:00:00Z`

as the evaluation time. Do not use the live system clock for evaluation.

V₄ condition 2 (`interval.end <= now`) and V₆ freshness are the time-dependent
checks. Your verifier must accept the evaluation time as a supplied input so that
results are reproducible.

## Expected results

`EXPECTED-RESULTS.md` and `expected-results.json` state the expected outcome for
each supplied vector: per-check V₁–V₇ results, the overall verdict, and the failure
code.

These are **outcomes, not rules**. They are derived from the normative
specification in `spec/CPS0001.md`. **If anything here conflicts with the
specification, the specification wins**, and the discrepancy is itself a finding
worth reporting.

`N/A` in the V₇ column means the check does not apply to that receipt (a genesis
receipt has no predecessor). It is not a failure.

## V₇ predecessor bindings — required wiring

Four vectors are **non-genesis**: their `previousReceiptHash` is not `null`, so V₇
applies and the predecessor must be resolved from your store. This mapping is
normative and is published here so that it is never left implicit:

```text
subject-mismatch.json ──┐
issuer-mismatch.json ───┼── previousReceiptHash ──▶ n2-predecessor.json
chain-temporal-violation.json ──┘
```

| Vector (this package) | Resolved predecessor | `predecessorHash` |
|:---|:---|:---|
| `multi-engine.json` | `single-engine.json` | `55c4110f5a8fba68ee944bb49311f77048a358e08bb43d01be3e8ffc9414c5cc` |
| `subject-mismatch.json` | `n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |
| `issuer-mismatch.json` | `n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |
| `chain-temporal-violation.json` | `n2-predecessor.json` | `9742df6972f96075772eb90af94adb638fb9a618634f6f7c764fb2777840fead` |

**How to compute `predecessorHash`**

```
predecessorHash = SHA-256( UTF-8( JCS( predecessor receipt JSON ) ) )
```

`JCS` is RFC 8785 canonical JSON, per CPS-0001 Annex N-2:

- object keys sorted ascending by **UTF-16 code unit**
- no insignificant whitespace
- `null` preserved
- numbers in ECMAScript `Number::toString` form
- strings escaped per JSON

Hash the **parsed receipt object**, not the raw file text — indentation and key
order in the file do not affect the result.

> **If you do not wire these bindings, you will get `PREDECESSOR_MISSING`, not
> `SUBJECT_MISMATCH` / `ISSUER_MISMATCH` / `TEMPORAL_VIOLATION`.** That is correct
> behaviour for an unresolved predecessor, not a bug: continuity is not established.
> The expected results in `EXPECTED-RESULTS.md` assume the store is wired as
> documented above.

The remaining seven vectors are **genesis** (`previousReceiptHash === null`) and
report V₇ as `N/A`.

## Reporting

Report:

- language/runtime
- dependencies
- implementation approach
- result for each vector
- V1–V7 results where applicable
- failure reason
- ambiguities
- what you believed the specification required and why
- missing information
- independence confirmation
- any synthetic test you created

See `TEST-BRIEF.md` for the full reporting format.

## Important metadata warning

> File names and directory names are packaging metadata only. They must not be treated as normative verification outcomes.

## No scoring

No score, ranking, or pass/fail grade of the developer will be assigned.

The goal is to collect reproducibility evidence and identify specification ambiguity.