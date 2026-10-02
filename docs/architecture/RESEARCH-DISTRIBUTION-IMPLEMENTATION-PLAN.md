# Research Distribution — Implementation Plan

- **Status:** Plan only. No implementation performed.
- **Implements:** `RESEARCH-DISTRIBUTION-APPLICATION-CONTRACT.md`
- **Schema:** `supabase/migrations/20261002_research_distribution_governance.sql` (committed, **not applied**)
- **Checkpoint:** `435aff98`
- **Scope:** RN-001 first implementation, single platform

---

## 0. Prerequisites

### 0.1 Blocking

| Prerequisite | State | Note |
|---|---|---|
| Migration applied and verified | ❌ **not applied** | The schema this plan targets does not exist in any database. No application work can be verified until it is applied and verified. |
| Registry SSOT available | ❌ **not on this branch** | `docs/research-assets.registry.yaml` and `scripts/validate-research-assets.mjs` exist on `master` and `research/asset-registry`, **not** on `security/p0-isolation-2026-09-27`. Asset identity cannot be resolved until present. |

### 0.2 Available now

| Dependency | Location | Provides |
|---|---|---|
| `sha256Hex()` | `src/lib/hash.ts` | SHA-256 hex digest |
| `canonicalSerialize()` | `src/lib/evidence/cps0001.ts` | RFC 8785 JCS canonicalization |
| Supabase service access pattern | `src/lib/research-data-loader.ts` | lazy `createClient` with service role |

The fingerprint rule of contract §4.3 is implementable with existing helpers — no
new dependency and no new serialisation library is required.

---

## 1. First implementation scenario — RN-001

### 1.1 Subject

| Field | Value | Source |
|---|---|---|
| `asset_id` | `RN-001` | Registry |
| `version_id` | `rn-001-r01` | Registry |
| `surface` | the surface chosen for this distribution | Registry |
| `brand` | the brand that owns that surface | Registry |
| `platform` | `bluesky` | fixed for this scenario |
| `registry_commit` | decision-time HEAD commit SHA | Git (see DERIVATION-SPEC §3.6) |

Registry values for `asset_id`, `version_id`, `surface` and `brand` are **read
from the Registry SSOT**, never hardcoded. The Registry is authoritative; on
conflict it wins.

### 1.2 Sequence

```
Step 1  Resolve identity
        Read asset_id, version_id, surface, brand from the Registry.
        registry_commit is NOT a Registry field. It is derived from
        the decision-time HEAD per DERIVATION-SPEC §3.6.
        Validate that the requested version and surface actually exist there.
        A value not present in the Registry is a hard failure, not a default.

Step 2  Compute fingerprint
        content_fingerprint = SHA-256( UTF-8( JCS({ content, title }) ) )
        Excluding platform, surface, brand, Registry metadata, timestamps,
        delivery metadata — per contract §4.3.

Step 3  Governance check  ← the gate
        Re-read governance_state for the target distribution.
        Refuse unless it equals HUMAN_APPROVED.
        An AI_REVIEWED record must be refused here, not later.

Step 4  Distribution Record
        Resolve by the idempotency key
          UNIQUE (version_id, surface, platform, content_fingerprint)
        If absent, insert with governance_state and delivery_state at defaults.
        If present, reuse it. Do not duplicate.

Step 5  Attempt creation
        Insert an attempt row BEFORE any outbound call:
          status                  = IN_FLIGHT
          rendered_text           = the exact text to be sent
          reconciliation_required = false
          completed_at            = null
        The row must be written first so a crash mid-send still leaves a record
        of what was intended to go out.

Step 6  Adapter invocation
        Hand the already-approved payload to the single platform adapter.
        The adapter performs no authorisation and no transformation.

Step 7  Result recording
        SUCCEEDED  -> status = SUCCEEDED, completed_at set,
                      platform_post_id recorded
        FAILED     -> status = FAILED, completed_at set, error recorded
        UNKNOWN    -> attempt stays IN_FLIGHT,
                      reconciliation_required = true,
                      completed_at stays null

Step 8  Recompute delivery_state
        Derive from the attempt log. Do not assign it directly.
```

