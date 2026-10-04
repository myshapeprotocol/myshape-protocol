# Research Distribution — State Derivation Test Matrix

- **Status:** Reconciled against the current repository.
- **Original design checkpoint:** `435aff98` (2026-10-02) — at that commit this matrix was design-only, with no evaluator and no test files.
- **Current implementation reconciliation:** the derivation/evaluator implementation and its tests now exist in the repository — `src/lib/research-distribution/derivation.ts` and `derivation.test.ts`.
- **Specifies the contract for:** `RESEARCH-DISTRIBUTION-DERIVATION-SPEC.md`
- **Conforms to:** `20261002_research_distribution_governance.sql` · `RESEARCH-DISTRIBUTION-APPLICATION-CONTRACT.md`
- **New states introduced:** none
- **Schema changes assumed:** none

---

## 0. Defect found in the derivation spec — resolved here

The derivation specification contradicts itself on one point.

| Location | Statement |
|---|---|
| §3.1 precedence list | `1. Contradiction check → derivation FAILS` then `2. WITHDRAWN` |
| §3.3 prose | WITHDRAWN is *"Evaluated **before** contradiction detection"* |

These cannot both hold. This matrix resolves it in favour of §3.3, because:

1. §3.3 carries the stated rationale — a withdrawn record can never be
   distributed, so no safety requirement is served by raising a contradiction
   on it.
2. Both orders are equally **safe** (a withdrawn record is undistributable either
   way), so the tie-breaker is the reasoning, not the risk.
3. §3.1's numbered list should be corrected to match.

**Resolution used throughout this matrix: `WITHDRAWN` short-circuits before
contradiction detection.**

See test **G-18**, which pins this behaviour.

---

## 1. Notation

### 1.1 Event fixtures

All assume complete identity (`approver_id`, `approval_ref` non-empty) unless
stated otherwise.

| Token | `decision` | `approver_type` | Note |
|---|---|---|---|
| `A_H` | `approved` | `HUMAN` | |
| `A_AI` | `approved` | `AI_REVIEW` | |
| `A_SYS` | `approved` | `SYSTEM` | evidence actor only |
| `A_NOID` | `approved` | `HUMAN` | **empty `approver_id`** |
| `A_NOREF` | `approved` | `HUMAN` | **empty `approval_ref`** |
| `W_H` | `withdrawn` | `HUMAN` | |
| `R_H` | `rejected` | `HUMAN` | |
| `X_H` | `exception_granted` | `HUMAN` | with non-empty `reason` |

Fingerprints are written `A_H@FP_A` when the fingerprint matters.

### 1.2 Attempt fixtures

| Token | `status` | `reconciliation_required` |
|---|---|---|
| `a_INFLIGHT` | `IN_FLIGHT` | false |
| `a_SUCC` | `SUCCEEDED` | false |
| `a_FAIL` | `FAILED` | false |
| `a_SKIP` | `SKIPPED` | false |
| `a_UNCERT` | any | **true** |

### 1.3 Result tokens

| Token | Meaning |
|---|---|
| `DRAFT` · `AI_REVIEWED` · `HUMAN_APPROVED` · `WITHDRAWN` | a legal `governance_state` |
| `NOT_ATTEMPTED` · `IN_FLIGHT` · `PUBLISHED` · `FAILED` | a legal `delivery_state` |
| **`FAIL`** | derivation produces no state and raises |

**`FAIL` is a derivation outcome, not a state.** The schema constrains
`governance_state` to four values; no contradiction value exists to store (§0 of
the derivation spec).

---

## 2. `governance_state` matrix

### 2.1 Absence and exclusion

| ID | Events | Expected | Rationale |
|---|---|---|---|
| G-01 | *(none)* | `DRAFT` | never approved |
| G-02 | `R_H` | `DRAFT` | `rejected` does not participate |
| G-03 | `X_H` | `DRAFT` | `exception_granted` does not approve |
| G-04 | `A_SYS` | `DRAFT` | `SYSTEM` never authorises |
| G-05 | `A_NOID` | `DRAFT` | incomplete identity excluded |
| G-06 | `A_NOREF` | `DRAFT` | incomplete evidence excluded |
| G-07 | `R_H`, `X_H`, `A_SYS` | `DRAFT` | all three excluded together |

