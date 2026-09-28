# CPS-0001 Independent Verifier Test — Blind Round (Track A)

## Purpose

The purpose is to test whether an independent developer can implement CPS-0001 v1.0-RC1 verification from the supplied public normative materials without relying on the original implementation.

This is a specification reproducibility test.

It is NOT:

- a product demonstration
- a security audit
- an investment evaluation
- an endorsement request
- a test of the developer's general programming ability

Ambiguity and reproducibility problems are valuable findings.

## Materials

The package contains only:

- normative specification (`spec/CPS0001.md`)
- JSON Schema (`schema/continuity-receipt.schema.json`)
- seven supplied vectors (`vectors/`)
- this brief

No other MyShape implementation material is required or permitted.

## Independence

Allowed:

- any language
- any runtime
- standard cryptographic libraries
- standard JSON/JCS libraries
- public standards documentation

Prohibited:

- cloning or consulting the MyShape repository implementation
- `src/**`
- `packages/**`
- SDK source
- reference verifier
- CLI implementation
- second producer
- shared/JCS internal helpers
- internal tests
- conformance suite
- ChainStore/Supabase
- internal reports
- other MyShape-specific implementation helpers

Do not use an existing MyShape implementation to determine the expected result.

## Fixed evaluation time

Use:

`2026-09-20T00:00:00Z`

Do not use the participant's live system clock for the blind evaluation.

## Procedure

Participants should:

1. Read the supplied specification and schema.
2. Implement the verifier independently.
3. Do not consult MyShape implementation material.
4. Preferably implement before inspecting/testing against the supplied vectors.
5. Test the supplied vectors.
6. Record the result of each vector.
7. Record V1–V7 behavior where applicable.
8. Record the reason for any invalid result.
9. Record any ambiguity or missing specification detail.
10. If possible, create at least one synthetic test case.

## Reporting format

For every vector report:

- vector filename
- overall result
- V1 result
- V2 result
- V3 result
- V4 result
- V5 result
- V6 result
- V7 result, where applicable
- failure reason, if any
- interpretation of the specification
- confidence/ambiguity notes

Also report:

- language/runtime
- dependencies
- implementation approach
- independence statement
- development notes
- synthetic test, if created

## Important neutrality rule

Do not assume that:

- a filename
- a directory name
- an example
- a package ordering
- metadata

represents the normative result.

Determine results from the specification and receipt data.

## Discrepancies

If the implementation produces a result that differs from another reasonable interpretation, report:

- what the implementation did
- what the specification appeared to require
- why that interpretation was chosen

Do not attempt to resolve an ambiguity by consulting MyShape implementation code.

## Evaluation states

Use descriptive states such as:

- reproduced
- not reproduced
- ambiguous
- blocked by missing specification
- implementation error suspected

No score or ranking is required.

## Track scope

Track A evaluates independent receipt verification.

Producer implementation and application-level state/store behavior are outside the primary Track A requirement unless the participant independently chooses to explore them.