# EXP-002 — Enterprise Session Continuity

**Status: DESIGN · Interview Phase Pending**

---

## Hypothesis

> Enterprise Zero Trust and continuous authentication products lack an exchangeable, verifiable object for expressing session continuity across access control boundaries.

Enterprises deploying Zero Trust architectures need to answer: "Is the entity making this request the same entity that authenticated 10 minutes ago?" Today this relies on session cookies, device posture checks, and risk scoring — but no standardized format exists to express "this session has been continuously held by the same entity across this time interval."

## Prediction

If true, we expect:

1. Security architects describe a gap between "point-in-time authentication" and "continuous trust."
2. At least 2 teams have built internal session continuity checks that are not interoperable.
3. Gateway/vendor-agnostic formats are seen as valuable (e.g., Envoy/Kong plugin compatibility).

## Falsification

- Teams report that existing device posture + session management is sufficient.
- No one describes a need for an exchangeable continuity object.
- "Continuous authentication" is handled entirely within closed vendor ecosystems.

## Method

1. Identify security architects and Zero Trust product teams.
2. Discovery interviews — 20 min each.
3. Focus on: "What happens to trust between authentication events?"

## Evidence Log

| # | Date | Team/Project | Pain? | Built own? | Interested? | Notes |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | — | — | — | — | — | — |

## Result

- [ ] CONFIRMED
- [ ] REJECTED
- [ ] INCONCLUSIVE

**Finding:** *(to be filled)*

---

*EXP-002 · The Continuity Lab · 2026*