G-02 through G-07 are the cases an implementation is most likely to get wrong by
treating any event as meaningful.

### 2.2 Single approval

| ID | Events | Expected | Rationale |
|---|---|---|---|
| G-08 | `A_AI` | `AI_REVIEWED` | machine review ceiling |
| G-09 | `A_H` | `HUMAN_APPROVED` | direct human approval permitted |

### 2.3 Escalation and monotonicity

| ID | Events | Expected | Rationale |
|---|---|---|---|
| G-10 | `A_AI`, `A_H` | `HUMAN_APPROVED` | escalation |
| G-11 | `A_H`, `A_AI` | `HUMAN_APPROVED` | **no downgrade** — the later AI event must not demote |
| G-12 | `A_AI`, `A_AI`, `A_H` | `HUMAN_APPROVED` | repeated review is idempotent |
| G-13 | `A_H`, `A_H@FP_A`, `A_H@FP_A` | `HUMAN_APPROVED` | duplicate approval of identical content is not a contradiction |

G-11 is the ordering-sensitivity test: `A_H` then `A_AI` must yield the same
result as G-10. Any implementation that processes only the latest event fails
this.

### 2.4 Withdrawal

| ID | Events | Expected | Rationale |
|---|---|---|---|
| G-14 | `W_H` | `WITHDRAWN` | withdrawal alone is sufficient |
| G-15 | `A_H`, `W_H` | `WITHDRAWN` | withdrawal overrides approval |
| G-16 | `W_H`, `A_H` | `WITHDRAWN` | order-independent |
| G-17 | `A_H`, `W_H`, `A_H` | `WITHDRAWN` | **terminal** — a post-withdrawal approval does not restore |
| G-18 | `W_H`, `A_H@FP_A`, `A_H@FP_B` | **`WITHDRAWN`** | withdrawal short-circuits contradiction (§0) |

G-18 pins the resolution of the spec defect. An implementation that checks
contradiction first would return `FAIL` here instead.

### 2.5 Contradiction

| ID | Events | Expected | Rationale |
|---|---|---|---|
| G-19 | `A_H@FP_A`, `A_H@FP_B` | **`FAIL`** | two contents approved for one record |
| G-20 | `A_AI@FP_A`, `A_H@FP_B` | **`FAIL`** | AI event also contributes a fingerprint |
| G-21 | `R_H@FP_B`, `A_H@FP_A` | `HUMAN_APPROVED` | `rejected` contributes no fingerprint |
| G-22 | `X_H@FP_B`, `A_H@FP_A` | `HUMAN_APPROVED` | exception contributes no fingerprint |
| G-23 | `A_SYS@FP_B`, `A_H@FP_A` | `HUMAN_APPROVED` | `SYSTEM` contributes no fingerprint |
| G-24 | `W_H@FP_C`, `A_H@FP_A`, `A_H@FP_B` | `WITHDRAWN` | withdrawn fingerprint is irrelevant |
| G-25 | `A_NOID@FP_B`, `A_H@FP_A` | `HUMAN_APPROVED` | excluded event contributes no fingerprint |

G-19 must **never** resolve by selecting the latest event. The expected outcome
is `FAIL`, not `HUMAN_APPROVED`.

### 2.6 Properties

| ID | Property | Assertion |
|---|---|---|
| G-26 | Order independence | Every fixture set permuted yields the same result |
| G-27 | Determinism | The same set evaluated twice yields an identical result |
| G-28 | No mutation | Derivation performs no write of any kind |
| G-29 | Closure | Every result is one of the four legal values, or `FAIL` |
| G-30 | Drift | Derived ≠ stored `governance_state` raises an error; stored value unchanged; never silently corrected (contract §3.6) |

---

## 3. `delivery_state` matrix

### 3.1 Absence and single attempt

| ID | Attempts | Expected | Rationale |
|---|---|---|---|
| D-01 | *(none)* | `NOT_ATTEMPTED` | nothing sent |
| D-02 | `a_INFLIGHT` | `IN_FLIGHT` | in progress |
| D-03 | `a_SUCC` | `PUBLISHED` | confirmed delivery |
| D-04 | `a_FAIL` | `FAILED` | confirmed failure |
| D-05 | `a_SKIP` | `FAILED` | **documented limitation** — see §3.4 |
| D-06 | `a_UNCERT` | `IN_FLIGHT` | outcome unresolved |

