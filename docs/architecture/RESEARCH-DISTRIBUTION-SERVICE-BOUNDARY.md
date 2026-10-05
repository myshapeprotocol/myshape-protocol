# Research Distribution — Service Boundary

- **Status:** Architecture design only. No implementation.
- **Defines:** the execution boundary *after* the decision composer
- **Conforms to:** `RESEARCH-DISTRIBUTION-APPLICATION-CONTRACT.md` · `RESEARCH-DISTRIBUTION-DERIVATION-SPEC.md` · `RESEARCH-DISTRIBUTION-DECISION-TEST-MATRIX.md`
- **Checkpoint:** `435aff98`
- **Schema change required:** none
- **Consumes (frozen):** `distribution-decision.ts` · `governance-gate.ts` · `derivation.ts`

---

## 0. The one rule this document exists to protect

> **The decision layer can authorise or deny. It cannot publish.**

Everything below is subordinate to that separation. Three layers exist, and the
arrows between them are one-way:

```
┌─────────────────────────────────────────────────────────────────┐
│  DECISION LAYER — pure, no I/O, no database, no platform         │
│                                                                  │
│  deriveGovernanceState()  →  canDistribute()  →  compose()      │
│                                                                  │
│  Answers: "may distribution proceed?"  Never: "what was sent?"  │
└─────────────────────────────────────────────────────────────────┘
                              │  allowed verdict
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER — the only component with database credentials    │
│                                                                  │
│  preconditions → re-read → persist intent → invoke → record      │
│                                                                  │
│  Owns ordering, transactions, retries, and the TOCTOU re-read    │
└─────────────────────────────────────────────────────────────────┘
                              │  pre-approved payload
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADAPTER LAYER — one platform, one call, no authority            │
│                                                                  │
│  Receives bytes already approved. Sends them. Reports outcome.   │
│  Has no database access and cannot mint permission.              │
└─────────────────────────────────────────────────────────────────┘
```

**The arrows are not reversible.** No layer above may be re-entered from
below. An adapter that can call `canDistribute` and ignore its answer has
reintroduced the bypass this architecture exists to prevent.

---

## 1. Execution boundary

### 1.1 Where the decision layer stops

The composer returns `DistributionDecision`. At that moment the decision layer
is **complete and its work is finished**.

| The decision layer has | The decision layer has not |
|---|---|
| Decided `allowed` | Decided *when* to act |
| Produced machine-readable `reasons` | Chosen a platform |
| Reported `governance.state`, `delivery.state` | Written any row |
| Forwarded diagnostics | Opened a connection |
| Computed `isRetryBlocked()` | Retried anything |

`composeDistributionDecision()` performs no I/O and holds no credentials. Its
output is a value, and a value cannot publish.

### 1.2 What begins at the boundary

The service layer begins. It is the **first and only** component that may hold
database credentials for the `research_distribution*` tables.

| Concern | Owner | Why here |
|---|---|---|
| Loading event and attempt logs | Service | Only the service can read |
| Choosing *when* to act | Service | Pure layer has no clock |
| Re-reading state before sending | Service | Requires a fresh read (TOCTOU) |
| Opening/closing a transaction | Service | Requires a connection |
| Calling the adapter | Service | Owns the ordering |
| Recording the attempt | Service | Owns the transaction |

### 1.3 The decision layer is not extended

A tempting pattern is to add `publishNow()` next to `compose()`. This document
forbids it. The decision layer stays pure because purity is what makes it
testable, reviewable, and safe to reason about — 114 assertions run with no
database.

> Adding I/O to a pure module to save one function call trades a verifiable
> property for a convenience.

---

## 2. Preconditions before adapter invocation

Every condition must hold. They are checked in this order, because a later
check cannot rescue an earlier failure.

| # | Precondition | Source | Failure ⇒ |
|---|---|---|---|
| P1 | A decision exists and `decision.allowed === true` | composer | Stop. No adapter call. |
| P2 | `decision.reasons` is empty | composer | Stop. Implied by P1; asserted as a consistency check. |
| P3 | Event and attempt logs loaded **inside the service** | service | Stop. Nothing may be taken on trust. |
| P4 | Fresh derivation + gate computed from those logs | `deriveGovernanceState`, `canDistribute` | Stop on `DERIVATION_FAILED`. |
| P5 | **Re-verification against the event history** — see §2.1 | contract §3.4 | Stop. This is the TOCTOU gate. |
| P6 | No unresolved attempt exists (`isRetryBlocked` false) | contract §7.3 | Stop. Bar the retry. |
| P7 | Idempotency key absent, or the existing row is itself distributable | schema UNIQUE | Stop. Do not duplicate. |
| P8 | Rendered text is byte-identical to the approved fingerprint | contract §5.3 | Stop. Never transform post-approval. |
| P9 | An adapter exists for the named platform | registry | Stop. Unknown platform is not a default. |

