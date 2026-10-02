# Research Distribution — State Derivation Specification

- **Status:** Specification. No implementation.
- **Derives from:** `20261002_research_distribution_governance.sql` (frozen) · `RESEARCH-DISTRIBUTION-APPLICATION-CONTRACT.md`
- **Decides:** review items from Phase 2G-O
- **Checkpoint:** `435aff98`
- **Schema change required:** none

---

## 0. Resolution of one conflict between the decision and the schema

The decision for fingerprint conflict is: *derivation MUST fail with a
contradiction state*.

**The schema cannot store a contradiction state.** The column is constrained:

```sql
CONSTRAINT research_distribution_governance_state_enum
  CHECK (governance_state IN
    ('DRAFT','AI_REVIEWED','HUMAN_APPROVED','WITHDRAWN')),
```

There are exactly four legal values and no fifth. Since the schema is frozen and
must not change, this specification resolves the decision as follows:

> **"Contradiction" is an outcome of the derivation, not a value of the column.**

| | Behaviour |
|---|---|
| Derivation result | **fails** — no `governance_state` is produced |
| Stored `governance_state` | **left unchanged** |
| Distribution | **refused** |
| Reported as | an error carrying the conflicting fingerprints |

This is the fail-safe reading. Two different contents having been approved for
the same record means the system cannot determine what was authorised, so it
refuses rather than guessing. Refusing is safe; selecting the latest event would
not be — it would silently pick one of two incompatible authorisations.

**No schema change is needed for this.** The column keeps its four values; the
contradiction lives only in the derivation's return type.

---

## 1. Ordering

### 1.1 Authoritative order

| Log | Order key | Rationale |
|---|---|---|
| `research_distribution_event` | `event_id` ASC | `GENERATED ALWAYS AS IDENTITY` — cannot be set by the application, and `REVOKE UPDATE` makes the value immutable after insert. |
| `research_distribution_attempt` | `attempt_id` ASC | same |

`approved_at` and `started_at` / `completed_at` are **evidence, not ordering
keys**. `approved_at` is stated by the actor and can be misreported or skewed.

### 1.2 Known limitation

`IDENTITY` values are allocated inside the transaction, but commit order is not
guaranteed. Two concurrent writes may receive ids 5 and 6 and commit in the order
6, 5.

This specification assumes a **single governance writer** (the governance layer
acting through the service role). If concurrent governance writes cannot be
serialised at the application layer, this assumption is violated and the derived
order may differ from commit order.

Recorded as a residual limitation, not a defect in the derivation.

---

## 2. Valid event definition

An event participates in derivation only if **all** of the following hold:

| # | Condition | Basis |
|---|---|---|
| 1 | `decision = 'approved'` **or** `'withdrawn'` | contract §3.7 |
| 2 | `approver_id` is non-empty | approver must be named |
| 3 | `approval_ref` is non-empty | must be durably auditable |
| 4 | `decision = 'approved'` implies `approver_type` is `HUMAN` or `AI_REVIEW` | `SYSTEM` never authorises |

Events failing any condition **do not participate** but **are retained in full**.
A rejection or an exception is a fact worth preserving.

### 2.1 `rejected` — does not revoke

```
decision = 'rejected'  →  excluded from derivation, retained
```

A `rejected` event **never removes an existing approval**. This is
counterintuitive but is the contract's explicit position: *"A `rejected` event
does not un-approve an approved record"* (§3.7).

To revoke an approval, the correct decision is `withdrawn`. Using `rejected` for
revocation would produce a record that reads as approved while an operator
believes it was refused.

### 2.2 `exception_granted` — does not approve

```
decision = 'exception_granted'  →  excluded from derivation, retained
```

The schema CHECK `research_distribution_event_exception_reason` requires a
non-empty `reason` for this value. The event is a justified annotation; it moves
no state. An implementation that treated an exception as approval would be
blocked at the `HUMAN_APPROVED` check, because the derivation never produces that
value from an exception.

### 2.3 `approver_type = SYSTEM` — evidence actor only

```
approver_type = 'SYSTEM'  →  excluded from derivation, retained
```

`SYSTEM` records that a machine acted. It is a technical authorisation mechanism
or an automated process, **not a governance identity**. It never advances
`governance_state` and never satisfies the authorisation gate.

