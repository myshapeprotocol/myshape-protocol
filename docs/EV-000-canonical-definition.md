# EV-000 — Canonical Definition

**Status:** CANONICAL / GOVERNANCE DRAFT LOCK
**Scope:** EV-000
**Retention:** 90 days from enrollment
**Custodian:** Raymond Wu
**Participant identity:** none
**Longitudinal linkage:** EV-000 scoped only
**Withdrawal:** Participant Ref + designated contact
**Contact verification:** confirmed by project owner

---

## 0. Purpose and Status of This Document

This document freezes the research-governance decisions required before any
EV-000 implementation begins. It is the source document for the next
implementation phase.

**Frozen here:** the meaning of EV-000, enrollment, participant ref, interaction,
research artifact, external evidence, the lifecycle model, withdrawal,
retention, custodian duties, and the boundary against existing systems.

**Not here:** any SQL, schema, migration, route, endpoint, enumeration value,
scheduler, authentication system, or admin interface. Those are implementation
concerns. This document defines the rules they must satisfy.

**Language convention.** This document states research-governance rules using
phrases such as "EV-000 requires…" and "the participant contract states…". It
makes no claim about what any law requires, and asserts no compliance status
against any regulation. Legal sufficiency is outside its scope and must be
reviewed separately by qualified counsel.

**Identifier note.** The repository already uses `EE-001`…`EE-005` for Evidence
Engines. `EV-000` is a distinct namespace and must never collide with it.

---

## 1. What EV-000 Is

EV-000 is:

> The minimum governance contract under which an external person may
> participate in Continuity Lab research, and the minimum record of that
> participation.

EV-000 **is not**:

* a product;
* an account system;
* a membership system;
* a marketing funnel;
* an identity system;
* external validation itself.

EV-000 is the governance **precondition** for external participation. External
validation is established separately, by actual external research activity and
the evidence it produces. Satisfying EV-000 does not by itself constitute
external validation.

### 1.1 Five concepts that are not merged

| Concept | Definition | Current status |
|---|---|---|
| **EV-000** | The governance contract itself: consent, withdrawal, retention, custody. | Defined here. Meta-level. |
| **Discovery survey** | A market-discovery questionnaire. Market research, not protocol research. | Exists, outside EV-000. |
| **Motion contribution** | A specific activity type: a phone motion capture. | Exists; an Interaction only when enrolled. |
| **Research session** | The stored measurement produced by one Interaction. A result, not a person. | Exists; serves as Research Artifact. |
| **External evidence** | A record that a named enrollment produced a named artifact supporting a named claim. | Concept only; deferred. |

The load-bearing distinction: **a research artifact is a measurement; a
participant is a person. EV-000 governs the person.** The existing research
session store was designed to hold no person. Linking artifacts to enrollments
must not rewrite that store into an identity store.

---

## 2. Enrollment

**Enrollment** means a participant voluntarily accepts the EV-000 participation
terms and receives an EV-000 Participant Ref.

**Enrollment is itself valid participation.**

**Enrollment does not imply Interaction.** A participant may enroll, never
interact, and remain a valid participant until withdrawal or retention expiry.
Reports must therefore state enrollment and interaction counts separately.
Enrollment volume must never be presented as research activity.

### 2.1 Required enrollment facts

Every enrollment records at minimum:

* an opaque enrollment reference;
* the enrollment timestamp;
* the consent version accepted;
* the retention deadline;
* the lifecycle state.

### 2.2 Prohibited from collection

EV-000 must not collect, store, or derive:

* name;
* email;
* account, profile, or password;
* wallet or blockchain identity;
* device fingerprint;
* persistent IP address;
* demographic profile.

A later governance decision may change this, and only that decision. No
implementation may introduce these fields on its own initiative.

---

## 3. Participant Ref

The **Participant Ref** is:

* scoped to EV-000 only;
* opaque;
* random;
* high entropy;
* generated using a CSPRNG;
* non-semantic — encoding nothing about time, platform, or sequence;
* not reusable across other MyShape systems;
* not a global identity.

The server stores only a cryptographic hash of the ref. The participant
receives the ref exactly once.

**A Participant Ref is a withdrawal capability, not an identity.** It grants one
power — self-service withdrawal — and supports no observation, correlation, or
profiling. EV-000 does not design accounts, passwords, wallets, or identity
verification of any kind.
---

## 4. Interaction

**Interaction** means that an enrolled participant performs a defined research
activity recognized by EV-000.

Enrollment and Interaction are **distinct facts**. At minimum:

> `ENROLLED ≠ INTERACTED`

