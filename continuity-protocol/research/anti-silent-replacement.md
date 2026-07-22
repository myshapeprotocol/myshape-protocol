# Anti-Silent-Replacement Protocol

**Status: Research Concept · CFC-based drift detection**

---

## The Problem

A user authorizes an AI agent. The agent runs for hours or days. At some point, the agent is silently replaced — either by an attacker, a system upgrade gone wrong, or model version drift.

The user never knows. The system never detects it. Because no one is measuring whether the agent is still the same agent.

This is **Silent Replacement** — and it's a category of attack that existing security tools don't address.

## What CPS-0001 Brings

CPS-0001 can detect silent replacement because it measures **continuity**, not identity. If an agent is replaced:

- The motion signature changes (different behavioral pattern)
- The timing entropy shifts (different computational substrate)
- The causal coupling breaks (different sensor-to-action pipeline)
- The predecessor hash chain is broken (different identity root)

## Detection Logic

Based on the Continuity Failure Condition (CFC) catalog from RFC-0002:

| CFC | What It Detects | Anti-Replacement Signal |
|:---|:---|:---|
| CFC-001 (Entropy Drop) | PES drops >50% | New agent has different motion entropy |
| CFC-002 (Sensor Fingerprint) | IMU noise profile change | New agent uses different hardware |
| CFC-003 (Temporal Gap) | Inter-session gap too large | Agent was offline — could have been replaced |
| CFC-005 (Causal Inversion) | Action precedes observation | New agent's timing is different (strongest signal) |
| CFC-008 (Predictability) | Motion too consistent | Synthetic/replaced agent lacks biological noise |

**CFC-005 is the strongest anti-replacement signal.** It was experimentally validated: 13/266 independent-device runs vs 0/50 single-device. If an agent is replaced, the causal relationship between sensor input and agent action breaks.

## Continuity Diff

Beyond CFCs, a more general mechanism: compare two agent states and measure the continuity score.

```
Agent State A (before suspected replacement)
    ↓
Continuity Diff Engine
    ├── Sensor fingerprint hash
    ├── Timing entropy profile
    ├── Causal coupling signature
    └── Predecessor hash chain
    ↓
Continuity Preserved: 93% (PASS)
— or —
Critical Drift Detected: sensor fingerprint changed, timing entropy shifted (FAIL)
```

## Implementation Path

Three stages, building on existing infrastructure:

### Stage 1: Single-Agent Monitoring (Now)

- Wrap agent actions in CPS-0001 receipts
- Verify V₁-V₇ on each critical action
- Alert on V₇ (chain broken) — simplest anti-replacement signal

### Stage 2: Behavioral Baseline (Next Quarter)

- Establish sensor fingerprint baseline for each agent
- Monitor CFC-005 and CFC-008 over time
- Alert on statistically significant drift

### Stage 3: Continuity Diff (Future)

- Compare pre- and post-suspected-replacement states
- Produce a structured ContinuityDiff report
- Integrate with agent runtime frameworks (LangChain, AutoGPT, etc.)

## Why This Matters Now

AI agents are being deployed at scale. They hold API keys, make financial decisions, interact with users. **Nobody is measuring whether the agent at the end of the task is the same agent that started it.**

This is not a theoretical concern. Model updates, infrastructure migrations, supply chain attacks, and plain old bugs can all cause silent replacement. The tools to detect it don't exist yet.

CPS-0001 + CFC catalog is the first proposal for a detection mechanism.

## Relationship to CPS-0001

The Anti-Silent-Replacement Protocol is a **consumer** of CPS-0001 receipts. It makes authorization decisions based on receipt verification, continuity scoring, and CFC detection. It is engine-independent — any evidence engine that produces valid receipts can feed the detection pipeline.

## Next Steps

- [ ] Formalize the Continuity Diff schema
- [ ] Build a reference ContinuityDiff engine (TypeScript)
- [ ] Create test vectors for replacement scenarios
- [ ] Integrate with an open-source agent framework (demo)

---

*The Continuity Lab · 2026 · Research Note*
