# Research Distribution — Decision Composer Test Matrix

- **Status:** Reconciled against the current repository.
- **Original design checkpoint:** `435aff98` (2026-10-02) — at that commit this matrix was design-only, with no composer implementation and no test files.
- **Current implementation reconciliation:** the decision composer is now implemented and tested in the repository — `src/lib/research-distribution/distribution-decision.ts` and `distribution-decision.test.ts`.
- **Specifies the contract for:** the decision composer layer
- **Composes frozen behaviour only:** `deriveGovernanceState()` · `canDistribute()`
- **New states introduced:** none
- **Schema changes assumed:** none
- **New rules invented:** **none — see §6; U-06 is resolved in the implementation as Position A**

---

## 0. What this layer is, and is not

The composer is the third and final pure stage:

```
events   ──►  deriveGovernanceState()  ──►  canDistribute()  ──►  composer
attempts ──►  deriveDeliveryState()                        ▲
                                                          └── composes the two
```

It answers one question — *"given both derivations, may distribution proceed?"* —
and returns a single deterministic verdict carrying the provenance of both
stages.

### What the composer must NOT do

| Prohibition | Why |
|---|---|
| Re-derive governance | `deriveGovernanceState()` is the only authority on state |
| Re-implement gate rules | `canDistribute()` is the only authority on `allowed` |
| Invent a fifth state | The schema CHECK freezes four |
| Invent a fifth `GateReason` | Would fork the gate's contract |
| Perform I/O | It is pure; the service performs I/O |

### The composition contract

The composer may **only** narrow, never widen:

```
final.allowed  ≤  gate.allowed
```

There is no input for which the composer returns `allowed: true` when
`canDistribute()` returned `false`. U-01 … U-05 pin this.

---

## 1. Notation

| Token | Meaning |
|---|---|
| `A_H` | `approved` / `HUMAN`, complete identity |
| `A_AI` | `approved` / `AI_REVIEW`, complete identity |
| `W_H` | `withdrawn` / `HUMAN`, complete identity |
| `R_H` | `rejected` — never participates (spec §2.1) |
| `X_H` | `exception_granted` — never approves (spec §2.2) |
| `FP_A`, `FP_B` | two distinct 64-hex fingerprints |
| `[]` | empty log |
| `a_SUCC` | attempt `SUCCEEDED`, `reconciliation_required = false` |
| `a_FAIL` | attempt `FAILED`, `reconciliation_required = false` |
| `a_UNCERT` | attempt `FAILED`, `reconciliation_required = true` |

Result tokens: `DENY` (final), `ALLOW` (final), and the `GateReason` codes
`NOT_APPROVED` · `HUMAN_APPROVAL_REQUIRED` · `WITHDRAWN_TERMINAL` ·
`DERIVATION_FAILED`.

## 2. U-01 … U-08

---

### U-01 — Human approval with no blocking delivery condition

| | |
|---|---|
| **Events** | `[A_H]` |
| **Attempts** | `[]` |
| **Governance result** | `{ ok: true, state: "HUMAN_APPROVED", diagnostics: [] }` |
| **Gate result** | `{ allowed: true, reasons: [] }` |
| **Delivery state** | `NOT_ATTEMPTED` |
| **Final decision** | **`ALLOW`** |
| **Safety property** | The composer must not refuse an unqualified human approval. An over-restrictive gate is safe but useless; if it denies here, the pipeline can never ship anything. |

This is the only ALLOW case in the matrix. Every other input is a DENY.

Note the attempt log is **empty**, not `a_SUCC`. `NOT_ATTEMPTED` is not a
blocking condition — a never-attempted record is a normal pre-delivery state.

---

### U-02 — AI review is denied

| | |
|---|---|
| **Events** | `[A_AI]` |
| **Attempts** | `[]` |
| **Governance result** | `{ ok: true, state: "AI_REVIEWED" }` |
| **Gate result** | `{ allowed: false, reasons: ["HUMAN_APPROVAL_REQUIRED"] }` |
| **Delivery state** | `NOT_ATTEMPTED` |
| **Final decision** | **`DENY` — `HUMAN_APPROVAL_REQUIRED`** |
| **Safety property** | **The locked decision.** `AI_REVIEWED` must never authorise distribution. Machine review is an input to the human decision and never a substitute for it. Mirrors the database CHECK `research_distribution_publish_requires_human_approval`. |

The composer must **propagate** the gate's reason, not replace it with a
generic denial. An operator must be able to distinguish "needs a human" from
"was withdrawn" without reading the event log.

---

### U-03 — Withdrawal is denied

