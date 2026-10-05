# Research Distribution System — Application Contract

- **Status:** Application contract. Reconciled against the current repository.
- **Original design checkpoint:** `435aff98` (2026-10-02) — at that commit this document was design-only.
- **Current implementation reconciliation:** an implementation now exists in the repository (see §0.1). This document has been reconciled against that implementation.
- **Schema:** `supabase/migrations/20261002_research_distribution_governance.sql` — committed and tracked. **Application status requires separate verification; this document does not assert it is applied.**
- **Governs:** ADR-P2G-001 (Option B)
- **Scope:** Application layer only

---

## 0.1 What exists in the repository now

At the original design checkpoint `435aff98` (2026-10-02) the governance
layers did not exist. They do now.

`src/lib/research-distribution/` contains **26 tracked files — 16
implementation modules and 10 test files**:

| Layer | Module | Test |
|---|---|---|
| Governance derivation | `derivation.ts` | `derivation.test.ts` |
| Governance gate | `governance-gate.ts` | `governance-gate.test.ts` |
| Decision composition | `distribution-decision.ts` | `distribution-decision.test.ts` |
| Canonical content | `canonical-content.ts` | `canonical-content.test.ts` |
| Registry provenance | `registry-provenance.ts` | `registry-provenance.test.ts` |
| Approval freshness | `approval-freshness.ts` | `approval-freshness.test.ts` |
| Distribution service | `distribution-service.ts` | `distribution-service.test.ts` |
| Distribution writer | `distribution-writer.ts` | `distribution-writer.test.ts` |
| Supabase repositories | `distribution-repository-supabase.ts`, `distribution-store-supabase.ts`, `attempt-store-supabase.ts`, `approval-store.ts` | `distribution-repository-supabase.test.ts` |
| MVDS delivery (layer, no single `mvds.ts` module) | `delivery-adapter.ts`, `delivery-resend.ts`, `attempt-store-supabase.ts`, `delivery-state-store.ts`, `approval-store.ts`, `distribute.ts`, `distribution-writer.ts` | `mvds.test.ts` |
| Delivery state | `delivery-state-store.ts`, `delivery-adapter.ts`, `delivery-resend.ts`, `distribute.ts` | — |

The fingerprint rule defined in §4.3 is implemented in
`src/lib/content-fingerprint.ts` and is consistent with this contract.

**What the presence of implementation does NOT establish.** This document is
an application-level contract. Implementation presence in the repository is
not a claim about any of the following, and none of them is asserted here:

- **not** production deployment;
- **not** production readiness or production approval;
- **not** external validation of the governance model;
- **not** that the migration has been applied to any database;
- **not** that any content has been distributed under this contract.

The migration `20261002_research_distribution_governance.sql` is committed and
tracked. Whether it has been applied is a separate question requiring separate
verification, and §8 continues to treat application as an out-of-scope,
separately gated action.

`src/app/api/matrix/publish/route.ts` returns `DIRECT_PUBLISH_DISABLED`
(`2G-Z0-R1`). The platform endpoint does not publish.

---

## 0. Discrepancy notice — read before using this contract

This contract was requested with a single lifecycle chain:

```
DRAFT → REVIEWED → HUMAN_APPROVED → READY_TO_DISTRIBUTE → IN_FLIGHT → PUBLISHED
```

The committed Phase 2G schema does **not** implement that shape. It implements
**two deliberately separate state machines**, and the separation is the central
design decision of ADR-P2G-001:

| Dimension | Values in committed schema |
|---|---|
| `governance_state` | `DRAFT` · `AI_REVIEWED` · `HUMAN_APPROVED` · `WITHDRAWN` |
| `delivery_state` | `NOT_ATTEMPTED` · `IN_FLIGHT` · `PUBLISHED` · `FAILED` |

Mapping the requested chain onto the schema:

