# CPS-0001 Independent Implementation Challenge

**We are testing whether this protocol can be implemented without access to the original implementation. Your attempt — successful or not — is the data point we need.**

Time estimate: 30–90 minutes.

---

## The Task

Build a program that produces a valid CPS-0001 Continuity Receipt.

```
Your Code → receipt.json → cps-verify → ✅ VALID   (genesis: V₁–V₆, V₇ is N/A)
```

## What You May Use

- ✅ Any SHA-256 implementation
- ✅ Any Ed25519 implementation
- ✅ Any JSON library
- ✅ Any programming language
- ✅ The files in this directory

## What You May NOT Use

- ❌ MyShape SDK or source code (`src/` directory)
- ❌ MyShape PES implementation
- ❌ Any pre-existing MyShape knowledge

The point is to test whether the protocol specification alone is sufficient.

## Getting Started

```bash
# 1. Install dependencies (only needed for the verifier)
cd continuity-protocol/cli && npm install

# 2. Read the entry point
cat START_HERE.md

# 3. Try the template
node onboarding-test.mjs

# 4. Verify the sample
node cli/bin/cps-verify.mjs test-vectors/valid/single-engine.json
# Expected: VERDICT: ✅ VALID
```

## Success Criterion

```bash
node cli/bin/cps-verify.mjs your-receipt.json
# → VERDICT: ✅ VALID
```

That's it. If you see six checkmarks and `VALID`, your receipt is **receipt-local valid**:
V₁–V₆ pass and the receipt is genesis (V₇ is `N/A`).

That is **not** the same as full CPS-0001 conformance. CPS-0001 v1.0-RC1 defines
V₁–V₇. `cps-verify` does not evaluate V₇; for a chained receipt it prints
`INCOMPLETE` and exits `3` rather than claiming success. If your receipt chains to a
predecessor, you must also implement the V₇ rules yourself from the specification.

## We Want To Know

After you're done (or if you get stuck), please tell us:

1. **Time**: how long did it take?
2. **Stuck points**: where did you pause or search for answers?
3. **Confusing parts**: any field name, concept, or instruction that was unclear?
4. **External info**: did you need to look at anything outside this directory?

Your answers will improve the protocol. Thank you.

---

*Part of the Continuity Protocol Project · 2026-07-24*