Candidate interaction kinds include completing an approved questionnaire,
performing an approved motion test, and submitting an approved research
artifact. **No existing public activity is automatically an EV-000
Interaction.** Existing instruments are not EV-000 governed until enrolled.

EV-000 requires a **closed enumeration** of interaction kinds, so that
recognised activity cannot expand without a governance decision. The initial
enumeration values are not frozen in this document and must be proposed and
reviewed before implementation.

---

## 5. Longitudinal Linkage

**Frozen: YES — but only inside EV-000.**

One enrollment may be associated with multiple interactions:

```text
EV-000 Enrollment
    ├── Interaction 1
    ├── Interaction 2
    └── Interaction 3
```

This does **not** create:

* a global participant identity;
* a cross-project identity;
* a cross-product profile;
* any identity linkage outside EV-000.

**EV-000 can associate multiple research interactions with the same enrollment,
and the participant must be explicitly informed of this before enrolling.** It is
a deliberate privacy trade-off: longitudinal participation is what makes
external validation meaningful, and it necessarily creates a record that one
enrollment performed several activities. That record exists only inside EV-000
and carries no identity.

---

## 6. Research Artifact

A **Research Artifact** is the stored result of an Interaction.

The existing `research_sessions` store may serve as the artifact store.

> A research artifact is a measurement/result. It is not a participant
> identity.

Participant identity attributes must not be placed into the artifact. Any
linkage required must be an EV-000-scoped reference only, and the artifact
store's anonymous identity model must not be rewritten.

---

## 7. External Evidence

**External Evidence** is conceptually:

> A record that an enrolled external participant produced a particular research
> artifact through a defined interaction at a known time, supporting a named
> research claim.

The **External Evidence Registry** is distinct from:

* `continuity_receipts` — a protocol cryptographic proof, not participant
  evidence;
* `docs/research-assets.registry.yaml` — a research asset SSOT, not a
  participant evidence registry;
* `discovery_survey` — a market-discovery instrument;
* participant identity.

**Conceptual responsibility only.** The registry records that an enrolled
person produced an artifact supporting a claim. It must not duplicate artifact
payloads, must not become an identity store, and must be referenceable from
published research.

**Schema and implementation are deferred.** No schema is designed in this
---

## 8. Lifecycle Model

```text
                         ┌────────────────────┐
                         │                    │
                         ▼                    │
NO RECORD ──enroll──▶ ENROLLED ──interaction──▶ INTERACTED
                         │                         │
                         │                         │
                         │                  evidence recorded
                         │                         ▼
                         │                 EVIDENCE_RECORDED
                         │
                         ├──── withdraw ─────▶ WITHDRAWN
                         │
                         └──── retention ─────▶ RETAINED_OUT
```

Frozen properties:

* `ENROLLED` is a **valid** state, and a valid terminal state, when no
  interaction occurs.
* `EVIDENCE_RECORDED` **refines** `INTERACTED`; it does not erase the fact that
  an interaction occurred.
* `WITHDRAWN` and `RETAINED_OUT` are terminal lifecycle outcomes reachable from
  any state.
* Withdrawal and retention are **lifecycle controls, not research-progress
  stages**. They control collection; they do not advance research.
* No state transition implies that enrollment volume equals research activity.

---

## 9. Withdrawal

**Withdrawal = participant-requested state change plus immediate payload
removal.**

On a valid withdrawal request EV-000 requires:

1. marking the enrollment withdrawn;
2. recording the withdrawal timestamp;
3. stopping all future collection for that enrollment;
4. deleting participant payload, including the stored Participant Ref hash
   (§11.3);
5. preserving a non-identifying withdrawal tombstone; and
6. not resurrecting the old enrollment.

**Withdrawal is irreversible.** Re-enrollment creates a new enrollment and a
new Participant Ref. Purged data is never restored by re-enrollment.

Withdrawal does **not** extend retention and does **not** restart the 90-day
clock (§11.1). It removes participant data earlier than expiry would have.

### 9.1 Channels

Withdrawal must be accessible through:

* **Self-service**, using the Participant Ref — the primary channel;
* **A designated human contact** for participants who cannot self-serve.

### 9.2 Withdrawal contact

The EV-000 withdrawal contact is `dev@myshape.com`.

The project owner has confirmed that this address exists and is monitored. It is
the designated human withdrawal channel for participants who cannot use
self-service, alongside the self-service Participant Ref path in §9.1.

This address is a confirmed participant-facing channel and must be presented to
participants as such. It must not be silently replaced with another address
without a further governance decision.

---

## 10. Withdrawal and Published Results

**Withdrawal does not retroactively remove already-derived or already-published
aggregate research results.**