| Requested state | Schema representation | Note |
|---|---|---|
| `DRAFT` | `governance_state = DRAFT` | direct |
| `REVIEWED` | `governance_state = AI_REVIEWED` | renamed |
| `HUMAN_APPROVED` | `governance_state = HUMAN_APPROVED` | direct |
| **`READY_TO_DISTRIBUTE`** | **no representation** | does not exist in either enum |
| `IN_FLIGHT` | `delivery_state = IN_FLIGHT` | exists, but on the *other* machine |
| `PUBLISHED` | `delivery_state = PUBLISHED` | exists, but on the *other* machine |
| `FAILED` | `delivery_state = FAILED` | direct |

**Two consequences:**

1. **`READY_TO_DISTRIBUTE` has no schema home.** Writing this contract around it
   would define a state the database cannot represent. It is treated below as a
   **derived condition**, not a stored state: a record is distribution-ready when
   `governance_state = HUMAN_APPROVED` **and** `delivery_state = NOT_ATTEMPTED`.
   Nothing needs to be written to the database to record it.

2. **A single linear chain would collapse the governance/delivery distinction.**
   The separation exists so that "approved" can never be mistaken for "sent",
   and so that withdrawal is representable after approval. Merging them would
   remove that property and would also contradict the CHECK constraint
   `research_distribution_publish_requires_human_approval` already committed in
   `20261002`.

This contract follows the committed schema. If a single linear chain is required,
the schema must change first — that is a separate decision, not a documentation
choice.

---

## 1. Purpose and Boundary

### 1.1 The Research Distribution System is

- **a governance-controlled distribution layer** — it records *who authorised
  what, when, against which content, under which Registry snapshot*, and it
  records what was actually delivered to which platform;
- **an auditable execution log** — every distribution produces immutable
  governance evidence and a permanent record of delivery attempts.

### 1.2 The Research Distribution System is **not**

| Not | Because |
|---|---|
| **A content creation system** | It never authors, edits, or renders research content. Content originates in the Repository/Registry. The system records a `content_fingerprint` of content it did not create. |
| **A social media automation system** | Platform reach, scheduling, engagement, audience growth and cross-posting optimisation are out of scope. There is one intent — deliver this exact approved content to this named platform. |
| **A publication authority** | It does not decide whether research is sound, publishable, or peer-reviewable. Publication authority rests with the human governance process. This system only records that a human exercised it. |

### 1.3 The Registry remains the SSOT

The Git/YAML Registry is authoritative for asset, version, and surface identity.
This database is a **disposable operational read model** rebuilt from it. On
conflict, the Registry wins. `registry_commit` anchors each record to the
Registry snapshot in effect at the time.

---

## 3. State Machine

### 3.1 The two machines are independent

They are advanced by different actors, at different times, for different
reasons, and are recomputed from different logs:

| | `governance_state` | `delivery_state` |
|---|---|---|
| Source of truth | `research_distribution_event` (append-only) | `research_distribution_attempt` |
| Column on the record | derived **cache** | derived **cache** |
| Advanced by | Reviewers and Human Approvers | the delivery executor |
| Answers | *Is this authorised?* | *Did this get sent?* |

Neither is written directly by application code as an independent decision. Both
are recomputed from their logs.

### 3.2 Governance transitions

| From | To | Who | Evidence required |
|---|---|---|---|
| — | `DRAFT` | system, on record creation | none; record created by an authorised caller |
| `DRAFT` | `AI_REVIEWED` | Reviewer | event: `decision=approved`, `approver_type=AI_REVIEW` |
| `DRAFT` | `HUMAN_APPROVED` | Human Approver | event: `decision=approved`, `approver_type=HUMAN`, `approver_id`, `approval_ref` |
| `AI_REVIEWED` | `HUMAN_APPROVED` | Human Approver | event: `decision=approved`, `approver_type=HUMAN`, `approver_id`, `approval_ref` |
| any | `WITHDRAWN` | Human Approver | event: `decision=withdrawn`, `approver_type=HUMAN`, `approver_id`, `approval_ref` |
| `HUMAN_APPROVED` → `AI_REVIEWED` | **forbidden** | — | — |
| `AI_REVIEWED` → `DRAFT` | **forbidden** | — | — |
| `WITHDRAWN` → any | **forbidden — terminal** | — | — |

`DRAFT` → `HUMAN_APPROVED` directly is permitted: a human may authorise without
machine pre-review. AI review is optional, never mandatory, and never
sufficient.

