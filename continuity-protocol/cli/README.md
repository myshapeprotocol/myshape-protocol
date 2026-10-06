# CPS-0001 Receipt-Local Verifier — CLI

`cps-verify` performs **receipt-local** checking of a Continuity Receipt: the checks
that can be decided from a single receipt plus local cryptographic material.

## Scope — read this before using the result

| | |
|:--|:--|
| **Evaluates** | V₁ Schema · V₂ Signature · V₃ Assertions · V₄ Temporal · V₅ Evidence digest · V₆ Freshness |
| **Does NOT evaluate** | **V₇ Predecessor reference** — no predecessor store, no resolver, no chain input |
| **Is not** | a CPS-0001 conformance oracle, and not a substitute for the canonical specification |

CPS-0001 v1.0-RC1 defines a complete **V₁–V₇** contract. This CLI covers V₁–V₆ only.

Because it does not evaluate V₇, it must never report a conformance claim it cannot
support. When a receipt is non-genesis (`previousReceiptHash !== null`), V₇ applies and
requires a predecessor resolved from a trusted store. This tool has no such context, so
it reports **`INCOMPLETE`** rather than `VALID`.

**`INCOMPLETE` is a tool status, not a protocol concept.** It is not a CPS-0001
protocol verdict, not a CPS-0001 `failureCode`, and not equivalent to the protocol
V₇ `N/A` — protocol `N/A` applies only to true genesis receipts
(`previousReceiptHash === null`).

**The failure reason it prints is the first locally evaluated failing check.** It is
*not necessarily* the canonical CPS-0001 first-failure code, because V₇ precedes
V₃–V₆ in the normative order and V₇ is not evaluated here. For example,
`invalid/broken-chain.json` fails locally at V₆ while canonical evaluation fails at
V₇ with `PREDECESSOR_MISSING`.

For the normative contract see [`CPS0001.md`](../../CPS0001.md). For expected per-vector
results see [`../EXPECTED-RESULTS.md`](../EXPECTED-RESULTS.md) and
[`../expected-results.json`](../expected-results.json).

**It does not independently determine whether the underlying evidence represents a
real-world event.** A Receipt containing meaningless or fabricated evidence may still
pass verification — because "conformant" is not the same as "true." The interpretation
of the evidence belongs to the consuming application.

---

## Install

```bash
cd continuity-protocol/cli
npm install
```

Dependencies: `@noble/hashes`, `@noble/curves`. Zero MyShape imports.

## Usage

```bash
# From file
node bin/cps-verify.mjs ../test-vectors/valid/single-engine.json

# From stdin
cat receipt.json | node bin/cps-verify.mjs
```

## Exit codes

| Code | Tool status | Meaning |
|:--:|:--|:--|
| `0` | `VALID` | Genesis receipt (`previousReceiptHash === null`); V₇ is `N/A`; all evaluated checks passed |
| `1` | `INVALID` | An evaluated check failed |
| `2` | — | Usage / invocation error (no readable input) |
| `3` | `INCOMPLETE` | Non-genesis receipt; V₇ applies but was not evaluated, so no CPS-0001 verdict can be stated |

Exit `0` is reserved for `VALID`. Scripts must not treat exit `0` as evidence of
CPS-0001 conformance for chained receipts — those exit `3`.

## Test Vectors

See `../test-vectors/` for the frozen conformance vectors. The CLI is **not** a
conformance runner: some vectors deliberately target V₇, which it cannot evaluate.

```
test-vectors/
├── valid/
│   ├── single-engine.json         ← genesis; CLI: VALID
│   ├── n2-predecessor.json        ← genesis; CLI: VALID
│   ├── multi-engine.json          ← non-genesis; CLI: INCOMPLETE (V₇ not evaluated)
│   └── agent-trace.json           ← genesis but expired; CLI: INVALID
│
└── invalid/
    ├── tampered-evidence.json     ← V₅ fails; CLI: INVALID
    ├── expired.json               ← V₆ fails; CLI: INVALID
    ├── inconsistent-assertions.json ← V₃ fails; CLI: INVALID
    ├── broken-chain.json          ← V₇ target; CLI: INVALID (locally at V₆)
    ├── subject-mismatch.json      ← V₇ target; CLI: INCOMPLETE
    ├── issuer-mismatch.json       ← V₇ target; CLI: INCOMPLETE
    └── chain-temporal-violation.json ← V₇ target; CLI: INCOMPLETE
```

```bash
# 30-second check
node bin/cps-verify.mjs ../test-vectors/valid/single-engine.json
# → VERDICT: ✅ VALID   (exit 0)

node bin/cps-verify.mjs ../test-vectors/valid/multi-engine.json
# → VERDICT: ⚠️  INCOMPLETE   (exit 3 — V₇ not evaluated)
```

Authoritative per-vector expectations, including the V₇ results this CLI does not
compute, live in `../EXPECTED-RESULTS.md` and `../expected-results.json`.
