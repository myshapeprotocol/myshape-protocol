# Migration Review Checklist — Research Distribution Governance

- **Migration:** `supabase/migrations/20261002_research_distribution_governance.sql`
- **Checkpoint:** `bb883194`
- **Governs:** ADR-P2G-001 (Option B)
- **Status:** DRAFT — NOT APPLIED, NOT PUSHED, NOT COMMITTED
- **Quarantined artifact:** `supabase/quarantine/20261001_research_publication.sql`

---

## 0. Artifact disposition

The Phase 2G preservation task placed `20261001_research_publication.sql` inside
`supabase/migrations/`, which is the migration execution chain. That file revokes
`anon` and `authenticated` privileges on the live catalogue. It has been moved
out of the chain.

| Check | Result |
|---|---|
| Quarantine location | `supabase/quarantine/20261001_research_publication.sql` |
| Bytes | 16,101 — unchanged |
| SHA-256 | `37430860A8F5D15F189F3B90E2214BD7112687462560ED04260E75F4B1E5374F` — matches the preservation record |
| Content edited | No |
| Deleted | No |
| Tracked in git | Yes, recorded as a rename |
| Still in execution chain | No |

---

## 1. Pre-application checklist

### 1.1 Naming and collision

- [ ] `research_distribution` does not exist in any schema
- [ ] `research_distribution_attempt` does not exist in any schema
- [ ] `research_distribution_event` does not exist in any schema
- [ ] `research_distribution_event_is_append_only()` does not already exist
- [ ] No identifier collision with any existing constraint, index, policy or trigger

Rationale: the migration creates tables without `IF NOT EXISTS` so that a name
collision fails loudly rather than silently skipping.

### 1.2 Catalogue protection

- [ ] Baseline recorded: `research_publication`, `research_publication_attempt`,
      `research_publication_approval_event` row counts
- [ ] Baseline recorded: column sets of all three
- [ ] Baseline recorded: policy inventory of all three
- [ ] Baseline recorded: ACL of all three
- [ ] Line-by-line review confirms **no statement** in the migration references
      any catalogue table name
- [ ] Confirmed the migration contains no `REVOKE`, `GRANT`, `ALTER`, or
      `CREATE POLICY` targeting a catalogue table

### 1.3 Privileges

- [ ] Production identity-sequence ACL verified
- [ ] Confirmed the privilege model permits the required sequence access for
      `service_role`

The migration adds no explicit sequence grants. This remains an open
pre-application check, noted in the migration header.

---

## 2. Static review of the migration file

- [ ] No `SECURITY DEFINER` function present
- [ ] Every trigger identifier within the 63-character PostgreSQL limit
- [ ] Every constraint identifier within the 63-character limit
- [ ] Every `DROP TRIGGER IF EXISTS` precedes its `CREATE TRIGGER`
- [ ] All `REVOKE` statements precede all `GRANT` statements
- [ ] Table creation order satisfies the foreign keys
      (distribution → attempt, event)
- [ ] Comment block documents the quarantined artifact and its prohibition

---

## 3. Locked decisions implemented

| # | Decision | Where implemented | Verified |
|---|---|---|---|
| 1 | Namespace `research_distribution*` | all three tables | [ ] |
| 2 | Singular naming | table and column names | [ ] |
| 3 | `decision` excludes `noted` | `research_distribution_event_decision_enum` | [ ] |
| 4 | `AI_REVIEWED` never authorises publication | `research_distribution_publish_requires_human_approval` + application requirement in §5 | [ ] |
| 5 | `rendered_text` NOT NULL | `research_distribution_attempt` | [ ] |
| 6 | Reconciliation partial index | `research_distribution_reconciliation_idx` | [ ] |

---

## 4. Post-application verification

### 4.1 Schema present

- [ ] Three tables exist with the specified column sets
- [ ] All constraints present (7 distribution, 3 attempt, 6 event)
- [ ] All indexes present, of which two are partial
- [ ] Row Level Security enabled on all three
- [ ] Ten policies present

### 4.2 Catalogue untouched

- [ ] `research_publication` row count unchanged from baseline
- [ ] `research_publication_attempt` row count unchanged
- [ ] `research_publication_approval_event` row count unchanged
- [ ] Column sets unchanged on all three
- [ ] Policy inventory unchanged on all three
- [ ] ACL unchanged on all three

### 4.3 Append-only and access

- [ ] UPDATE on `research_distribution_event` refused with `restrict_violation`
- [ ] DELETE on `research_distribution_event` refused with `restrict_violation`
- [ ] TRUNCATE on `research_distribution_event` refused
- [ ] `anon` has no access to any of the three
- [ ] `authenticated` has no access to any of the three
- [ ] `service_role` can INSERT and SELECT on the event table
- [ ] `service_role` UPDATE on the event table refused

### 4.4 Invariants

- [ ] `governance_state = AI_REVIEWED` with `delivery_state = PUBLISHED` rejected
- [ ] `governance_state = HUMAN_APPROVED` with `delivery_state = PUBLISHED` accepted
- [ ] Duplicate idempotency key rejected
- [ ] Attempt `status = SUCCEEDED` with null `completed_at` rejected
- [ ] `decision = exception_granted` with empty `reason` rejected
- [ ] Deleting a distribution that has an event rejected by foreign key restriction
- [ ] Attempt insert with null `rendered_text` rejected

---

## 5. Application-layer requirements

These are **not** satisfied by the migration. They are separate obligations on
the application code, and the database constraint in §4.4 does not discharge
them.

### 5.1 Publication authorisation

> Only `HUMAN_APPROVED` may permit `delivery_state` to reach `PUBLISHED`.

- [ ] The attempt-completion path checks this **before** calling the platform
- [ ] The check re-reads `governance_state` rather than trusting a value read
      earlier in the flow, closing the check-then-act window
- [ ] Publication attempted while `governance_state` is `DRAFT` is refused
- [ ] Publication attempted while `governance_state` is `AI_REVIEWED` is refused
- [ ] Publication attempted while `governance_state` is `WITHDRAWN` is refused
- [ ] Publication attempted with no governance event at all is refused

### 5.2 Reconciliation

- [ ] `reconciliation_required` can be set independently of `status`
- [ ] While true, the attempt remains `IN_FLIGHT` and `delivery_state` remains `IN_FLIGHT`
- [ ] **Opening a new attempt while any unresolved attempt exists for the same
      distribution is refused.** This is the guard against duplicate publication
      after a timeout
- [ ] Unresolved attempts are surfaced in an operator-visible listing
- [ ] A documented reconciliation procedure exists before the first real delivery

### 5.3 State derivation

- [ ] `governance_state` is recomputed from the event log
- [ ] `delivery_state` is recomputed from the attempt log
- [ ] Recomputation is full, and governance is recomputed before delivery
- [ ] Cache drift raises an error and is never silently corrected
- [ ] Direct manipulation of `delivery_state` without supporting attempt rows is
      corrected on the next recomputation

---

## 6. Out of scope

Not part of this migration and not to be added to it:

- Publication catalogue disposition (ADR-P2G-001 records it as an independent decision)
- Any change to `research_publication`, `research_publication_attempt`, or
  `research_publication_approval_event`
- Application code implementing §5
- Scheduling, retry orchestration, queueing, analytics
- Any Registry mirror tables