This must be disclosed in the participant consent language.

- Participant payload, and any linkable research records, are subject to the
  withdrawal and retention rules in this document.
- Published aggregate results are a **separate research artifact** and survive
  withdrawal and retention expiry.

Consent copy that omits this disclosure misrepresents the withdrawal promise.

---

## 11. Retention

**Retention period: 90 days from enrollment.**

- Retention starts at `enrolled_at`.
- Retention **does not reset** when another Interaction occurs. Continued
  activity grants no extension.
- Retention **does not reset** when evidence is recorded.
- **Withdrawal shortens retention; it never extends retention.**
- No mechanism may extend participant-data retention beyond the original
  `retention_until`.

### 11.1 The 90-day clock

```text
retention_until = enrolled_at + 90 days
```

The clock starts at enrollment. It does not reset on Interaction, on evidence,
or on withdrawal. If withdrawal occurs before expiry, participant data is
removed earlier — never later.

### 11.2 Participant Data versus Governance Record

Retention governs two categories of data with different fates. They are
separate concepts and must not be conflated.

**Participant Data** is data whose purpose is to support the participant's
research participation or their withdrawal capability:

* `participant_ref_hash`;
* participant payload;
* free-text responses;
* participant-linked interaction data;
* any future data whose purpose is to represent the participant's research
  participation rather than governance execution.

**The Governance Record** is the non-identifying evidence that EV-000
governance was executed:

* that an enrollment occurred;
* the consent version that governed it;
* `enrolled_at`;
* the retention outcome;
* the withdrawal outcome and `withdrawn_at`, if applicable;
* other explicitly non-identifying governance metadata required to
  demonstrate execution of the EV-000 contract.

### 11.3 `participant_ref_hash` is Participant Data

> **`participant_ref_hash` is not governance metadata.**
>
> It is the server-side representation of the participant's withdrawal
> capability, and it is therefore subject to the 90-day participant-data
> retention boundary.

After retention expiry:

* the hash is removed;
* the original Participant Ref cannot be reconstructed — SHA-256 is one-way
  and the ref was 256 bits of CSPRNG output;
* the participant can no longer use the expired Ref to invoke withdrawal;
* **no replacement identifier may be retained** for future correlation with
  that participant.

Removing the hash is **not** an identity deletion. The Participant Ref was
never an identity: it carried no name, email, account, wallet, device, or
demographic attribute. What expires is the capability to act on the
enrollment, and nothing else.
### 11.4 Retention expiry model

```text
ENROLLED
   │
   ├── participant data retained until retention_until
   │
   ├── WITHDRAWN
   │      └── participant data removed earlier
   │
   └── retention_until reached
          │
          ├── participant capability removed
          ├── participant payload removed
          ├── participant-linked research data removed
          └── minimal governance record retained
```

Retention expiry is a **data-retention outcome**, orthogonal to the lifecycle
state in §8. It does **not** introduce a new lifecycle state, and it must
never be represented as a research-progress stage.

The distinction in §8 is preserved exactly:

* `ENROLLED` means enrollment occurred;
* `INTERACTED` means interaction occurred;
* `EVIDENCE_RECORDED` means evidence exists;
* `WITHDRAWN` is a terminal lifecycle outcome;
* **retention is a separate data-retention concern** and is not a lifecycle
  stage.

### 11.5 What is removed and what survives

| Removed at expiry | Survives expiry |
|---|---|
| `participant_ref_hash` | Consent version |
| Participant payload | `enrolled_at` |
| Free-text responses | The fact that an enrollment occurred |
| Participant-linked interaction data | Retention outcome |
| — | Withdrawal outcome and `withdrawn_at`, if applicable |
| — | Aggregate and published research results |
| — | Custodian audit log |

**The retained Governance Record MUST NOT contain:**

* the Participant Ref, or its hash;
* name, email, wallet, account identifier, device identifier, IP address, or
  user agent;
* any identity correlation key;
* **any replacement capability that could reconnect the record to the
  expired participant or to future activity.**

### 11.6 What the project can still demonstrate after expiry

After participant data expires, the project can demonstrate:

* that an EV-000 enrollment existed;
* which consent version governed it;
* when enrollment occurred;
* what retention outcome was recorded;
* what withdrawal outcome was recorded, if any.

It cannot demonstrate every underlying participant event, and **it does not
claim to**. Only the minimum Governance Record defined in §11.2 survives.

The project can **not** reconnect a retained governance record to the
participant who produced it, because the only link — the ref hash — has been
removed and is not replaced.

### 11.7 Enforcement