**The `decision` values referenced in this table are event-level values with
their own semantics — see §3.7.**

### 3.3 Delivery transitions

| From | To | Who | Evidence required |
|---|---|---|---|
| — | `NOT_ATTEMPTED` | system, on record creation | none |
| `NOT_ATTEMPTED` / `FAILED` | `IN_FLIGHT` | delivery executor | attempt row with `status=IN_FLIGHT`, `rendered_text` populated |
| `IN_FLIGHT` | `PUBLISHED` | delivery executor | attempt row with `status=SUCCEEDED`; **requires §3.4** |
| `IN_FLIGHT` | `FAILED` | delivery executor | attempt row with `status=FAILED` and `error` populated |
| `IN_FLIGHT` | `IN_FLIGHT` | delivery executor | attempt persists with `reconciliation_required=true` |
| `PUBLISHED` → `IN_FLIGHT` | **forbidden** | — | — |

Attempt-local states: `IN_FLIGHT` → `SUCCEEDED` / `FAILED` / `SKIPPED`.

**Enforcement layers differ between the two log tables, and this must not be
conflated:**

| Table | Immutability | Enforced by |
|---|---|---|
| `research_distribution_event` | append-only | **Database** — `REVOKE UPDATE, DELETE, TRUNCATE` from `service_role`, plus `BEFORE UPDATE` and `BEFORE DELETE` triggers. Three independent layers. |
| `research_distribution_attempt` | terminal attempts treated as immutable | **Application only.** The schema creates **no trigger** on this table. |

Consequently: a terminal attempt's `rendered_text` **SHOULD** be treated as
immutable by application logic, so that the record of what was actually sent
cannot be rewritten after the fact. This is an **application-layer obligation,
not a database guarantee**. Any code path able to update an attempt row can
rewrite it, and the database will permit that.

`SKIPPED` is terminal and is **not** a failure. It records a deliberate
non-delivery.

---

### 3.4 Cross-machine invariant — the authorisation gate

> `delivery_state = PUBLISHED` is permitted **only** when
> `governance_state = HUMAN_APPROVED`.

**Enforced at two layers:**

| Layer | Mechanism |
|---|---|
| Database | CHECK constraint `research_distribution_publish_requires_human_approval` on `research_distribution` |
| Application | the delivery executor must verify this **before** calling any platform, and must **re-read** `governance_state` rather than trust a value read earlier in the flow |

The re-read closes the check-then-act window: an approval withdrawn between the
check and the send must abort the send.

The database constraint alone is **not sufficient**, because it constrains the
stored row, not the moment of the outbound call. A record could sit valid in the
database while the executor sends anyway. Application enforcement is mandatory.

### 3.5 READY_TO_DISTRIBUTE

Not a stored state. It is the **derived condition**:

```
governance_state = HUMAN_APPROVED  AND  delivery_state = NOT_ATTEMPTED
AND  no unresolved attempt (reconciliation_required = true) exists
```

No database write records it. It is evaluated at the moment distribution is
requested.

### 3.6 Recomputation

- `governance_state` is recomputed from the full event log.
- `delivery_state` is recomputed from the full attempt log.
- Recomputation is **full**, never partial, and governance is recomputed before
  delivery.
- If the stored cache disagrees with a recomputation, the system raises an error
  and **never silently corrects**. A silent correction would hide exactly the
  kind of drift that indicates tampering or a bug.

### 3.7 Decision values versus governance state

`research_distribution_event.decision` is an **event-level audit value**. It is
**not** equivalent to `governance_state`, and the schema defines no mapping
between them. `decision` exists only on the event table;
`research_distribution` and `research_distribution_attempt` have no `decision`
column.

| `decision` | Meaning | Effect on `governance_state` |
|---|---|---|
| `approved` | Records a successful approval event. | Only when the event also carries the approver identity required by §3.2 does this participate in a transition. |
| `rejected` | Records a negative review or decision event. | **Does not automatically define a `governance_state` transition.** The record retains its current governance state. |
| `exception_granted` | Records an explicitly justified exception. The schema CHECK `research_distribution_event_exception_reason` requires a non-empty `reason`. | **Does not create a new `governance_state`.** The record retains its current governance state. |
| `withdrawn` | Records withdrawal intent and history. | Participates in the transition to `WITHDRAWN` per §3.2. |