### 1.3 Ordering rules that must not be violated

| Rule | Reason |
|---|---|
| Governance check precedes **any** outbound call | An approval may be withdrawn between the check and the send |
| `governance_state` is re-read at Step 3, not cached from an earlier step | Closes the check-then-act window |
| Attempt row written **before** the adapter call | A crash between record and send must not lose the record |
| Fingerprint computed **before** the governance check, and matched against the approval | The approval is specific to a fingerprint; an unmatched approval is not an approval |
| Adapter receives the approved payload unchanged | Any post-approval transformation invalidates what was approved |

---

## 2. Application components required

Four boundaries. No more.

### 2.1 Governance check layer

**Responsibility.** Answer one question: *may this exact content be delivered to
this exact platform right now?*

**Must do**
- read the target distribution record's `governance_state`
- return a decision, and a reason when refusing
- re-read at the moment of the check, not from an earlier snapshot

**Must not**
- call any external service
- decide the delivery outcome
- mutate attempt rows

**Refusal conditions**

| Condition | Reason to surface |
|---|---|
| no distribution record exists | nothing has been authorised |
| `governance_state = DRAFT` | never reviewed |
| `governance_state = AI_REVIEWED` | analysis is not authorisation |
| `governance_state = WITHDRAWN` | terminal; cannot be reinstated |
| approval fingerprint ≠ current content fingerprint | content changed after approval |
| unresolved attempt exists for this record | see §2.4 |

### 2.2 Distribution service boundary

**Responsibility.** Resolve or create the Distribution Record, and drive the
sequence in §1.2.

**Must do**
- read identity from the Registry SSOT
- compute the fingerprint per contract §4.3
- invoke the governance check
- resolve the record by the idempotency key, creating only if absent
- recompute both caches from their logs

**Must not**
- call a platform directly
- write an attempt row without going through §2.4
- assign `governance_state` or `delivery_state` as an independent decision —
  both are derived (§3.1 of the contract)

### 2.3 Adapter interface boundary

**Responsibility.** Deliver an already-approved payload to one named platform and
return the outcome.

**Input contract**

| Field | Notes |
|---|---|
| platform | exactly one, resolved before invocation |
| rendered text | byte-identical to what was approved |
| correlation | the attempt identifier, so the result can be attached |

**Output contract**

| Outcome | Meaning |
|---|---|
| success with post id | the platform confirmed and returned an identifier |
| success without post id | confirmed, but the platform exposes no identifier (webhook-based). **Not** a failure |
| failure with reason | the platform rejected or the call failed |
| **unknown** | the outcome cannot be determined — timeout, ambiguous response |

Reporting "unknown" as failure would cause a retry against a post that may already
exist. The adapter must distinguish these four outcomes.

**Must not**
- create or imply an approval
- modify the rendered text
- retry internally — retries are the service's decision, not the adapter's
- call any other platform

### 2.4 Attempt lifecycle handling

**Responsibility.** Own the attempt row from creation to terminal state, and the
reconciliation guard.

**State discipline**

| Rule | Enforcement |
|---|---|
| Attempt is created `IN_FLIGHT` with `completed_at` null | application |
| `IN_FLIGHT` holds exactly when `completed_at` is null | **database** — `..._completion_consistency` CHECK |
| Terminal attempts are treated as immutable | **application only** — schema has no trigger on this table |
| Every terminal attempt has `completed_at` set | **database** CHECK |

**Reconciliation guard**

While any attempt for a distribution record carries
`reconciliation_required = true`:

- no new attempt may be opened for that record
- `delivery_state` remains `IN_FLIGHT`
- the record is listed for operator attention
- resolution is an explicit, recorded human determination — never an automatic
  retry