### 2.1 P5 — re-verification semantics

**P5 is not "read the column again."** It is a full re-derivation from the
authoritative history. The distinction is the whole point of this section.

`research_distribution.governance_state` is a **derived operational cache**
(migration line 378: *"Derived operational cache recomputed from
research_distribution_event"*). It is a convenience for display and query
planning. It is **not** an authorisation source, and reading it is not
re-verification.

An earlier revision of this document wrote P5 as *"re-read `governance_state`
equals `HUMAN_APPROVED`"*. That wording was unsafe: taken literally it means
reading a mutable cache column, which a caller with row-level UPDATE can set to
any legal value. Reading a tampered cache is not verification.

**Before any external distribution attempt, the service MUST:**

| Step | Action |
|---|---|
| 1 | Reload the authoritative governance event history from `research_distribution_event` |
| 2 | Re-run `deriveGovernanceState()` on that history |
| 3 | Re-run `canDistribute()` on that result |
| 4 | Recompose the `DistributionDecision` |
| 5 | Compare the recomputed decision against the decision used to enter the attempt path |

**Any disagreement is an error, not a tie-break.** The service **fails closed**:
it aborts the attempt, leaves every stored value unchanged, and surfaces the
drift. It never prefers the newer value, never re-resolves, and never silently
corrects the cache — this is contract §3.6 applied to authorisation rather than
to display.

Rationale for re-deriving rather than reading the cache: the event table is
append-only and protected by three independent database layers (explicit
`REVOKE UPDATE, DELETE, TRUNCATE`, plus `BEFORE UPDATE` and `BEFORE DELETE`
triggers). The cache column is protected by neither. Re-deriving reads the
guarded artefact; reading the cache does not.

### 2.2 Why P5 is separate from P1

P1 uses a decision computed from logs read **earlier**. Between that read and
the outbound call, an operator may withdraw the approval — and because the event
log is append-only, that withdrawal becomes visible only by re-reading it. P5
closes that window.

The database CHECK `research_distribution_publish_requires_human_approval`
cannot do this job: it constrains the stored row, not the moment of the call. A
record can sit valid in the database while the executor sends anyway.

**Consequence:** the pure decision is necessary but not sufficient. It narrows
the set of things worth attempting; the re-derivation is what makes the
attempt safe.

### 2.3 P8 is not a formality

A "shorten to fit the platform limit" step placed after approval means the
approver reviewed text that was never sent. Any transformation must happen
**before** approval.

---

## 3. Separation of concerns

Three responsibilities that are routinely conflated. Each has a distinct owner
and a distinct failure mode.

### 3.1 Authorization

| | |
|---|---|
| **Owner** | Decision layer (pure), re-checked by service at P5 |
| **Input** | Event log, attempt log |
| **Output** | `allowed`, `reasons`, `governance.state` |
| **Can fail by** | Allowing something it should not |
| **Must never** | Touch the network, a database, or a platform |

**Failure boundary:** a contradiction yields `DERIVATION_FAILED` and no state.
The service must abort, never substitute a default.

### 3.2 Operational execution

| | |
|---|---|
| **Owner** | Service |
| **Input** | An `allowed` decision, a pre-approved payload, a platform name |
| **Output** | The platform's outcome |
| **Can fail by** | Sending what was not approved, or sending twice |
| **Must never** | Invent authorisation, or alter approved content |

**Failure boundary:** a network error is an *unknown outcome*, not a failure.
The adapter must report uncertainty as such rather than guessing — guessing
success would record a lie, and guessing failure would risk a duplicate post.

### 3.3 Delivery recording

| | |
|---|---|
| **Owner** | Service |
| **Input** | The adapter's reported outcome |
| **Output** | Attempt row; recomputed `delivery_state` |
| **Can fail by** | Losing the record of what was sent |
| **Must never** | Rewrite a terminal attempt |

Contract §3.3 records that the schema creates **no trigger** on the attempt
table: immutability there is an **application obligation only**. Any code path
that can update a terminal attempt row can rewrite the record of what was
actually sent, and the database will permit it.

**Failure boundary:** a crash between "sent" and "recorded" leaves the system
unable to say what happened. This is precisely the case
`reconciliation_required = true` exists to represent.

### 3.4 Why the split matters

Collapsing 3.2 and 3.3 produces the classic failure: the executor posts, the
record write fails, and the system has an outbound post with no audit trail —
the one outcome the whole governance model exists to prevent.

The service must therefore **persist intent before invoking** the adapter, so a
crash leaves an `IN_FLIGHT` attempt rather than a silent gap.

---

## 4. Failure handling boundaries

### 4.1 Failure classes

| Class | Example | Response | Attempt state |
|---|---|---|---|
| **Precondition failure** | Not approved, withdrawn, contradictory | Abort before any I/O | No row created |
| **Adapter refusal** | Platform rejected the payload | Record the failure | `FAILED` + `error` |
| **Unknown outcome** | Timeout, connection reset | Record uncertainty; do not retry | `IN_FLIGHT` + `reconciliation_required = true` |
| **Persistence failure** | Database write failed | Abort. Never retry the send. | No row, or a rolled-back one |
| **Drift** | Stored cache ≠ recomputation | **Error. Never silently correct.** | Unchanged |
| **Post-approval mismatch** | Fingerprint ≠ rendered text | Abort | `FAILED` |

### 4.2 The two rules that matter most

**Unknown ≠ failed.** Recording a timeout as `FAILED` invites a retry that may
produce a duplicate post. The correct record is `IN_FLIGHT` with
`reconciliation_required = true`, which bars retry until a human resolves it.

**Drift is never auto-corrected.** Contract §3.6 requires an error and a
preserved stored value. Silent correction would hide exactly the tampering or
bug that produced the disagreement.

### 4.3 Retry blocking — ownership

**Retry blocking belongs to the Distribution Service boundary.** It is
deliberately **not** moved into `governance_gate`, which is frozen and must not
gain new reasons or new states.

Two questions, two owners:

| Question | Owner | Answer shape |
|---|---|---|
| "Is this distribution **authorised**?" | Governance — `canDistribute()` | `allowed` + `GateReason[]` |
| "Is **another attempt** currently permitted?" | Service — `isRetryBlocked()` | boolean |

Collapsing them would be a category error. A governance refusal means "this
record may not be distributed"; a retry block means "this record is fine, but
its last delivery outcome is unknown". The same operator seeing both reported
as one denial would look for a missing approval that is not missing.

**Invariant R1.** Before creating a new delivery attempt, the service MUST
evaluate `isRetryBlocked()` on the recomposed decision.

When `delivery_state == IN_FLIGHT` with `reconciliation_required`:

| Requirement | Detail |
|---|---|
| R1a | **No new attempt may be created.** Not one, not after a delay, not with a different platform. |
| R1b | The outcome must remain **distinguishable** from a governance refusal. A separate result kind, not a `GateReason`. |
| R1c | The block **must not** be reported as a missing approval. It must not surface `NOT_APPROVED`, `HUMAN_APPROVAL_REQUIRED`, or any other governance reason. |

R1b and R1c together are why the retry block cannot be modelled as a gate
reason: the gate's reason vocabulary is a closed set of four, all of which
describe a governance condition. Adding a fifth would misreport a delivery
fact as a governance fact, and would modify a frozen module.

What this section does **not** decide: whether reconciliation state is ever
cleared automatically. It is not. Only a human resolving the unknown outcome
does that, and the mechanism for recording that resolution is out of scope
here.

### 4.4 Retry policy

```
decision.allowed === false        → never retry; the answer is structural
isRetryBlocked(decision) === true → never retry; the outcome is unknown
otherwise                        → retry permitted
```

The first is a governance refusal and will not change by asking again. The
second is a delivery uncertainty requiring human resolution. Collapsing them
would either retry a withdrawn record or strand a failed one.

---

## 5. `governance_state` cache authority

`research_distribution.governance_state` and `.delivery_state` are **derived
operational caches**. They exist for display and for query optimisation, so an
operator listing can sort and filter without recomputing from the logs. That is
their entire purpose.

### 5.1 What the cache is

| Property | |
|---|---|
| Derived from | `research_distribution_event` (governance), `research_distribution_attempt` (delivery) |
| Recomputed | Full, never partial, governance before delivery (contract §3.6) |
| Kept current by | The service, as a side effect of normal operation |
| Used for | Display, sorting, filtering, and the database CHECK constraint |

### 5.2 What the cache is not

| Not | Why |
|---|---|
| **An authorisation source** | It is writable by `service_role` (migration line 231: `GRANT SELECT, INSERT, UPDATE, DELETE`). Any code path holding those credentials can set it to any of the four legal values. |
| **A trust boundary** | Trust must rest on the append-only event log, which has three independent database protections. The cache has none. |
| **A replacement for derivation** | Deriving from history is the only way to establish what was authorised. |

### 5.3 The rule

> **No service path may authorise distribution by trusting the cached
> `governance_state` value alone.**

A cached `HUMAN_APPROVED` **MUST NOT** authorise distribution. It is evidence
that someone *believed* the record was approved — not evidence that it is.

The authorisation source is the **immutable governance event history**. A
record is authorised when `deriveGovernanceState()` over that history yields
`HUMAN_APPROVED` and `canDistribute()` returns `allowed`, re-verified at P5
immediately before any external attempt.

### 5.4 What this does and does not settle

This section settles the **service's obligation**: it may not read the cache
as authority. It does **not** settle whether the database should additionally
prevent the cache from being wrong. That is trigger and constraint design, and
it remains open — see §8.

The distinction matters. A service that re-derives is correct even against a
tampered cache; a database that additionally rejects an inconsistent cache is
*defence in depth*. The first is required here; the second is undecided.

---

## 6. Transaction and ordering boundary

### 6.1 Required operation order

The full sequence, with the boundary of each concern marked. Steps 1–4 are pure
computation; step 5 is the first write; step 6 is the first irreversible
external action.

| # | Step | Layer | Inside a transaction? | Reversible? |
|---|---|---|---|---|
| 1 | Load distribution provenance, event history, attempt log | Service | No — reads must see committed state | Yes |
| 2 | `deriveGovernanceState()` | Pure | No | Yes |
| 3 | `canDistribute()` | Pure | No | Yes |
| 4 | `composeDistributionDecision()` | Pure | No | Yes |
| 5 | **P1–P9 preconditions, incl. P5 re-derivation** | Service | No | Yes |
| 6 | **W1 + W2** — create row, record intent | Service | **Yes, together** | Yes |
| 7 | **Adapter invocation** | Service + adapter | **No** | **No** |
| 8 | W3 — close the attempt | Service | Yes, alone | Attempt is terminal |
| 9 | Recompute `delivery_state` | Service | With W3 | — |

Step 7 is the only irreversible action in the sequence. Everything before it
can be abandoned with no external effect; everything after it is bookkeeping of
something that already happened.

The approval-provenance check of §3.5 is pure and sits between steps 1 and 2;
it adds no step and changes no ordering. It is specified in §6.6 and is not
drawn as a separate row here, so that the step numbers below stay stable.

### 6.2 Where TOCTOU risk exists

The risk is the interval between the read in step 1 and the write in step 6.
During that window a concurrent actor may append a governance event.

| Window | What can change it | Caught by |
|---|---|---|
| Step 1 → step 5 | A `withdrawn` event is appended | P5 re-derivation |
| Step 1 → step 5 | The distribution record's `registry_commit` anchor moves | P5 re-read of the distribution record (§6.6) |
| Step 1 → step 6 | A new attempt for the same record | P6 + idempotency key |
| Step 1 → step 6 | Content edits change the fingerprint | P8 byte comparison |
| Step 6 → step 7 | Nothing — the row is already committed | — |

**The gap is real and must be acknowledged, not closed.** Between W1/W2
committing and the adapter returning, no re-check is possible: the send is in
flight. A withdrawal committed during that window cannot stop the post. The
service must not claim otherwise. What it *can* do is record the truth, so the
record shows a distribution that occurred under an approval later withdrawn,
rather than a silent post.

### 6.3 What must be re-checked before adapter invocation

Re-verification happens at step 5, immediately before step 6. Six things:

| # | Re-check | Source |
|---|---|---|
| 1 | The full event history, reloaded | `research_distribution_event` |
| 2 | The distribution record's provenance anchor, reloaded | `research_distribution` |
| 3 | Approval freshness recomputed against that anchor (§3.5) | `checkApprovalFreshness()` |
| 4 | Derivation, gate, and decision recomputed from it | The three pure functions |
| 5 | Agreement with the decision that entered this path | Comparison |
| 6 | `isRetryBlocked()` on the recomposed decision | §4.3 invariant R1 |

Item 6 is re-checked rather than trusted for the same reason as item 1: the
attempt log may have grown since step 1.

### 6.4 Fail-closed behaviour

Any disagreement at step 5 aborts. The service **fails closed**: it aborts the
attempt, leaves every stored value unchanged, and surfaces the condition. It
never prefers one value over the other, never re-resolves, and never silently
corrects.

Fail-closed extends to the ambiguous case. If the service cannot determine
whether it may proceed, it does not proceed. An unavailability that prevents
re-verification is a stop, not a pass.

### 6.5 Isolation level — **OPEN**

Which isolation level makes step 5 see a withdrawal committed after step 1
depends on database transaction semantics. This document does **not** name one:
no isolation level is chosen here, and no schema assumption changes.

| Requirement | Status |
|---|---|
| Steps 1–5 must observe state committed after the request began | Required |
| Steps 1–5 must **not** run inside a long-lived transaction | Required — why they sit outside the spans in §6.1 |
| The specific isolation level achieving the above | **OPEN** |

The second row constrains the design today. Whatever level is chosen, holding
steps 1–5 open inside a transaction spanning step 7 would pin a connection
across an unbounded network wait without making the call atomic.

### 6.6 Approval provenance freshness

DERIVATION-SPEC §3.5 is **closed**, and the rule it states is enforced here.
This section records the implemented boundary; it introduces no new semantics.

`registry_commit` is **decision-time Registry provenance** (§3.6), not Registry
content identity. Within one `distribution_id` the distribution record and
every participating approval event must name the same `registry_commit`. A
mismatch is a **freshness condition, not a content contradiction**: the
historical approval stays valid for its own snapshot, and the current decision
simply requires re-approval against the current snapshot.

The implemented path:

```
loadDistribution() + loadEvents() + loadAttempts()
        ↓
  readHistory()
        ↓
  evaluate()
        ├── checkApprovalFreshness()   ← §3.5, pure, no I/O
        ├── deriveGovernanceState()    ← unchanged; events only
        ├── canDistribute(gov, freshness)
        └── composeDistributionDecision()
```

| Fact | Where |
|---|---|
| `DistributionRepository` gained read-only `loadDistribution(id)`, returning `distribution_id` + `registry_commit` | service port |
| `approval-freshness.ts` is a pure module: no database, no Git, no Registry file, no clock | §6.6 boundary |
| The service compares the distribution anchor against participating approval provenance | `evaluate()` |
| A mismatch yields the gate reason `STALE_APPROVAL_PROVENANCE` and **fails closed** | gate |
| `deriveGovernanceState()` is **unchanged** and still receives events only | frozen contract |
| **No fifth `governance_state`** was added; the four-value enum is untouched | §3.1 |

**Authorisation vs. state.** `governance_state` remains the derived governance
state. Provenance freshness is an **authorisation condition** reported as a gate
reason, never as a new state: a stale record still derives `HUMAN_APPROVED` and
is simply not permitted to distribute on it.

**Fail-closed on the unprovable case.** Freshness is not merely absent-or-present.
A missing distribution row, an unusable anchor, or a participating approval with
no usable commit all fail closed — an unprovable anchor is not a current one.

**P5 interaction.** The distribution record is read on **both** evaluation
passes, so an anchor that moves between them changes the gate reasons, the two
decisions disagree, and §6.4 applies.

---

## 7. Future database insertion point

### 7.1 Where writes begin

The service layer is the sole writer — the only component that should hold
credentials for these tables. Three write points, in order:

| # | Write | Table | When | Notes |
|---|---|---|---|---|
| W1 | Create the distribution row | `research_distribution` | First distribution request | Idempotency key UNIQUE `(version_id, surface, platform, content_fingerprint)` |
| W2 | Record intent | `research_distribution_attempt` | **Before** invoking the adapter | `status = IN_FLIGHT`, `rendered_text` populated |
| W3 | Close the attempt | `research_distribution_attempt` | After the adapter reports | `SUCCEEDED` / `FAILED`, or `reconciliation_required = true` |

Governance events (`research_distribution_event`) are written **only** by the
governance layer, never by the delivery path. An adapter that could write an
approval could grant itself permission.

### 7.2 Why W2 precedes the adapter call

This ordering is the whole defence against the unaudited-post failure. If the
attempt row is written *after* the send, a crash in between leaves an outbound
post the system cannot account for. Writing intent first means the worst case
is an `IN_FLIGHT` attempt with `reconciliation_required = true` — visible,
resolvable, and honest.

It also keeps `delivery_state` correct at every instant, because that column is
recomputed from the attempt log (contract §3.6), and the log is never missing
the attempt that happened.

### 7.3 Transaction boundaries

| Span | Inside one transaction? |
|---|---|
| Preconditions P1–P9 | No — reads must reflect committed state |
| W1 + W2 | **Yes.** Either both land, or neither. |
| Adapter invocation | **No.** Cannot hold a transaction across a network call. |
| W3 | Yes, alone. |

Holding a transaction open across the adapter call would pin connections
through an unbounded network wait and would not make the call atomic — the
post is already public the moment it returns.

### 7.4 Recomputation

Both cached columns are recomputed from their full logs, governance before
delivery (contract §3.6). Recomputation is **full, never partial**. Drift
raises an error and leaves the stored value untouched.

### 7.5 Credentials

| Obligation | Basis |
|---|---|
| `REVOKE UPDATE, DELETE, TRUNCATE` on the **event** table from `service_role` | Contract §3.3 — database-enforced in three independent layers |
| The **attempt** table has no such trigger | Immutability of terminal attempts is an **application** obligation |
| Adapters receive **no** database credentials | An adapter with write access could forge an attempt row |

The asymmetry in the first two rows is deliberate, not an oversight. A
governance event is a permanent audit record; an attempt is operational state
the service legitimately updates while it is open.

---

## 8. Adapter result contract

### 8.1 Outcome categories

An adapter reports exactly one of three categories. There is no fourth, and
"probably worked" is not one of them.

| Category | Meaning | Attempt row | Retry? |
|---|---|---|---|
| `SUCCEEDED` | Platform confirmed creation; `platform_post_id` captured where offered | `status = SUCCEEDED` | n/a |
| `FAILED` | Platform definitively refused; no post exists | `status = FAILED`, `error` populated | **Yes**, permitted |
| `UNKNOWN` | Service cannot tell whether a post exists | `status = IN_FLIGHT`, `reconciliation_required = true` | **No** — blocked |

### 8.2 Classification of concrete situations

The distinction that matters is not *how the call failed* but *whether a post
might exist*.

| Situation | Category | Why |
|---|---|---|
| HTTP 4xx — validation, auth, rate limit | `FAILED` | Processed and refused. No post exists. |
| HTTP 5xx from platform | **Depends** — see §8.3 | Cannot be decided from status alone |
| Timeout before any bytes sent | `UNKNOWN` | Safe only if connection establishment provably failed |
| Timeout after the request was sent | `UNKNOWN` | The platform may have created the post |
| Network interruption mid-response | `UNKNOWN` | A post may exist and be unacknowledged |
| **Platform accepted, response lost** | `UNKNOWN` | Clearest case: the post exists, the system does not know |
| Local render or serialisation error, before any send | `FAILED` | Nothing left the process |
| Adapter crashed mid-call | `UNKNOWN` | Same as an interrupted response |

A definite refusal is retryable; anything ambiguous is not. Guessing `FAILED`
on an ambiguous case invites a duplicate post. Guessing `SUCCEEDED` is worse: it
records a post that may not exist and suppresses the reconciliation a human
needs.

### 8.3 The HTTP 5xx ambiguity — **OPEN**

A 5xx does not by itself establish that no post was created. A platform that
accepts a post and then fails to render the response is indistinguishable from
one that failed before accepting.

Defaulting all 5xx to `FAILED` permits a duplicate post. Defaulting all to
`UNKNOWN` creates reconciliation work for transient upstream errors. Choosing
per platform requires platform-specific knowledge this document does not have.

**A conservative default of `UNKNOWN` for 5xx is the safe position** — it never
permits a duplicate — at the cost of manual reconciliation for genuine upstream
failures. Per-platform refinement is **OPEN**.

### 8.4 Retry eligibility

| Result | New attempt permitted? |
|---|---|
| Governance refusal (`allowed === false`) | **No.** Structural; asking again changes nothing. |
| Retry blocked (`isRetryBlocked()` true) | **No.** The previous outcome is unknown. |
| `FAILED` | **Yes**, subject to P1–P9 re-running. |
| `SUCCEEDED` | No further attempt for this distribution record. |
| `UNKNOWN` | **No.** Requires human resolution first (§10 item 7). |

### 8.5 Adapter obligations

| Must | Must not |
|---|---|
| Report one of the three categories | Guess a category |
| Capture `platform_post_id` when offered | Invent one when absent |
| Report `UNKNOWN` rather than a convenient guess | Convert `UNKNOWN` to `FAILED` for convenience |
| Surface the platform error text on `FAILED` | Swallow it |

This section does **not** define the wire protocol between service and adapter,
or any specific platform's error semantics. Those belong to the adapter
implementations, which do not exist yet.

---

## 9. Bypass prevention

### 9.1 Legacy bypass migration

#### Current state — verified present

Contract §7.2 records that these scripts bypass the governance path. As of this
revision **all nine listed scripts still exist**:

| Script | Listed in §7.2 |
|---|---|
| `scripts/publish-day6.mjs` | yes |
| `scripts/publish-day7.mjs` | yes |
| `scripts/publish-day8.mjs` | yes |
| `scripts/publish-s2-day1.mjs` | yes |
| `scripts/publish-continuity.mjs` | yes |
| `scripts/publish-all.mjs` | yes |
| `scripts/publish-discussions.mjs` | yes |
| `scripts/agent-workflow/publish.js` | yes |
| `scripts/matrix-bot/cruise.js` | yes |

**The contract's list is incomplete.** At least seven further scripts in
`scripts/` call platforms directly and do not appear in §7.2:
`post-bluesky.mjs`, `post-rn001-bluesky.mjs`, `post-rn002-bluesky.mjs`,
`post-farcaster.mjs`, `post-telegram.mjs`, `post-discussion.mjs`,
`post-x-thread.mjs`.

The consequence for planning: **a migration that retires only the nine listed
scripts leaves the boundary porous.** Any inventory used to scope the migration
must be derived from the filesystem, not from the contract.

#### Adapter access ownership

| Rule | Rationale |
|---|---|
| Only the service may construct or invoke an adapter | An adapter invoked elsewhere is an unauthorised distribution |
| Adapters receive no database credentials | An adapter with write access could forge an attempt row |
| Adapters receive no governance credentials | Same reason |
| Platform credentials live behind the adapter, never in a legacy script | A script holding credentials is a script that can post without approval |
| Legacy scripts must not be granted adapter access | Retiring a script and re-exposing it through the adapter is not a migration |

The last rule is the subtle one. Migrating a legacy script onto the adapter is
a change of mechanism, not of governance — the script still bypasses P1–P9
unless it goes through the service. A migration that moves credentials without
moving the decision path has moved nothing.

#### Migration strategy required before production use

**Production distribution must not begin while any direct-publishing path
remains.** A governed path plus an ungoverned one is not a governed system; it
is a governed one that operators may route around, and the bypass leaves no
audit trail.

| # | Step | Gate |
|---|---|---|
| M1 | Build the complete inventory from the filesystem | Every direct platform call identified, not just the nine |
| M2 | Classify each: migrate, or retire | Each entry has a decision and a reason |
| M3 | Migrate chosen ones **through the service**, never onto the adapter directly | Migrated scripts traverse P1–P9 |
| M4 | Retire the rest | No credential remains in use |
| M5 | Verify no path reaches a platform without a service call | Verification precedes production |

M5 is the step that establishes the boundary. M1–M4 are preparation; without
M5 the model holds on paper only, which is precisely the outcome contract §7.2
warns against.

#### Scope

This section **does not modify, disable, or delete any script**. It records what
must happen before production use and leaves the execution to a separate phase.
The scripts are unchanged as of this revision.

---

### 9.2 Adapters cannot bypass the decision layer

An adapter receives a payload that has already passed P1–P9. It cannot obtain a
decision, and cannot act on a refusal, because it is never given one to act on.

| Adapter prohibition | Basis |
|---|---|
| Create an approval | Contract §5.3 — it would grant itself permission |
| Bypass governance | Contract §5.3 — no path may skip the check |
| Alter approved content | Contract §5.3 — invalidates the reviewed fingerprint |

### 9.3 Known bypasses in this repository

Contract §7.2 records existing direct publishing scripts that call platforms
without passing through the governance path. They are outside the controlled
path and leave no auditable record. Migrating them is a separate phase; this
document changes nothing about them.

### 9.4 Enforcement is layered, never single

| Layer | Catches |
|---|---|
| Pure decision (P1–P4) | Anything the logs already show |
| Re-derivation against the event log (P5) | Withdrawal between check and send; a tampered cache |
| Database CHECK | A bad `PUBLISHED` write |
| Append-only triggers | Rewriting governance history |
| Attempt immutability (application) | Rewriting what was sent |

---

## 10. Unresolved decisions

**Resolved in this revision:**

| # | Question | Resolution |
|---|---|---|
| R1 | What does "re-read `governance_state`" mean? | §2.1 — full re-derivation from the event history. The cache is not authority. |
| R2 | Who owns reconciliation retry blocking? | §4.3 — the service boundary, via invariant R1. Not the gate. |
| R3 | Is the cache an authorisation source? | §5 — no. Not a source, not a trust boundary, not a replacement for derivation. |
| R4 | What order do the operations occur in? | §6.1 — nine steps; step 7 is the only irreversible action. |
| R5 | What may an adapter report? | §8.1 — `SUCCEEDED`, `FAILED`, `UNKNOWN`. No fourth category. |
| R6 | Must legacy paths be closed before production? | §9.1 — yes, with a five-step migration sequence. |

**Still open:**

| # | Question | Why it matters | Status |
|---|---|---|---|
| 1 | Which isolation level makes P5 see a late withdrawal? | §6.5. The requirement is stated; the level is not named here. | **open** |
| 2 | ~~Does a `registry_commit` split block distribution?~~ | **CLOSED** — DERIVATION-SPEC §3.5. Within one `distribution_id` the distribution record and the participating approval events must refer to the same `registry_commit`. A provenance mismatch does **not** authorise the current distribution; re-approval against the current Registry snapshot is required. The historical approval is **not** erased — it remains valid for its own snapshot. Enforced fail-closed as `STALE_APPROVAL_PROVENANCE`. Affects P4. See §6.6. | **closed** — implemented |
| 3 | Should the database reject an inconsistent cache? | §5 settles the service's obligation but not the database's. Trigger design is defence in depth and is deliberately **not** decided here. | **open** — deliberately untouched |
| 4 | How does an adapter report `UNKNOWN` on the wire? | §8.1 defines the three categories; the protocol is unspecified. | **open** |
| 5 | How should HTTP 5xx be classified? | §8.3 — `UNKNOWN` is the safe default; per-platform refinement is undecided. | **open** |
| 6 | Single-writer enforcement | Spec §1.2 assumes one governance writer; nothing enforces it. Concurrent writes may reorder ids. | **open** |
| 7 | Where reconciliation state is cleared | Only a human resolving the unknown outcome may clear it; the recording mechanism is unspecified. | **open** |
| 8 | What is the complete legacy script inventory? | §9.1 — at least seven scripts are missing from the contract's list. M1 must derive it from the filesystem. | **open** |

Item 1 is a consequence of R4: fixing the sequence exposed that the isolation
level determines whether P5 achieves its purpose. Stating the requirement
without naming a level keeps the decision where it belongs — with whoever
implements against a real database.

Item 5 is the one where the safe default costs real friction: classifying every
5xx as `UNKNOWN` never permits a duplicate post, but creates manual
reconciliation for genuine upstream failures. That trade-off is a platform
decision, not a boundary decision.

Item 2 is now **closed and implemented** (see §6.6). What remains for it is
implementation follow-up — the W1 writer and the durable record of a
re-approval — not an unresolved governance decision. Item 3 remains open by
instruction: it would add a database constraint that the service is already
correct without.

---

## 11. No-code confirmation

This document is design only. No service, adapter, or production code was
created. No database was accessed. No schema or migration was modified.

Unchanged at time of writing:

| Artifact | SHA-256 |
|---|---|
| `20261002_research_distribution_governance.sql` | `05FD21EF…F5E9F08` |
| `RESEARCH-DISTRIBUTION-DERIVATION-SPEC.md` | `0C1CF22A…D8D9335` |
| `RESEARCH-DISTRIBUTION-APPLICATION-CONTRACT.md` | `4B669921…50F136DD3` |
| `derivation.ts` | `A506D6E4…6162ED` |
| `governance-gate.ts` | `BEA15B48…89EDD3` |
| `distribution-decision.ts` | `78228DF2…2290E6` |