Retention expiry must **not** be implemented as deletion of the entire
enrollment row. The Governance Record and Participant Data are separated
within the record, and only Participant Data expires.

The retention operation must be **idempotent**: running it repeatedly over
already-expired data must be safe and must change nothing.

**Enforcement is not complete because a purge function exists.** The
scheduled caller must actually be operational; a defined-but-uncalled
function is not enforcement.

**Intended substrate (architectural direction only, not implemented here):**

> The intended retention-enforcement substrate is database-local scheduling
> through PostgreSQL/Supabase `pg_cron`, subject to a separate implementation
> and infrastructure gate.

This is recorded as a direction only. The extension is **not** enabled, **no**
cron configuration exists, and **no** grants or deployment configuration were
changed by this document. Choosing `pg_cron` avoids a public HTTP endpoint, a
new participant-data deletion API, a new long-lived daemon, any coupling to a
social-monitoring process, and keeps cleanup close to the data it governs.

---

## 12. Custodian

**Custodian: Raymond Wu.**

The custodian is the named human accountable for EV-000 participant data.

### 12.1 Responsibilities

* protect participant data;
* honour withdrawal;
* honour retention;
* maintain the participation contract;
* handle participant escalation;
* ensure data is used only for the stated research purpose.

### 12.2 Prohibitions

The custodian must **not**:

* infer participant identity;
* re-identify participants;
* correlate EV-000 data with external datasets;
* use participant data for marketing;
* extend retention;
* reinstate withdrawn payload.

### 12.3 Auditability

Custodian access must be auditable. No authentication or admin system is
designed in this document.

---

## 13. Custodian Audit Log — Conceptual Requirement

Every custodian read of retained participant data must be auditable.

Minimum conceptual fields:

* actor;
* timestamp;
* enrollment reference hash;
* access scope;
* purpose.

**Not implemented in this task.** This is a requirement the implementation must
satisfy, not a delivered component.

---

## 14. Existing System Boundary

| Existing system | Classification | Reason |
|---|---|---|
| `discovery_survey` | **LEAVE INDEPENDENT** | Market-discovery instrument, not EV-000 governed participation. Its existing `contact` PII must not be imported into EV-000. |
| `research_sessions` | **CONNECT** | May serve as the Research Artifact store. Any linkage must remain EV-000 scoped. Its anonymous identity model must not be rewritten. |
| `/api/research/upload` | **CONNECT** | Reuse its existing validation and storage path where appropriate. It must require valid EV-000 participation for EV-000-governed interactions. |
| `continuity_receipts` | **LEAVE INDEPENDENT** | Protocol cryptographic proof, not a participant evidence registry. |
| `docs/research-assets.registry.yaml` | **LEAVE INDEPENDENT** | Research asset SSOT, not a participant evidence registry. |
| `recruitment_applications` | **LEAVE INDEPENDENT** | Email-based recruitment funnel, not EV-000 identity. |

No schema change to any of these systems is authorised by this document.

---

## 15. Pre-Existing Governance Debt

Recorded here, **not fixed** by this document and **not** an EV-000
implementation blocker.

### `discovery_survey.contact`

Known current conditions:

* contact PII exists in the store;
* no EV-000 consent record exists for it;
* no participant withdrawal mechanism exists for it;
* no explicit retention rule exists for it;
* no EV-000 custodian governs it.

**Classification: PRE-EXISTING GOVERNANCE DEBT.**

It must not be silently absorbed into the new EV-000 system, and EV-000 must not
be described as remedying it. It is to be handled later during the planned
broader architecture and governance audit.

---

---

## 15A. Participant Consent — FROZEN

**Consent version: `EV-000-CONSENT-1.0`**
**Status:** FROZEN
**Effective scope:** EV-000 enrollment

This is the participant-facing consent presented at the start of EV-000
enrollment. It is frozen. Any change to it requires a new `consent_version`; the
wording below must not be altered in place.

### 15A.1 Consent text as presented to the participant