The guard is **application-layer**. It is not database-constrained, and no
constraint could express it, because it spans the attempt log rather than a
single row.

---

## 3. `matrix/publish` migration direction

### 3.1 Current state

`src/app/api/matrix/publish/route.ts`:

| Property | Current |
|---|---|
| Authorisation | `x-api-key` header equals `MATRIX_API_KEY` |
| Rate limit | 5 per 15 minutes per IP |
| Payload | `{ platform, content, title, url, imagePath }` |
| Persistence | **none** |
| Returns | `platform`, `title`, `content_length`, `timestamp`, `status` |
| Platforms | bluesky, x/twitter, linkedin, farcaster, discord, telegram, reddit |

It is a stateless API-key-controlled forwarder. It fails every governance
requirement in the contract: no approval, no attempt record, no fingerprint, no
`rendered_text`, no `platform_post_id`, no uncertain-outcome reporting.

### 3.2 Migration direction — not implemented here

The route becomes the **platform delivery adapter** of §2.3. Not a new endpoint
alongside the old one — a second path would leave an ungoverned route in place.

Direction of change:

1. API-key possession stops being sufficient on its own.
2. The governance check (§2.1) runs before any outbound call.
3. An attempt row is written before the platform call.
4. The result closes the attempt with the four outcomes of §2.3.
5. `delivery_state` is recomputed, never assigned.

### 3.3 Known gap — not resolved by this plan

Nine scripts call platforms directly, bypassing the route entirely:

```
scripts/publish-day6.mjs            scripts/publish-day7.mjs
scripts/publish-day8.mjs            scripts/publish-s2-day1.mjs
scripts/publish-continuity.mjs      scripts/publish-all.mjs
scripts/publish-discussions.mjs     scripts/agent-workflow/publish.js
scripts/matrix-bot/cruise.js
```

Hardening the route alone does **not** close this. Until these are migrated or
retired, the governance model does not hold in practice. Script cleanup is out of
scope (§5) and requires a separate decision.

---

## 4. Verification requirements

Four classes of test. Each states the assertion, not the implementation.

### 4.1 AI_REVIEWED cannot publish

| # | Setup | Expected |
|---|---|---|
| 1 | record with `governance_state = AI_REVIEWED`, attempt requested | request refused by the governance check; **no attempt row created** |
| 2 | same, forced `delivery_state = PUBLISHED` | **database rejects** — `research_distribution_publish_requires_human_approval` |
| 3 | record with `governance_state = DRAFT` | refused |
| 4 | record with `governance_state = WITHDRAWN` | refused |
| 5 | `AI_REVIEWED` → attempt → `HUMAN_APPROVED` → attempt | second attempt permitted; first refused |

The critical assertion is that the refusal happens **before any outbound call**.
A test that stubs the adapter and asserts it was never invoked is required —
refusing after the post exists is not a refusal.

### 4.2 Fingerprint mismatch rejected

| # | Setup | Expected |
|---|---|---|
| 1 | approval event carries fingerprint A; content now hashes to B | refused; mismatch surfaced with both values |
| 2 | identical content, different `platform` | **fingerprint identical** — the exclusion rule of contract §4.3 |
| 3 | identical content, different `surface` | fingerprint identical |
| 4 | identical content, different timestamp supplied | fingerprint identical — timestamps excluded |
| 5 | content differing only in `title` | fingerprint **differs** — `title` is inside the JCS input |
| 6 | key order or whitespace differs, same object | fingerprint identical — JCS canonicalization |
| 7 | computed fingerprint is 64 lowercase hex | satisfies `research_distribution_fingerprint_hex` |

Tests 2–4 protect the property the rule exists for: the same approved content
must fingerprint identically regardless of destination.

### 4.3 Missing governance record rejected