**Any `governance_state` transition MUST be recorded explicitly according to the
governance state machine in §3.2.** Writing an event does not, by itself, move
the record. A `rejected` event does not un-approve an approved record; an
`exception_granted` event does not approve anything. The governance state is
derived (§3.6) from the events that carry a valid approver identity for the
transition being claimed.

This separation is deliberate: it keeps the audit record complete — a rejection
and an exception are both facts worth preserving — without letting either be
mistaken for a state change.

---

## 4. Approval Rules

### 4.1 AI_REVIEWED

`AI_REVIEWED` **may provide analysis assistance**. It **never grants publishing
authorisation.**

Concretely, under `AI_REVIEWED`:

- a delivery attempt may **not** begin;
- `delivery_state` may **not** reach `PUBLISHED`;
- the database will **refuse** the transition via
  `research_distribution_publish_requires_human_approval`.

AI review exists to reduce the human reviewer's reading burden. It is an input to
the human decision, never a substitute for it. An automated reviewer that can
move a record to a distributable state has become a publication authority, which
is outside this system by definition (§1.2).

### 4.2 HUMAN_APPROVED

`HUMAN_APPROVED` is **required before any external distribution attempt**.

An approval must be evidenced by a complete governance event:

| Field | Requirement |
|---|---|
| `approver_type` | `HUMAN` |
| `approver_id` | named identity, non-empty |
| `approval_source` | channel through which approval was given |
| `approval_ref` | durable external evidence pointer, non-empty |
| `approved_at` | time stated by the actor |
| `content_fingerprint` | must equal the fingerprint of the content being distributed, computed per §4.3 |
| `registry_commit` | must identify the Registry snapshot that was reviewed |

**The fingerprint and commit are not administrative detail.** They are what makes
the approval specific: an approval without them authorises "something, at some
point", which is not auditable. With them, the approval provably refers to
exactly this content under exactly this snapshot.

An approval whose fingerprint does not match the content about to be sent **must
be rejected**, and the mismatch must be surfaced — it indicates either a
fingerprint computation bug or a content change after approval.

### 4.3 `content_fingerprint` — canonical definition

`content_fingerprint` **MUST** be calculated as:

```
SHA-256(
  UTF-8(
    RFC 8785 JCS canonicalization(
      {
        content,
        title
      }
    )
  )
)
```

Resulting in 64 lowercase hexadecimal characters, matching the schema CHECK
`research_distribution_fingerprint_hex`.

**The fingerprint input MUST exclude:**

| Excluded | Reason |
|---|---|
| `platform` | the same content distributed to two platforms must fingerprint identically |
| `surface` | identity of the destination surface, not of the content |
| `brand` | presentation context, not content |
| Registry metadata | `asset_id`, `version_id` and similar identify the asset, not the content bytes |
| timestamps | any time-varying input would make the fingerprint non-deterministic |
| delivery metadata | `rendered_text`, `platform_post_id`, `error`, attempt and event state |

**Consequence — this is the purpose of the rule.** The same approved content
version **must** produce the same fingerprint across different platforms and
across different surfaces. If platform were part of the input, approving content
for Bluesky would not constitute approval of the same content for any other
destination, and cross-platform reconciliation of "did we send exactly what was
approved" would be impossible.

**This fingerprint is the boundary for both idempotency and reconciliation.**
It is the fourth component of the idempotency key
`UNIQUE (version_id, surface, platform, content_fingerprint)`, and it is the
value copied onto every governance event so an approval is pinned to exact
content.

The rule is shared with the repository's frozen digest rule for CPS-0001 and
CPS-0002, so the same content yields a comparable digest across subsystems. The
application layer computes it; the database never does.

### 4.4 Withdrawal

Withdrawal is terminal and irreversible. After `WITHDRAWN`, the record can never
be distributed again; a new distribution requires a new record with a new
fingerprint. Withdrawal does not delete history — it appends a decision.