> **Taking part in Continuity Lab research (EV-000)**
>
> **What you are choosing to do.** You are choosing to take part in Continuity
> Lab research. Taking part is voluntary. You can stop taking part at any time.
>
> **Enrolling is a separate step from taking part.** Enrolling records your
> agreement to the terms below. It does not by itself mean you have done
> anything. You can enrol and then never take part in any activity, and you
> remain a participant. You do not have to complete any activity to enrol.
>
> **We do not ask who you are.** EV-000 does not ask for your name, your email
> address, an account, a wallet, or any other profile about you. We do not ask
> for your device details or store your IP address.
>
> **You get one random code — your Participant Ref.** When you enrol, we
> generate a random code for you. This is your Participant Ref. You will be
> shown it once, at that moment. It is not shown again, and we cannot show it to
> you later. Please keep it somewhere safe. You need it to stop taking part.
>
> **We keep only a hash of it.** What we store is not your Participant Ref but a
> one-way hash of it. We cannot use the stored value to work out your
> Participant Ref.
>
> **If you later take part in a research activity, it may be linked to your
> enrolment.** If you go on to perform an EV-000 research activity, that
> activity may be recorded as linked to your EV-000 enrolment, using your
> Participant Ref and enrolment reference. That link exists only inside EV-000.
> It is not used to build an identity for you across the internet, across
> projects, or across products, and it is not intended to identify you.
>
> **How long we keep your data.** We keep EV-000 participant data for 90 days
> counted from the day you enrol. Taking part in an activity later does not
> restart that 90 days. The 90-day period does not extend because you keep
> taking part.
>
> **How to stop taking part.** You can stop at any time by using your
> Participant Ref. When you do:
>
> * we stop collecting anything further from you;
> * we remove your participant data from our records; and
> * we keep only a non-identifying note that you withdrew, so that we can show
>   your withdrawal was honoured.
>
> Stopping cannot be undone. Enrolling again afterwards creates a new enrolment
> with a new Participant Ref, and does not bring back anything already removed.
>
> If you cannot use your Participant Ref, or you would rather not use it, you
> can contact us at **dev@myshape.com** and ask to stop taking part.
>
> **What withdrawing does not do.** Withdrawing does not take back research
> results that were already worked out or already published before you
> withdrew. Those results stay as they are. Withdrawing removes your data going
> forward; it does not rewrite results that are already out.

### 15A.2 Presentation requirements

The consent must be presented before enrollment completes, and enrollment must
record `EV-000-CONSENT-1.0` as the accepted `consent_version` (§2.1).

The Participant Ref is displayed to the participant **once**, at enrollment
(§3). It is never displayed again and is never recoverable by staff.

### 15A.3 Scope limits on this consent

This consent covers EV-000 participation only. It does **not** cover, and must
not be presented as covering:

* marketing or email subscription;
* account creation or identity verification;
* legal waivers, liability releases, or medical consent;
* broad data sharing, or sharing with third parties or advertisers;
* any future or undefined research permission.

Any of the above would require its own consent and its own governance decision.
## 16. Open and Unverified Items

Only the following remain unresolved. No further blockers are asserted.

### Resolved

**Consent copy and `consent_version` — FROZEN.** The minimum participant-facing
consent and its version identifier `EV-000-CONSENT-1.0` are frozen in §15A.
Enrollment may record that version as the accepted `consent_version` (§2.1).
This item is no longer open.

**Withdrawal contact.** `dev@myshape.com` was previously listed here as pending
verification. The project owner has confirmed that the address exists and is
monitored. It is a confirmed participant-facing withdrawal channel (§9.2) and no
longer an open item.

### B. Initial `interaction_kind` enumeration

The governance rule requiring a closed enumeration is frozen; the exact initial
values are not. They must be proposed and reviewed before implementation.

Interaction taxonomy remains deferred. No interaction enum exists, and no
interaction may be recorded under EV-000 until one is approved.

### C. External Evidence Registry implementation

The concept and its boundary are defined. Schema and implementation are
deferred to a later phase.

---

## 17. Implementation Prerequisites

Enrollment implementation must not begin until the following are settled:

1. ~~Confirm the withdrawal contact address.~~ **Satisfied.** `dev@myshape.com`
   confirmed by the project owner (§9.2).
2. ~~Freeze the minimum EV-000 consent copy and its `consent_version`.~~
   **Satisfied.** The consent copy and version `EV-000-CONSENT-1.0` are frozen
   in §15A, and carry both the §10 non-retroactivity disclosure and the §5
   EV-000-scoped longitudinal-linkage disclosure.
3. Confirm the `EV-000` identifier does not collide with the existing
   `EE-0xx` Evidence Engine namespace.
4. Finalise the initial `interaction_kind` enumeration (§16.B) before any
   interaction is recorded. This does **not** block the enrollment slice, which
   must not require an interaction_kind.

**EV-000 enrollment is no longer governance-blocked.** It may be implemented
against §15A, subject to §17.3, which is a naming check rather than a
participant-governance decision.

---

## 18. What This Document Does Not Do

It creates no schema, migration, table, column, endpoint, route, or UI surface.
It defines no scheduler or cleanup automation. It designs no authentication or
administrator interface. It records no legal conclusion and asserts no
regulatory compliance status.

Implementation follows this document. It does not precede it.