### 3.2 Multiple attempts

| ID | Attempts | Expected | Rationale |
|---|---|---|---|
| D-07 | `a_FAIL`, `a_SUCC` | `PUBLISHED` | one success is sufficient |
| D-08 | `a_FAIL`, `a_FAIL` | `FAILED` | all attempts failed |
| D-09 | `a_FAIL`, `a_INFLIGHT` | `IN_FLIGHT` | current attempt outranks history |
| D-10 | `a_SUCC`, `a_SUCC` | `PUBLISHED` | idempotent |
| D-11 | `a_SKIP`, `a_SUCC` | `PUBLISHED` | later success overrides a skip |
| D-12 | `a_SKIP`, `a_SKIP` | `FAILED` | all skipped, none delivered |

### 3.3 Reconciliation precedence

| ID | Attempts | Expected | Rationale |
|---|---|---|---|
| D-13 | `a_SUCC`, `a_UNCERT` | **`IN_FLIGHT`** | uncertainty masks an earlier success |
| D-14 | `a_FAIL`, `a_UNCERT` | `IN_FLIGHT` | uncertainty outranks failure |
| D-15 | `a_INFLIGHT`, `a_UNCERT` | `IN_FLIGHT` | |

D-13 is the most consequential test in this section. Reporting `PUBLISHED` when
an attempt's outcome is unknown would tell an operator the delivery is confirmed
when it is not — and would permit a retry that produces a duplicate post.

### 3.4 `SKIPPED` limitation — explicit coverage

| ID | Assertion |
|---|---|
| D-16 | `a_SKIP` derives `FAILED`, the same value as `a_FAIL` |
| D-17 | The attempt row is the only place the distinction is recoverable: `status = SKIPPED` means deliberate non-delivery |
| D-18 | Any operator-facing surface reading `delivery_state = FAILED` alone **cannot** distinguish D-04 from D-05 |

D-18 is a known, accepted limitation of the current schema (derivation spec
§4.2). It is recorded here so the gap is visible in testing rather than
discovered in use. Resolving it requires a schema change, out of scope.

### 3.5 Properties

| ID | Property | Assertion |
|---|---|---|
| D-19 | Order independence | Every permutation of a fixture set yields the same result |
| D-20 | Determinism | The same set evaluated twice yields an identical result |
| D-21 | Closure | Every result is one of the four legal values — never `SKIPPED`, which is not a `delivery_state` |
| D-22 | Drift | Derived ≠ stored `delivery_state` raises an error; never silently corrected |

D-21 pins the distinction most likely to be implemented wrongly: `SKIPPED` is an
**attempt** status and must never appear as a derived `delivery_state`.

---

## 4. Cross-cutting

| ID | Assertion |
|---|---|
| X-01 | The two derivations are independent — no event input affects `delivery_state`, no attempt input affects `governance_state` |
| X-02 | Governance is evaluated before delivery (contract §3.6) |
| X-03 | A derivation failure in governance does not produce a delivery result either |
| X-04 | No test may introduce a state outside the four+four legal values |
| X-05 | No test may require a schema change, new column, or new constraint |
| X-06 | `delivery_state = PUBLISHED` is unreachable unless `governance_state = HUMAN_APPROVED` (contract §3.4, database-enforced) |

X-06 is enforced by the schema CHECK
`research_distribution_publish_requires_human_approval`, not by derivation. The
test asserts the invariant holds; it is not a derivation test.

---

## 5. Coverage accounting

| Group | Tests | Requires database |
|---|---|---|
| Absence and exclusion | 7 | no |
| Single approval | 2 | no |
| Escalation and monotonicity | 4 | no |
| Withdrawal | 5 | no |
| Contradiction | 7 | no |
| Governance properties | 5 | no |
| Delivery — single | 6 | no |
| Delivery — multiple | 6 | no |
| Delivery — reconciliation | 3 | no |
| Delivery — SKIPPED limitation | 3 | no |
| Delivery properties | 4 | no |
| Cross-cutting | 6 | no |
| **Total** | **58** | **0** |

**Every test in this matrix is a pure-function test.** None requires a database,
a Registry, or a platform. The derivation is a function of two log fixtures, so
the whole matrix is executable as unit tests against in-memory inputs.

This is the practical consequence of the derivation being pure — and the reason
the Phase 2G-M blocker on database access does **not** block this work.