| | |
|---|---|
| **Events** | `[A_H, W_H]` |
| **Attempts** | `[]` |
| **Governance result** | `{ ok: true, state: "WITHDRAWN" }` |
| **Gate result** | `{ allowed: false, reasons: ["WITHDRAWN_TERMINAL"] }` |
| **Delivery state** | `NOT_ATTEMPTED` |
| **Final decision** | **`DENY` — `WITHDRAWN_TERMINAL`** |
| **Safety property** | Withdrawal is terminal. A record that was approved and then withdrawn must not distribute. |

**Companion case U-03b — terminality.** Events `[A_H, W_H, A_H]` derive
`WITHDRAWN` and are denied identically. The post-withdrawal approval must not
restore the record. This pins spec §3.3 through the composer.

**Companion case U-03c — suppressed contradiction.** Events
`[W_H, A_H@FP_A, A_H@FP_B]` derive `WITHDRAWN` (withdrawal precedes
contradiction, spec §3.1), so the final reason is `WITHDRAWN_TERMINAL`, **not**
`DERIVATION_FAILED`. The composer sees only the derived state; the suppressed
conflict is visible in derivation diagnostics. This is a direct test that the
composer does not reach back around the gate.

---

### U-04 — Derivation failure / contradiction is denied

| | |
|---|---|
| **Events** | `[A_H@FP_A, A_H@FP_B]` |
| **Attempts** | `[]` |
| **Governance result** | `{ ok: false, state: null, diagnostics: [CONTRADICTORY_FINGERPRINTS] }` |
| **Gate result** | `{ allowed: false, reasons: ["DERIVATION_FAILED"] }` |
| **Delivery state** | `NOT_ATTEMPTED` |
| **Final decision** | **`DENY` — `DERIVATION_FAILED`** |
| **Safety property** | Fail closed. Nothing was decided, so nothing is permitted. The composer must never substitute a default state for `null`. |

**This is the case most likely to be implemented wrongly.** A composer written
as `if (state !== "WITHDRAWN") allow` would crash or mis-handle `state: null`.
The test asserts the reason is `DERIVATION_FAILED`, not `NOT_APPROVED` —
"nothing was decided" is a different fact from "decided it is not approved".

---

### U-05 — Non-approval history is denied

| | |
|---|---|
| **Events** | `[R_H]` |
| **Attempts** | `[]` |
| **Governance result** | `{ ok: true, state: "DRAFT" }` |
| **Gate result** | `{ allowed: false, reasons: ["NOT_APPROVED"] }` |
| **Delivery state** | `NOT_ATTEMPTED` |
| **Final decision** | **`DENY` — `NOT_APPROVED`** |
| **Safety property** | A rejection is not an approval. `rejected` never participates in derivation (spec §2.1) — it neither grants nor revokes. |

**Additional DRAFT-producing histories**, all expected `DENY — NOT_APPROVED`:

| Case | Events | Derives | Note |
|---|---|---|---|
| U-05b | `[]` | `DRAFT` | never approved |
| U-05c | `[X_H]` | `DRAFT` | an exception is a justified annotation, not an approval (§2.2) |
| U-05d | `[A_H]` with empty `approver_id` | `DRAFT` | unnamed approver cannot authorise (§2) |
| U-05e | `[A_H]` with empty `approval_ref` | `DRAFT` | unauditable approval cannot authorise (§2) |
| U-05f | `[SYSTEM]` approval | `DRAFT` | `SYSTEM` is an evidence actor, not a governance identity (§2.3) |

U-05d and U-05e are the highest-value cases here: they carry full decision and
approver type, and fail **only** on identity completeness. An implementation
that checks `decision` but not identity would allow them.

---

### U-06 — Delivery uncertainty blocks distribution

| | |
|---|---|
| **Events** | `[A_H]` |
| **Attempts** | `[a_UNCERT]` |
| **Governance result** | `{ ok: true, state: "HUMAN_APPROVED" }` |
| **Gate result** | `{ allowed: true, reasons: [] }` |
| **Delivery state** | `IN_FLIGHT` |
| **Final decision** | **`DENY` — delivery blocking** ⚠️ |
| **Safety property** | An unresolved delivery outcome must not be compounded by a second outbound attempt, which would risk a duplicate post. |

> ⚠️ **U-06 IS NOT YET SPECIFIED. See §6.1.**
>
> The gate allows this record. Nothing in `derivation.ts`, `governance-gate.ts`,
> the derivation spec, or the application contract states that delivery
> uncertainty blocks a **new** distribution. `reconciliation_required` exists
> only as an input to `deriveDeliveryState()` (spec §4.1 step 2).
>
> **The composer cannot be written until this is decided.** U-06 is recorded
> with its expected outcome, but marked unresolved, because a test asserting it
> today would encode an undecided decision.

