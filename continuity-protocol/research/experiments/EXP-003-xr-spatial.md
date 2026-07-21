# EXP-003 — XR / Spatial Session Continuity

**Status: DESIGN · Interview Phase Pending**

---

## Hypothesis

> XR and spatial computing systems face a cross-device session continuity problem — when sensor data from headset, controllers, and external trackers must be combined, there is no standard way to express "these streams describe the same continuous session."

Multi-device XR systems (headset + hand trackers + external cameras + body trackers) produce continuous sensor streams that must be correlated across devices. Today each platform handles this internally with proprietary formats. No common object exists to express "these N sensor streams, across M devices, belong to the same unbroken observation session."

## Prediction

If true:

1. XR platform engineers describe cross-device stream correlation as a real engineering challenge.
2. At least 2 teams have built internal session/correlation IDs or timestamp-based conventions.
3. A standard "session continuity" object is seen as useful for multi-vendor XR setups.

## Falsification

- All XR data correlation is handled within single-vendor stacks.
- Timestamps + device IDs are universally considered sufficient.
- No one describes cross-vendor or cross-device continuity as a problem.

## Method

1. Target XR/spatial computing platform engineers.
2. Focus on: "How do you know that the controller data and the headset data describe the same person in the same session?"

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

*EXP-003 · The Continuity Lab · 2026*