---

## 5. Application Boundary

### 5.1 Governance layer

**Decides whether distribution is allowed.** It owns:

- `research_distribution_event` writes — the only place governance state changes;
- the authorisation check in §3.4;
- recomputation of both caches;
- the reconciliation guard (§7).

It does **not** call platforms. It never performs I/O to any external service.

### 5.2 Platform adapter

**Only delivers approved content.** Its contract:

- receives a payload that has already passed the governance gate;
- sends exactly that payload to exactly one named platform;
- returns the platform's outcome, including `platform_post_id` when the platform
  provides one;
- reports an uncertain outcome as such, rather than guessing success or failure.

### 5.3 The adapter must NOT

| Prohibited | Why |
|---|---|
| **Create an approval** | An adapter has no authority. Writing a governance event from adapter code would let a delivery mechanism grant itself permission. |
| **Bypass governance** | An adapter must refuse to send when the authorisation check has not passed, and must not expose a path that skips the check. |
| **Alter approved rendered content** | The `rendered_text` written to the attempt row is the exact text sent. Any transformation after approval — truncation, templating, escaping — invalidates the fingerprint the approver reviewed. If the platform requires transformation, it must happen **before** approval, and the post-approval payload must be byte-identical. |

The third prohibition is the subtle one. A convenient "shorten to fit the
platform limit" step placed after approval would mean the approver reviewed text
that was never sent.

---

## 6. `matrix/publish` Migration Direction

### 6.1 Current finding

`src/app/api/matrix/publish/route.ts` is the only existing outbound publication
path. Observed behaviour:

| Property | Current state |
|---|---|
| Endpoint | `POST /api/matrix/publish` |
| Authorisation | `x-api-key` header must equal `MATRIX_API_KEY` |
| Rate limit | 5 requests per 15 minutes per IP |
| Payload | `{ platform, content, title, url, imagePath }` |
| Platforms | bluesky, x/twitter, linkedin, farcaster, discord, telegram, reddit |
| Persistence | **none** — no database write |
| Returned | `platform`, `title`, `content_length`, `timestamp`, `status` |

**It is an API-key-controlled direct delivery path.** Possession of the API key
is the entire authorisation model. There is no governance state, no content
fingerprint, no attempt record, and no approval of any kind.

### 6.2 Contract gap

Against §3, §4 and §5, the current route fails on every governance dimension:

| Contract requirement | Current |
|---|---|
| Requires `HUMAN_APPROVED` before sending | absent — API key suffices |
| Records an attempt before sending | absent |
| Records `rendered_text` | absent — only `content_length` |
| Records `platform_post_id` | absent |
| Reports uncertain outcomes as uncertain | absent |
| Refuses to send when approval is missing | absent |

### 6.3 Intended direction

**`matrix/publish` is to become the platform delivery adapter** described in
§5.2 — the mechanism that performs delivery once the governance layer has
authorised it.

Not a new endpoint alongside the old one. The existing route is where delivery
belongs, and splitting it would create two paths, one of which is ungoverned.

The migration direction, stated as intent and **not** as implementation:

1. The route stops being an authorisation surface. API-key possession becomes
   insufficient on its own.
2. A governance check runs before any outbound call, with the state re-read at
   that moment (§3.4).
3. An attempt row is written **before** the platform call, with `rendered_text`
   populated (§2.3). If the process dies mid-send, the intended text survives.
4. The result closes the attempt: `SUCCEEDED` with `platform_post_id`, or
   `FAILED` with `error`, or `IN_FLIGHT` with `reconciliation_required = true`
   when the outcome is genuinely unknown.
5. `PUBLISHED` follows only after a `SUCCEEDED` attempt and a passing
   authorisation check.

### 6.4 What is deliberately not decided here

- The shape of the new payload, and whether `url` / `title` / `imagePath` are
  retained, folded into the fingerprint input, or dropped.
- Whether the route remains authenticated by API key in addition to the
  governance gate.
- Whether existing callers (`scripts/agent-workflow/publish.js` and the
  `scripts/publish-*.mjs` family) are migrated, adapted, or retired. See §7.2.

---