---

### U-07 — Determinism

| | |
|---|---|
| **Input** | any fixture set from U-01 … U-06 |
| **Expected** | repeated evaluation is byte-identical |
| **Safety property** | No wall-clock, no randomness, no iteration over unordered collections, no dependence on object key order. |

Required assertions:

1. Evaluating the same input N times yields identical output.
2. Permuting the event and attempt arrays yields the **same decision**
   (diagnostic ordering may legitimately follow `event_id` / `attempt_id`).
3. No field of the output varies between runs.

---

### U-08 — No side effects, no external I/O

| | |
|---|---|
| **Expected** | inputs unmutated; no network, filesystem, clock, or database access |
| **Safety property** | The composer is a pure function. If it could persist or reach out, it would cease to be testable and would gain side effects the caller does not expect. |

Required assertions:

| # | Assertion |
|---|---|
| U-08a | The input event and attempt arrays are deep-equal to a pre-call snapshot |
| U-08b | A static import audit shows no runtime imports outside the two frozen sibling modules |
| U-08c | No `Date`, `Math.random`, `process`, `fetch`, or filesystem call appears in the module |
| U-08d | The decision object holds no reference to the input arrays |

---

## 3. Coverage summary

| ID | Scenario | Expected | Requires DB |
|---|---|---|---|
| U-01 | Human approval, no attempts | `ALLOW` | no |
| U-02 | AI review only | `DENY — HUMAN_APPROVAL_REQUIRED` | no |
| U-03 | Withdrawn | `DENY — WITHDRAWN_TERMINAL` | no |
| U-03b | Withdrawn, then re-approved | `DENY — WITHDRAWN_TERMINAL` | no |
| U-03c | Withdrawn + suppressed contradiction | `DENY — WITHDRAWN_TERMINAL` | no |
| U-04 | Contradiction | `DENY — DERIVATION_FAILED` | no |
| U-05 | Rejected only | `DENY — NOT_APPROVED` | no |
| U-05b…f | Other DRAFT histories (5) | `DENY — NOT_APPROVED` | no |
| U-06 | Delivery uncertainty | `DENY` ⚠️ **unresolved** | no |
| U-07 | Determinism | identical output | no |
| U-08 | Purity | no side effects | no |
| **Total** | **15 cases** | | **0** |

Every case is a pure-function test. U-07 and U-08 additionally constrain the
module's imports, so the audit is part of the test surface.

---

## 4. Not covered here

| Gap | Reason |
|---|---|
| The database CHECK `publish_requires_human_approval` | Database-level; needs a database |
| Drift between derived and stored values | Contract §3.6; needs stored rows |
| Idempotency key enforcement | Database-level |
| Whether a same-lifecycle `registry_commit` mismatch blocks distribution | Spec §3.5 — **rule decided** (mismatch does not authorise; re-approval required). **Enforcement pending unfreeze**: the frozen evaluator never receives `distribution.registry_commit`, so the case is unobservable. See §6.3 |
| Actual distribution mechanics | Not this layer |

---

## 5. Suggested decision shape

Not required, but recorded so the tests have something concrete to assert. The
composer **adds no state and no gate reason** — it only carries provenance.

```ts
{
  allowed: boolean;

  governance: {
    ok: boolean;
    state: GovernanceState | null;   // existing union, unchanged
  };

  delivery: {
    state: DeliveryState;            // existing union, unchanged
  };

  reasons: GateReason[];             // gate reasons, propagated verbatim

  diagnostics: Diagnostic[];         // derivation diagnostics, forwarded
}
```

Two constraints on any future implementation:

| Constraint | Reason |
|---|---|
| `reasons` must contain the gate's reasons unchanged | A forked reason set breaks any consumer matching on `GateReason` |
| A delivery block, if adopted, needs a **new** reason code | Silently reusing a governance reason would misattribute a delivery problem to governance |

---

## 6. Assumptions and their resolution status

### 6.1 Delivery uncertainty does not block distribution — **RESOLVED: Position A**

**U-06 could not be implemented as originally specified.**

The frozen layers say:

| Source | What it says |
|---|---|
| `canDistribute()` | Accepts only a governance result. It **cannot** see delivery. |
| spec §4.1 step 2 | `reconciliation_required = true` ⇒ `delivery_state = IN_FLIGHT` |
| spec §4.1 | That is its entire effect. Nothing states it blocks a new distribution. |