The value is retained because suppressing it would lose audit history, and
because the contract distinguishes it from a Human Approver (§2.7).

---

## 3. `governance_state` derivation

### 3.1 Precedence order

```
1. WITHDRAWN                       → terminal, evaluated FIRST (§3.3)
2. Contradiction check             → derivation FAILS if reached (§3.2)
3. Highest achieved approval level → AI_REVIEWED < HUMAN_APPROVED
4. Default                         → DRAFT
```

**Withdrawal precedes contradiction.** A withdrawn record can never be
distributed regardless of its approval history, so no safety requirement is
served by raising a contradiction on one. The conflicting fingerprints remain
available for diagnostics.

This ordering is authoritative and is what §3.3 has always described. An
earlier revision of this document listed the contradiction check first, which
contradicted §3.3; the list above is the correction.

### 3.2 Contradiction detection

Reached **only when no participating `withdrawn` event exists** (§3.1 step 1).

Collect `content_fingerprint` across all **participating** `approved` events
(any `approver_type` that participates).

```
distinct = set of content_fingerprint over participating approved events

if len(distinct) > 1  →  CONTRADICTION
                        derivation fails
                        no governance_state produced
                        stored value left unchanged
                        distribution refused
                        error reports the conflicting fingerprints
```

**Selecting the latest event is explicitly forbidden.** The order key does not
resolve which content was authorised; it only resolves which record was written
last. An operator who approved content A and later, after an unnoticed edit,
approved content B has produced a record where neither approval is clearly the
governing one.

Notes:

- Events excluded by §2 — including all `SYSTEM`, `rejected`,
  `exception_granted` and `withdrawn` — do **not** contribute fingerprints.
- A `withdrawn` event does **not** contribute a fingerprint either.
- `registry_commit` is **not** an input to contradiction detection. See §3.5.

### 3.3 `WITHDRAWN` precedence

```
if any participating withdrawn event exists  →  WITHDRAWN
```

Evaluated **first**, before contradiction detection — see §3.1. A withdrawn
record can never be distributed regardless of its approval history, so no safety
requirement is served by raising a contradiction there. The conflicting
fingerprints remain available for diagnostics if desired.

**Terminal.** An `approved` event written after a withdrawal does **not** restore
the record. Derivation remains `WITHDRAWN`. Restoration requires a new
distribution record with a new fingerprint — the append-only log cannot be
rewritten, so a reversal must be expressed by a new record, not a new event.

### 3.4 Highest approval level wins

```
achieved = { AI_REVIEWED   if any participating approved(AI_REVIEW) event exists
             HUMAN_APPROVED if any participating approved(HUMAN) event exists }

result = HUMAN_APPROVED if HUMAN_APPROVED in achieved
        AI_REVIEWED   if AI_REVIEWED   in achieved
        DRAFT         otherwise
```

**Monotonic escalation.** A later `AI_REVIEWED` event never downgrades a record
that already reached `HUMAN_APPROVED`. The highest level ever validly reached is
retained.

`AI_REVIEWED < HUMAN_APPROVED`. Machine review is an input to the human decision
and can never substitute for it.

### 3.5 Unresolved: `registry_commit` split across approvals

**Status: OPEN — no rule is specified, and none is invented here.**
**This section is about contradiction detection, not about where the value
comes from.** How a `registry_commit` is derived is settled in §3.6. Whether
two approvals naming different `registry_commit` values conflict is a
separate question and remains open.

Two or more participating `approved` events may share a single
`content_fingerprint` while naming **different** `registry_commit` values. That
is, the same content, approved against different Registry snapshots.

Whether this constitutes a contradiction is **undefined**. The question is
recorded here so it is not silently resolved by an implementation.

What is settled:

- Contradiction detection keys on `content_fingerprint` **only** (§3.2).
- `registry_commit` is **not** an input to any derivation in §3 or §4.
- Therefore an evaluator built strictly to this document will treat a
  `registry_commit` split as **NOT a contradiction**, and will return
  `HUMAN_APPROVED`.

Why the question is not trivially answered:

| Position | Argument |
|---|---|
| **Not a contradiction** | Content is identical — same bytes, same JCS, same hash. Nothing ambiguous about *what* was authorised. |
| **A contradiction** | The approver judged the record as it appeared in Registry snapshot X. A later snapshot Y may show changed lifecycle, status or supersession. Same content hash does not imply same judgement. |

