# Genesis Governance — Protocol Admission Rules v1.0

> **Status**: Active — enforced by `POST /api/node/entropy`
> **Effective**: 2026-07-06
> **Authority**: MyShape Protocol Core

---

## 1. Principle

Genesis admission is **algorithmic, not discretionary.** No human decides who enters the Genesis 100 cohort. The protocol evaluates two objective criteria:

1. **Presence Proof** — PES (Presence Entropy Score) > 0.5, verified via the 4D entropy engine
2. **Temporal Position** — The node is among the first 100 eligible entities to submit a valid proof

There is no invite code. There is no waitlist priority. There is no manual override.

---

## 2. Eligibility Matrix

A node is eligible for Genesis evaluation if and only if its current status is NOT in the exclusion set:

```
Exclusion Set = { GENESIS_NODE, AGENT_ACTIVE, TEST_ACCOUNT, SUBSCRIBED }
```

| Current Status | Eligible? | Rationale |
|:---|:---|:---|
| `PENDING_VERIFICATION` | ✅ Yes | New node awaiting first scan |
| `ACTIVE` | ✅ Yes | OTP-verified, scan not yet performed |
| `GENESIS_CONNECTED` | ✅ Yes | Handshake-complete, awaiting scan |
| `SUBSCRIBED` | ❌ No | Research Signal contact; not a protocol participant — excluded from the node verification/activation lifecycle |
| `GENESIS_NODE` | ❌ No | Already minted — key is permanent |
| `AGENT_ACTIVE` | ❌ No | AI agents are a separate identity class |
| `TEST_ACCOUNT` | ❌ No | Sandbox/dev accounts excluded from governance |

**Design note**: `ACTIVE` was previously excluded (v0), creating a path-blocking bug: OTP-verified users became `ACTIVE` before their first scan, rendering them permanently ineligible. This was corrected in v1.0.

---

## 3. Decision Algorithm

```
INPUT:  email, pesScore, pesTiming, pesNoise, pesFrequency, pesBiological
OUTPUT: status, badge_minted, genesis_key, cohort_full, slots_remaining

1. Read node from protocol_nodes by email
2. IF node.status ∈ Exclusion Set → skip minting, update entropy only
3. IF pesScore ≤ 0.5 → skip minting, update entropy only
4. COUNT verified nodes WHERE status IN (GENESIS_NODE, ACTIVE, AGENT_ACTIVE)
5. IF count < 100:
     newNodeStatus = GENESIS_NODE
     genesis_key    = GK_${UUID_v4}
     cohort_full    = false
   ELSE:
     newNodeStatus = ACTIVE
     genesis_key    = null
     cohort_full    = true
6. UPDATE protocol_nodes SET status = newNodeStatus, genesis_key = ..., entropy = ...
7. RETURN { badge_minted: newNodeStatus, genesis_key, cohort_full, slots_remaining }
```

---

## 4. Immutability Guarantees

| Property | Guarantee |
|:---|:---|
| Genesis Key is write-once | Set only when `GENESIS_NODE` is first assigned. Never overwritten. Never rotated. |
| GENESIS_NODE is terminal | Once minted, the node's status never downgrades. Subsequent scans only update entropy. |
| Cohort cap is absolute | The 100-slot ceiling is enforced by a real-time count of verified nodes. No reservation, no queue-jumping. |
| No admin bypass | The `SUPABASE_SERVICE_ROLE_KEY` can technically modify rows, but the API route does not expose any override parameter. |

---

## 5. Race Condition Posture

The count-check and insert are not wrapped in a serializable transaction. In theory, two simultaneous submissions could both see count = 99 and both receive `GENESIS_NODE`, yielding 101 genesis nodes.

**Assessment**: Acceptable. The protocol prioritizes availability and low latency over strict serializability. The marginal impact of ±1 genesis node is zero for security or economic properties. This is a governance rule, not a cryptographic invariant.

If strict enforcement becomes necessary, the count and insert can be wrapped in a Supabase `pg_advisory_xact_lock` or a serializable transaction. Tracked as **GOV-001** (deferred).

---

## 6. Post-Cohort Behavior

When `cohort_full = true`, the frontend renders:

```
◈ Genesis Phase Finalized
Protocol is now in Continuity Phase mode.
[Get notified for ZK-Identity launch]
[◈ View my Node]
```

The user's node remains `ACTIVE` — fully functional for motion-signature verification, entropy accumulation, and presence proof generation. They are not "rejected"; they are participants in the protocol's next phase.

---

## 7. Governance Evolution

| Phase | Trigger | Behavior |
|:---|:---|:---|
| **Genesis** (current) | Slots remaining > 0 | Automatic GENESIS_NODE minting on PES > 0.5 |
| **Continuity** | Slots remaining = 0 | ACTIVE only. ZK-Identity features unlock for all nodes. |
| **Sovereignty** (planned) | ZK-Identity launch | GENESIS_NODE holders receive protocol governance weight. ACTIVE nodes receive ZK credential minting. |

---

*This document is the canonical reference for Genesis admission. Any proposed change must update this spec, the `POST /api/node/entropy` route, and the state machine test suite before deployment.*