| # | Setup | Expected |
|---|---|---|
| 1 | no `research_distribution_event` row for the record | refused |
| 2 | events exist but none carry `approver_type = HUMAN` | refused |
| 3 | event has `approver_type = HUMAN` but empty `approver_id` | refused |
| 4 | event has `approver_type = HUMAN` but empty `approval_ref` | refused |
| 5 | only `decision = rejected` events exist | refused — `rejected` records history, it does not authorise |
| 6 | only `decision = exception_granted` events exist, no `reason` | **database rejects the insert** — `..._exception_reason` CHECK |
| 7 | `decision = exception_granted` with `reason`, but no approving event | refused — an exception is not an approval |

Tests 5 and 7 are the ones that would otherwise be implemented by assumption.

### 4.4 Attempt lifecycle consistency

| # | Setup | Expected |
|---|---|---|
| 1 | `status = SUCCEEDED` with `completed_at` null | **database rejects** |
| 2 | `status = FAILED` with `completed_at` null | **database rejects** |
| 3 | `status = IN_FLIGHT` with `completed_at` set | **database rejects** |
| 4 | `status = SKIPPED`, `completed_at` set | accepted; `delivery_state` derived as not delivered |
| 5 | attempt created, then adapter reports unknown | attempt stays `IN_FLIGHT`, `reconciliation_required = true`, `completed_at` null |
| 6 | unresolved attempt present, new attempt requested | **refused** — reconciliation guard |
| 7 | after reconciliation resolved, new attempt requested | permitted |
| 8 | success without `platform_post_id` | accepted; `status = SUCCEEDED`. A null post id is not a failure |
| 9 | `UPDATE` on a terminal attempt's `rendered_text` | **database permits** — no trigger exists. Application must prevent it; the test asserts the application does |
| 10 | `delivery_state` assigned directly, no supporting attempt | recomputation overwrites it |
| 11 | recomputation disagrees with stored cache | error raised, **never silently corrected** |
| 12 | `UPDATE` on `research_distribution_event` | **database rejects** — append-only |

Tests 9 and 12 together assert the distinction the contract draws: one table is
application-protected, the other is database-protected.

---

## 5. Explicitly out of scope

| Excluded | Note |
|---|---|
| **Multi-platform support** | This plan covers exactly one platform. The adapter boundary is defined; adapters for other platforms are not. |
| **Automation scheduler** | No scheduled distribution. Distribution is requested explicitly. |
| **Dashboard** | No operator UI. Reconciliation records are listed by query. |
| **CMS** | No content authoring or editing. Content originates in the Repository. |
| **Auth redesign** | Existing authentication unchanged. Whether API-key auth remains alongside the governance gate is undecided. |
| **Script cleanup** | The nine bypass scripts in §3.3 are recorded, not addressed. |
| **Production publishing** | No external publication under this plan. Any first real delivery requires the migration applied and verified, and a separate decision to proceed. |

Also out of scope, consistent with ADR-P2G-001: any change to the existing
publication catalogue (`research_publication`,
`research_publication_attempt`, `research_publication_approval_event`); Registry
mirror tables; queueing; retry orchestration; analytics; notifications.

---

## 6. Sequence of work

| Step | Prerequisite for the next |
|---|---|
| 1. Apply and verify the migration | any database-backed work |
| 2. Make the Registry SSOT available on the working branch | identity resolution |
| 3. Implement fingerprint per contract §4.3 using existing helpers | idempotency |
| 4. Implement the governance check layer (§2.1) | any delivery |
| 5. Implement attempt lifecycle handling (§2.4) | delivery recording |
| 6. Implement the Bluesky adapter (§2.3) | delivery |
| 7. Implement the distribution service (§2.2) | end-to-end |
| 8. Implement the §4 test suite | verification |
| 9. Migrate `matrix/publish` to the adapter boundary (§3.2) | closure of the route |

Steps 1 and 2 are **prerequisites, not tasks**. Neither has been done.

---

*Plan only. No application code, adapter, service, SQL, migration, API route or
script was modified in producing this document.*