---

## 6. What this matrix does not cover

| Gap | Reason |
|---|---|
| Constraint enforcement (`publish_requires_human_approval`, completion consistency, exception reason) | Database-level; needs a database (X-06 asserts the invariant, not the constraint) |
| Append-only trigger on the event table | Database-level |
| Idempotency key uniqueness | Database-level |
| Drift detection against a real stored column | Needs a stored row to compare against |
| Reconciliation guard blocking a new attempt | Application-level, spans the attempt log |

These remain blocked on the database environment identified in Phase 2G-M.

---

## 7. Open items affecting the matrix

| # | Item | Effect on tests |
|---|---|---|
| 1 | **`registry_commit` freshness (§3.5)** — same-lifecycle approval provenance mismatch | **Governance rule CLOSED; enforcement PENDING UNFREEZE.** The rule is settled (spec §3.5), but the frozen evaluator receives only `GovernanceEventInput[]` and never `distribution.registry_commit`, so Cases B and D below are **unobservable, not merely untested**. No executable test may assert enforcement until the pipeline is unfrozen. See §7.1. |
| 2 | **Spec defect §3.1 vs §3.3** | Resolved in this matrix (§0, G-18). The derivation spec should be corrected. |
| 3 | **Single-writer assumption** | Not testable at the unit level; requires concurrency testing against a real database. |

### 7.1 `registry_commit` freshness cases A–F

Spec §3.5 defines these cases. This matrix records what is **testable now**
and what is **blocked**, and does **not** mark a blocked case as passing.

| Case | Shape | Status | Note |
|---|---|---|---|
| A | one lifecycle, `distribution = A`, event `= A` | **Testable now — baseline valid** | Equal values agree; derivation is `HUMAN_APPROVED`. |
| B | one lifecycle, `distribution = B`, event `= A` | **GOVERNANCE RULE DEFINED / ENFORCEMENT PENDING UNFREEZE** | The evaluator never receives `distribution.registry_commit`, so this is byte-identical to Case A at the input. **Unobservable**, not merely unimplemented. |
| C | one lifecycle, several approvals, all `= A` | **Testable now — baseline valid** | Agreement across events holds; derivation is `HUMAN_APPROVED`. |
| D | one lifecycle, events `[A, A, B]`, anchor unknown | **GOVERNANCE RULE DEFINED / ENFORCEMENT PENDING UNFREEZE** | The evaluator sees two commits but cannot determine which is the current distribution anchor, so it cannot decide which approvals are stale. |
| E | two lifecycles, `distribution 1 = A`, `distribution 2 = B` | **Testable now — legitimate** | Distinct lifecycles legitimately differ. **Not** a split error and **not** a contradiction. |
| F | same `content_fingerprint`, different `registry_commit` | **Testable now — not a content contradiction** | Derivation remains `ok = true`; the fingerprint is the only contradiction key (§3.2). This is a freshness condition, not a content conflict. |

**Do not manufacture executable tests for B or D.** Asserting them today
would either fail or force the frozen evaluator to be altered to make the
matrix green, which is exactly the outcome this record exists to prevent.
Until the pipeline is unfrozen, B and D remain specified-but-unenforced.

**Existing evaluator behaviour is unchanged and must not be read as
enforcement.** `REGISTRY_COMMIT_SPLIT` reports a split among event commits
and still returns `HUMAN_APPROVED`; it does not implement §3.5.

---

## 8. Reconciliation note

This matrix was originally written at design checkpoint `435aff98` (2026-10-02),
when no evaluator was implemented and no test file existed. The evaluator and
its tests now exist in the repository:

- `src/lib/research-distribution/derivation.ts`
- `src/lib/research-distribution/derivation.test.ts`

This reconciliation changed only this document's descriptive text. No
implementation file, migration, or database state was modified in producing it.

The open items in §7 remain open. In particular: the `registry_commit`
freshness cases B and D are still **unobservable** rather than merely
untested; the derivation spec defect noted in §0 item 2 is recorded as a defect
to be corrected in that spec, not as corrected here; and the cases requiring a
real database environment remain **unverified** and are **not** marked as
passing. The migration digest originally recorded in this document described
`435aff98` and is **not re-verified** by this reconciliation. Whether the
migration has been applied is a separate question requiring separate
verification.