# EXP-001 — AI Agent Authorization Continuity

**Status: DESIGN · Interview Phase Pending**

---

## Hypothesis

> AI Agent runtime developers lack a standard, verifiable object for expressing authorization continuity across long-running autonomous tasks.

AI agents executing multi-hour tasks need to prove "the authorization context has not been replaced or hijacked since the task began." Today, each team either trusts the transport layer, rotates tokens, or builds their own internal convention. No common language exists.

## Prediction

If this hypothesis is correct, we expect:

1. At least 3 out of 10 interviewed teams independently describe the same problem.
2. At least 1 team has built their own internal format to handle it.
3. At least 1 team expresses interest in a standard object for this.

## Falsification

This hypothesis is falsified if:

- Most teams report that OAuth token refresh, session cookies, or mutual TLS are sufficient.
- No team describes a gap between what they have and what they need.
- No team has built an internal convention for authorization continuity.

A falsified result is a valid research outcome. It tells us this market does not yet exist.

## Method

1. Identify 10+ teams building AI agent runtimes, multi-agent frameworks, or autonomous task executors.
2. Conduct 20-minute discovery interviews using the [Discovery Interview protocol](../discovery-interview.md).
3. Do NOT pitch CPS-0001 in the first 80% of the conversation.
4. Record: domain, pain level, current solution, interest in a standard.

## Evidence Log

| # | Date | Team/Project | Pain? | Built own? | Interested? | Notes |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | — | — | — | — | — | — |

## Result

- [ ] CONFIRMED — evidence supports the hypothesis
- [ ] REJECTED — evidence contradicts the hypothesis
- [ ] INCONCLUSIVE — insufficient data

**Finding:** *(to be filled after 10+ interviews)*

---

*EXP-001 · The Continuity Lab · 2026*