## 7. Bypass Prevention

### 7.1 The controlled path

Every external distribution attempt must produce, in order:

```
1. governance check passes   (HUMAN_APPROVED, re-read at this moment)
2. attempt row written       (status=IN_FLIGHT, rendered_text populated)
3. platform call performed
4. attempt closed            (SUCCEEDED / FAILED, or IN_FLIGHT + reconciliation)
5. delivery_state recomputed
```

A distribution that does not leave this trail is **not a distribution**. It is an
undocumented action with unknown content and unknown authority.

### 7.2 Direct platform calls are outside the controlled path

Code that calls a platform without traversing the sequence above produces a post
that exists in the world but not in the record. It cannot be audited, cannot be
attributed to an approver, and cannot be reconciled if the outcome is unknown.

**Known instances in this repository.** The following bypass the route entirely
and call platforms directly:

```
scripts/publish-day6.mjs
scripts/publish-day7.mjs
scripts/publish-day8.mjs
scripts/publish-s2-day1.mjs
scripts/publish-continuity.mjs
scripts/publish-all.mjs
scripts/publish-discussions.mjs
scripts/agent-workflow/publish.js
scripts/matrix-bot/cruise.js
```

This is a real and currently unaddressed governance gap. Hardening
`matrix/publish` alone would **not** close it — these scripts would continue to
publish unreviewed content.

Migrating or retiring them is explicitly out of scope for this contract (§8), but
the gap is recorded here because it determines whether the governance model holds
in practice or only on paper. It requires a separate decision.

### 7.3 Reconciliation guard

While an attempt has `reconciliation_required = true`:

- `delivery_state` remains `IN_FLIGHT`;
- **no new attempt may be opened for the same distribution record**;
- the record must be visible in an operator listing.

This is an application-layer invariant, not database-constrained. Its purpose is
to prevent duplicate publication after a timeout: the platform may have accepted
a post the application never saw the response to. Retrying blindly produces a
second post.

Resolution requires an explicit, recorded human determination, not an automatic
retry.

---

## 8. Out of Scope

The following are explicitly **not** covered by this contract:

| Excluded | Note |
|---|---|
| **Database migration application** | `20261002_research_distribution_governance.sql` is committed but **not applied**. Applying it is a separate, gated action. |
| **Platform integration** | Adapter implementation for any specific platform is out of scope. This contract defines the adapter contract, not any adapter. |
| **Authentication redesign** | The existing authentication model is unchanged. Whether API-key auth is retained alongside the governance gate is undecided (§6.4). |
| **Automation scripts cleanup** | The bypass instances in §7.2 are recorded, not resolved. |
| **Production publishing** | No content will be distributed under this contract. Any first real delivery requires the migration applied and verified first. |

Also excluded, consistent with ADR-P2G-001:

- any change to the existing publication catalogue
  (`research_publication`, `research_publication_attempt`,
  `research_publication_approval_event`);
- Registry mirror tables;
- scheduling, queueing, retry orchestration, analytics, notifications;
- any administrative dashboard or operator UI.

---

## 9. Contract summary

| Question | Answer |
|---|---|
| May AI review authorise publishing? | **No.** Never. Blocked in the database and in the application. |
| What authorises a distribution? | A governance event with `approver_type = HUMAN`, a named `approver_id`, and a durable `approval_ref`. |
| What makes an approval specific? | `content_fingerprint` plus `registry_commit` recorded on the event. |
| May an adapter approve its own delivery? | **No.** Prohibited in §5.3. |
| May an adapter modify approved text? | **No.** Prohibited in §5.3. Any transformation happens before approval. |
| What happens on an uncertain outcome? | The attempt stays `IN_FLIGHT` with `reconciliation_required = true`, and no retry is permitted until resolved. |
| Is a direct platform call a distribution? | **No.** It is outside the controlled path (§7.2) and leaves no auditable record. |

---

*Reconciliation note. Written at design checkpoint `435aff98` (2026-10-02), when no application code existed.
Implementation has since been added to the repository; §0.1 records what exists and, explicitly, what its presence does not establish. No implementation file, migration, or database state was modified in producing this reconciliation.*