The two positions differ on what an approval is bound to: the **content**, or
the **Registry view at approval time**. This specification currently asserts the
former, by omission rather than by decision.

Note that treating it as a contradiction would be **strictly more conservative**
than not treating it as one — it refuses distribution rather than permitting it.
The refusal is therefore safe, but it would also block legitimate re-approval
after an unrelated Registry update, which is why the trade-off must be decided
deliberately rather than defaulted.

**Consequence for testing.** `RESEARCH-DISTRIBUTION-STATE-TEST-MATRIX.md` §7
item 1 records this as untested. Writing a test now would assert an undecided
decision. No evaluator should encode either behaviour until this is resolved.

**This section is not a rule.** It is a placeholder that must be replaced with
one of the two positions above, or a third, before any evaluator is written.
Derivation of the value itself is **not** open; see §3.6.
Derivation of the value itself is **not** open; see §3.6.

### 3.6 `registry_commit` derivation — LOCKED

**Status: RESOLVED.** This section replaces the open provenance question; the
open contradiction question in §3.5 is unaffected and remains open.

#### 3.6.1 What the value is

`research_distribution.registry_commit` holds a **Git commit SHA**.

It is **decision provenance**, not Registry content identity: it names the
repository commit at which the Distribution Decision was made and whose
Registry snapshot was actually validated. An unrelated repository commit
changes the value even when Registry bytes did not change. That is intended.

It is **not** any of the following, and no fallback to any of them exists:

| Rejected value | Why |
|---|---|
| Registry content hash | Different identity; the column is a commit SHA |
| Blob SHA | Names a file, not a decision point |
| Branch name | Branch is not part of the value (see 3.6.6) |
| Timestamp | Not reproducible; not a Git object |
| `source_commit` | Anchors the source file, not the Registry (see 3.6.5) |
| Registry introduction commit | Stale; it carries superseded Registry bytes |

#### 3.6.2 Definition of a validated Registry snapshot

A validated Registry snapshot is the exact bytes of
`docs/research-assets.registry.yaml` that were validated for this decision
**and** are proven identical to the copy of that path stored at the
decision-time HEAD.

```
working-tree Registry
        |
        | validator
        v
validated Registry
        |
        | exact byte equality
        v
HEAD:docs/research-assets.registry.yaml
        |
        v
registry_commit = HEAD
```

#### 3.6.3 Derivation algorithm

In order. Each step is a hard failure; there is no fallback.

```
1.  Validate the Registry from the working tree.   failure -> HARD FAIL
2.  Resolve HEAD to a commit SHA.                   failure -> HARD FAIL
3.  Resolve HEAD's copy of the Registry path.
                                                     absent  -> HARD FAIL
4.  Compare exact bytes, working tree vs HEAD copy.  differ  -> HARD FAIL
5.  registry_commit = HEAD
```

**No hidden normalization.** Step 4 compares raw file bytes. It is not a
comparison of parsed YAML and it does not normalize line endings, a BOM,
trailing whitespace, or any other encoding detail. Two Registry files that
differ in any byte are different snapshots.

**No historical search.** Step 5 does not search for the earliest commit
containing the blob, the latest such commit, the Registry introduction
commit, the master branch commit, or a merge base. Those are deliberately
excluded; see 3.6.7.

#### 3.6.4 Working-tree rule

| Working-tree state | Allowed |
|---|---|
| Registry clean, other repository files dirty | **Yes** |
| Registry modified in the working tree | **No — HARD FAIL** |

The validator reads the working tree. If that file differs from HEAD, the
bytes that were validated are not bytes any commit records, so **no commit
SHA can honestly represent them.** Recording HEAD anyway would state
provenance that is false. Commit the Registry first; this is an operational
fix, not a governance one.

#### 3.6.5 `source_commit` is a different thing

`source_commit` remains the establishing Git commit of the canonical
**source file** named by the Registry `source` contract. It anchors content
provenance. `registry_commit` anchors the Registry snapshot reviewed.

The two MUST NOT be substituted for one another, and the fact that both
are hex commit ids does not make them interchangeable.

#### 3.6.6 Branch semantics

Branch name is **not** part of `registry_commit`.

- Two branches at different commits yield different values. Expected.
- Two branches at the same commit yield the same value. Also expected.

