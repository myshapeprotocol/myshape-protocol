# ADR-P2G-001: Separate Publication Catalog and Distribution Governance Models

- **Status:** Accepted (investigation direction only)
- **Date:** 2026-10-02
- **Scope:** Phase 2G — Distribution MVP
- **Supersedes:** none

---

## Context

Phase 2G introduces a publication distribution layer intended for the
Distribution MVP (RN-001 to first publication flow). Before it could be
applied, a read-only schema investigation of production project
`vwqytyipwzazxdtbnzne` was performed.

That investigation established the following facts.

### Fact 1 — An existing publication schema is already deployed

Production contains three tables that occupy the exact names Phase 2G
intends to use:

- `public.research_publication`
- `public.research_publication_attempt`
- `public.research_publication_approval_event`

These are not empty placeholders. They carry:

- foreign keys from `research_publication_attempt` (ON DELETE CASCADE)
  and `research_publication_approval_event` to `research_publication`
- an access control layer granting privileges to `anon` and
  `authenticated`
- RLS policies, including public read policies and authenticated
  workflow policies
- a mutation-prevention trigger and trigger function on the approval
  event table

All three tables currently hold zero rows.

### Fact 2 — Phase 2G collides by name

The migration artifact `20261001_research_publication.sql` uses identical
table names. It was recovered from
`C:\temp\p2a-preflight\supabase\migrations\` (detached HEAD, untracked)
and is now preserved at
`supabase/migrations/20261001_research_publication.sql`, SHA-256
`37430860A8F5D15F189F3B90E2214BD7112687462560ED04260E75F4B1E5374F`.

The artifact had never been committed to any branch. Until this
preservation it existed in exactly one detached worktree and could have
been lost irrecoverably.

### Fact 3 — The two models are semantically different

| Dimension | Existing schema | Phase 2G |
|---|---|---|
| Primary key | `uuid` | `BIGINT IDENTITY` |
| FK delete semantics | `ON DELETE CASCADE` | `ON DELETE RESTRICT` |
| Access model | public read + authenticated workflow | service role only; anon/authenticated revoked |
| Identity anchoring | none | `registry_commit` + `asset_id` / `version_id` / `surface` |
| Content integrity | none | `content_fingerprint` = SHA-256(UTF8(JCS({content,title}))), RFC 8785 |
| Idempotency | none | `UNIQUE (version_id, surface, platform, content_fingerprint)` |
| Approval granularity | single `approver` column | `approver_type` / `approver_id` / `approval_source` / `approval_ref` |
| State machine | free-text `status` | CHECK-constrained enums + completion-consistency CHECK |

The existing schema models an academic paper catalogue. Phase 2G models
a registry-anchored distribution record with cryptographic content
fingerprinting. These are different domains that converged on the same
names.

### Fact 4 — Applying the artifact as written would be destructive

Two properties of the artifact interact badly with the live database:

1. `CREATE TABLE IF NOT EXISTS` is name-directed. Because all three names
   are already taken, every `CREATE TABLE` would be silently skipped. The
   Phase 2G schema would not land, while grants, triggers, indexes and
   policies would still be applied — attaching Phase 2G triggers to a
   foreign schema.
2. `REVOKE ALL ... FROM anon, authenticated` would strip the privileges
   underpinning the confirmed public read and authenticated workflow
   policies. This is an irreversible access-surface change.

This is a fail-silently outcome: the migration would report success while
breaking a deployed service.

---

## Decision

**Option B — the two models are separated. The existing publication
catalogue is preserved untouched, and the Distribution MVP schema is
introduced under distinct names.**

This is a direction for investigation and naming, not a final migration.

### Rationale

- **Different domains, not different versions.** Extending the existing
  tables would create a hybrid of an academic paper catalogue and a
  distribution execution log. Neither concern would be served correctly.
- **Governance postures are mutually exclusive.** The existing schema
  publishes read access to `anon`; Phase 2G revokes all `anon` and
  `authenticated` privileges. One table cannot satisfy both intents.
- **The cascade semantics conflict with the governance intent.** The
  existing `ON DELETE CASCADE` permits deleting a publication together
  with its attempt and approval audit trail. Phase 2G requires
  `ON DELETE RESTRICT` plus append-only approval evidence. This conflict
  cannot be resolved by adding columns.
- **Option A defect is structural, not cosmetic.** Extending the existing
  tables would require replacing FK constraints, which under Option A
  semantics amounts to rewriting the existing tables.
- **Option C is insufficient.** Renaming Phase 2G resolves naming
  collision only. The governance conflict and audit-semantics conflict
  would persist.

### Consequences accepted

- Two publication-related models will coexist. Naming discipline and
  documentation are required to keep them distinguishable.
- The existing tables remain a known technical debt: cascade delete and a
  weaker approval trail. This ADR records the debt; it does not resolve
  it.
- The existing tables' disposition is a separate decision and is out of
  scope here.

---

## Non-goals

This ADR does **not**:

- authorise applying any migration
- define the final table names for the Distribution MVP schema
- decide the disposition of the existing tables
- constitute the migration

---

## Open questions

1. Who created the existing schema, under which decision, and is any
   consumer outside this repository relying on the public read surface?
2. What naming convention will the Distribution MVP schema adopt?
3. Should the existing catalogue be retained as a catalogue, archived, or
   otherwise dispositioned?