A repository-wide search for a blocking rule found none:

```
blocks distribution | block distribution | may not distribute | prohibit
  → no results
```

So U-06 would require the composer to introduce a **new rule**, not compose an
existing one. That contradicts this phase's constraint *"must compose existing
frozen behavior only."*

**Three positions:**

| # | Position | Consequence |
|---|---|---|
| A | **Does not block.** The gate governs; delivery is a separate concern. The composer only reports. | U-06 becomes a *reporting* test, not a denial. Zero new rules. |
| B | **Blocks.** Add `DELIVERY_UNCERTAIN` as a new `GateReason` — but that modifies `governance-gate.ts`, which this phase forbids. | Requires amending the gate first. |
| C | **Blocks via service.** The composer stays pure; the future service refuses to re-attempt while `delivery_state === "IN_FLIGHT"`. | Keeps the gate untouched, but U-06 is then not a composer test at all. |

**Decision resolved in the implementation: Position A.**

The composer does not block on delivery uncertainty. Delivery state is
reported and does not independently change the governance decision's `allowed`
result. The implementation states this directly — `DELIVERY IS REPORTED, NOT
ENFORCED` — and returns `delivery` as provenance that never feeds `allowed`.

Implementation evidence:

- `src/lib/research-distribution/distribution-decision.ts` — implements
  `composeDistributionDecision()`; `delivery` is carried as
  `{ state: DeliveryState } | null` and documented as reported, never enforced.
- `src/lib/research-distribution/distribution-decision.test.ts` — exercises
  U-01 through U-05, including the `NOT_ATTEMPTED` (non-blocking) case and the
  case where delivery input is omitted (`delivery === null`).

Position B and Position C remain **rejected**: neither adds a `GateReason`
to the frozen gate, and neither is required by the implemented contract.

**Boundary.** An implementation decision is not production enforcement. This
resolves the design question for the composer; it does not establish that any
caller enforces the §7.3 retry ban, and it does not establish production
deployment or external validation.

### 6.2 Reason attribution for a delivery block

If position B or C is chosen, a delivery denial needs its own code. Overloading
an existing `GateReason` would report a delivery problem as a governance
failure — the operator would go looking for a missing approval that is not
missing.

### 6.3 `registry_commit` split

**DECIDED.** Spec §3.5 closes this. The rule:

- Different `distribution_id` lifecycles **MAY** carry different
  `registry_commit` values. That is legitimate and is **not** a split error.
- Within one `distribution_id`, the distribution record and all participating
  approval events **MUST** refer to the same `registry_commit`.
- A mismatched approval **does not authorise** the current distribution
  decision; re-approval against the current snapshot is required.
- This is an approval-provenance / **freshness** condition, **not** a content
  contradiction (§3.2).

**ENFORCEMENT: PENDING UNFREEZE.** The frozen evaluator receives only
`GovernanceEventInput[]` and never `distribution.registry_commit`, so the
same-lifecycle mismatch is currently **unobservable**. Two cases follow:

```
Case A:  distribution = A ,  event = A
Case B:  distribution = B ,  event = A
```

Both reach `deriveGovernanceState()` as `[event(A)]`. Case B cannot be
detected without a new input threaded through frozen layers
(`derivation.ts`, `distribution-service.ts`), and `events = [A, A, B]` is
likewise unresolved because the current anchor is unknown to the evaluator.

The existing `REGISTRY_COMMIT_SPLIT` behaviour is **unchanged** and does not
implement this rule.

### 6.4 Single-writer assumption

Spec §1.2 assumes one governance writer. Composer-side determinism (U-07) holds
regardless; the assumption concerns write ordering, not derivation.

---

## 7. Reconciliation note

This matrix was originally written at design checkpoint `435aff98` (2026-10-02),
when no composer was implemented and no test file existed. The composer and its
tests now exist in the repository:

- `src/lib/research-distribution/distribution-decision.ts`
- `src/lib/research-distribution/distribution-decision.test.ts`

This reconciliation changed only this document's descriptive text. No
implementation file, migration, or database state was modified in producing it.

The cases recorded here that require a real database environment (§6.4, and
the `registry_commit` freshness enforcement in §6.3) remain **unverified** and
are **not** marked as passing. Whether the migration has been applied is a
separate question requiring separate verification.

The migration hash originally recorded here was SHA-256 `05FD21EF…F5E9F08`, along with `derivation.ts` (`A506D6E4…6162ED`) and `governance-gate.ts` (`BEA15B48…89EDD3`). **Those digests are historical and are not re-verified by this reconciliation**; they described the files at `435aff98`, not necessarily at HEAD.