#### 3.6.7 Why the reverse mapping is not used

Git proves the forward direction:

```
registry_commit -> commit -> repository tree -> Registry path -> exact bytes
```

The reverse is **not** used, because it has no unique answer: the same
Registry blob is carried by more than one commit, so "find the commit
containing these bytes" is ambiguous. This is why 3.6.3 derives from HEAD
and never from a search.

---


---

## 4. `delivery_state` derivation

### 4.1 Precedence

```
1. no attempt                                        → NOT_ATTEMPTED
2. any attempt with reconciliation_required = true    → IN_FLIGHT
3. any attempt with status = SUCCEEDED                → PUBLISHED
4. any attempt with status = IN_FLIGHT                → IN_FLIGHT
5. otherwise                                         → FAILED
```

Step 2 precedes step 3 deliberately: an unresolved uncertain outcome must not be
masked by an earlier success. Until a human determines what happened, the record
is not `PUBLISHED`.

### 4.2 `SKIPPED` — documented limitation

```
status = SKIPPED  →  neither success nor failure
```

If the only attempt for a record is `SKIPPED`, derivation returns **`FAILED`**.

**Limitation, stated plainly.** `FAILED` then conflates two different facts:

| Reality | Derived as |
|---|---|
| the platform rejected the post | `FAILED` |
| delivery was deliberately not attempted | `FAILED` |

The contract describes `SKIPPED` as a deliberate non-delivery and *"not a
failure"* (§3.3). The current schema cannot represent that distinction in
`delivery_state`, because its enum has no value for it.

**Resolution for now: keep the schema unchanged and carry the distinction in the
attempt log.** Operators must read the attempt rows — `status = SKIPPED` — to
learn that a record was deliberately skipped rather than unsuccessfully
attempted. The `delivery_state` value alone is insufficient for this.

Resolving this properly would require a schema change, which is out of scope.

---

## 5. Missing and invalid history

| Situation | Result | Error? |
|---|---|---|
| No events | `DRAFT` | no — record never approved |
| No attempts | `NOT_ATTEMPTED` | no — nothing sent |
| Events exist, none participating (e.g. only `rejected`) | `DRAFT` | no — exists but unauthorised |
| Participating event with empty `approver_id` or `approval_ref` | excluded; diagnostic recorded | no |
| Derivation disagrees with stored `governance_state` | **error raised**, stored value unchanged, never silently corrected | **yes** |
| Contradiction detected | **error raised**, derivation fails | **yes** |

**Missing approval history is not an error.** It is the expected state of an
unapproved record. Refusing delivery is correct behaviour, not a failure.

**Drift between derivation and stored value is an error**, per contract §3.6. It
indicates direct manipulation of the cache column, a derivation bug, or an event
not accounted for. All three require human attention.

---

## 6. Determinism

The derivation is a pure function of the two logs.

| Property | Status |
|---|---|
| No randomness | ✅ |
| No wall-clock dependency | ✅ ordering by identity columns only |
| No external I/O beyond reading the two tables | ✅ |
| Full recomputation, no incremental cache | ✅ contract §3.6 |
| Total order on inputs | ✅ `event_id` / `attempt_id` are primary keys |

The single source of non-determinism is §1.2: concurrent transaction ordering.
It is an architectural assumption about writer serialisation, not a property of
the algorithm.

---

## 7. Residual open items

| # | Item | Status |
|---|---|---|
| 1 | **`registry_commit` split** — two approvals of the **same** fingerprint under different Registry snapshots. Not covered by the contradiction rule, which is fingerprint-scoped. Whether an approval survives a Registry change is undefined. | open — see §3.5 |
| 2 | **Single-writer assumption** — §1.2 requires the application layer to serialise governance writes. Not enforced anywhere. | open |
| 3 | **`SKIPPED` conflation** — §4.2 documented, not resolved. | accepted as limitation |
| 4 | **Contradiction reporting surface** — the error must surface the conflicting fingerprints. Where it surfaces (log, operator listing, or both) is unspecified. | open |

Item 1 is the most likely to be encountered in practice and has no agreed
resolution. **§3.5 is its detailed treatment.**

---

## 8. No-code confirmation

This document specifies derivation rules only. No evaluator has been written, no
schema has been changed, and the migration remains byte-identical
(SHA-256 `05fd21ef…f5e9f08`).