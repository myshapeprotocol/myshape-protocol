// ============================================================
// EV-000 Questionnaire v1 — dedicated Questionnaire Test Gate
//
// Covers STEP 12 checks 1–35 against the pure questionnaire
// model. Deterministic: every build injects now/evidenceId.
//
// Isolation rules (STEP 13): this gate does not touch Phase-1
// implementation, CPS-0001, canonical harnesses, or Finding 3.
// Known deferred issues are classified, never "fixed" here.
// ============================================================

import { describe, expect, it } from "vitest";
import {
  ABSENCE_FIELDS_V1,
  ABSENCE_PAYLOAD_EXTRA_KEYS,
  ARTIFACT_AUTHENTICITY_VALUES,
  CONFLICT_TYPE_VALUES,
  EVIDENCE_STATUS_VALUES,
  EXECUTION_PROVENANCE_VALUES,
  EXECUTION_STATUS_VALUES,
  FINDING_VALIDITY_VALUES,
  INDEPENDENCE_LEVEL_VALUES,
  INTRODUCTION_NOTICE,
  PROVENANCE_LEVEL_VALUES,
  REPRODUCIBILITY_VALUES,
  REQUIRED_FIELDS_V1,
  RESULT_OBSERVATION_VALUES,
  SUBMISSION_NOTICE,
  buildIntakePayload,
  validateQuestionnaire,
  type ConflictDeclaration,
  type QuestionnaireInput,
} from "@/lib/ev000/questionnaire";

const SHA256 = "sha256:" + "a".repeat(64);
const FIXED_NOW = "2026-10-07T00:00:00.000Z";
const FIXED_ID = "E-Q1-TEST-FIXED";

function basePresent(overrides?: Partial<QuestionnaireInput>): QuestionnaireInput {
  return {
    actor_label: "tester",
    submission_origin: "repo://test/evidence-001",
    artifact_authenticity: "PRESENT",
    artifact_type_or_class: "report",
    artifact_id: "ART-001",
    artifact_uri_or_local_path: "artifacts/report.md",
    artifact_hash: SHA256,
    execution_status: "ATTEMPTED",
    execution_provenance: "PARTIALLY_ESTABLISHED",
    result_observation: "OBSERVED",
    finding_validity: "UNVERIFIED",
    provenance_level: "P1",
    independence_level: "L1",
    reproducibility: "PARTIAL",
    limitations: ["none declared"],
    conflicts: [],
    ...overrides,
  };
}

function baseAbsent(overrides?: Partial<QuestionnaireInput>): QuestionnaireInput {
  return {
    actor_label: "tester",
    submission_origin: "repo://test/evidence-absent",
    artifact_authenticity: "ABSENT",
    artifact_type_or_class: "ABSENT",
    artifact_id: "ABSENT-001",
    artifact_uri_or_local_path: null as unknown as undefined, // builder must null it anyway
    artifact_hash: null as unknown as undefined,
    execution_status: "NOT_EXECUTED",
    execution_provenance: "NOT_ESTABLISHED",
    result_observation: "NOT_OBSERVED",
    finding_validity: "UNVERIFIED",
    provenance_level: "P0",
    independence_level: "L0",
    reproducibility: "NOT_APPLICABLE",
    limitations: ["no artifact located in searched scopes; what was missing could not be found"],
    conflicts: [],
    absence: {
      search_scope: "repo tree, docs/, temp/artifacts",
      search_method: ["git grep", "file system scan"],
      search_time: "2026-10-07T00:00:00Z",
      search_locations: ["docs/", "temp/artifacts"],
      absence_rationale: "No artifact exists in searched locations; absence is recorded as a record, not as proof of non-existence.",
      evidence_class: "ABSENT",
    },
    ...overrides,
  };
}

function baseUnknown(overrides?: Partial<QuestionnaireInput>): QuestionnaireInput {
  return basePresent({
    artifact_authenticity: "UNKNOWN",
    artifact_uri_or_local_path: null as unknown as undefined,
    artifact_hash: null as unknown as undefined,
    limitations: ["presence could not be determined: searched systems were inaccessible"],
    ...overrides,
  });
}

function build(input: QuestionnaireInput) {
  return buildIntakePayload(input, { now: FIXED_NOW, evidenceId: FIXED_ID });
}

function errorFields(input: QuestionnaireInput): string[] {
  return validateQuestionnaire(input).errors.map(function (e) { return e.field; });
}

const conflictFixture: ConflictDeclaration = {
  conflict_type: "METHOD",
  conflict_sources: "report A vs report B",
  conflict_content: "different command lines used",
  resolution: "",
  residual_notes: "",
};

// ------------------------------------------------------------
// Core paths (1–3)
// ------------------------------------------------------------
describe("Questionnaire core submission paths", () => {
  it("1. PRESENT submission succeeds", () => {
    const result = build(basePresent());
    expect(result.status).toBe("SUBMITTED");
    expect(result.payload.artifact_authenticity).toBe("PRESENT");
    expect(result.payload.artifact_uri_or_local_path).toBe("artifacts/report.md");
    expect(result.payload.artifact_hash).toBe(SHA256);
  });

  it("2. ABSENT submission succeeds and carries the audit", () => {
    const result = build(baseAbsent());
    expect(result.status).toBe("SUBMITTED");
    expect(result.payload.search_scope).toBeTruthy();
    expect(result.payload.evidence_class).toBe("ABSENT");
  });

  it("3. UNKNOWN submission succeeds with null artifact fields", () => {
    const result = build(baseUnknown());
    expect(result.status).toBe("SUBMITTED");
    expect(result.payload.artifact_uri_or_local_path).toBeNull();
    expect(result.payload.artifact_hash).toBeNull();
  });
});

// ------------------------------------------------------------
// Negative evidence (4–9)
// ------------------------------------------------------------
describe("Negative / non-ideal result paths are submittable", () => {
  it("4. NOT_EXECUTED accepted", () => {
    expect(build(basePresent({ execution_status: "NOT_EXECUTED" })).payload.execution_status).toBe("NOT_EXECUTED");
  });

  it("5. ATTEMPTED accepted", () => {
    expect(build(basePresent({ execution_status: "ATTEMPTED" })).payload.execution_status).toBe("ATTEMPTED");
  });

  it("6. BLOCKED execution accepted", () => {
    expect(build(basePresent({ execution_status: "BLOCKED" })).payload.execution_status).toBe("BLOCKED");
  });

  it("7. INCONCLUSIVE execution accepted", () => {
    expect(build(basePresent({ execution_status: "INCONCLUSIVE" })).payload.execution_status).toBe("INCONCLUSIVE");
  });

  it("8. NOT_REPRODUCIBLE accepted", () => {
    expect(build(basePresent({ reproducibility: "NOT_REPRODUCIBLE" })).payload.reproducibility).toBe("NOT_REPRODUCIBLE");
  });

  it("9. UNVERIFIED finding accepted", () => {
    expect(build(basePresent({ finding_validity: "UNVERIFIED" })).payload.finding_validity).toBe("UNVERIFIED");
  });
});

// ------------------------------------------------------------
// Conditional validation (10–16)
// ------------------------------------------------------------
describe("Conditional validation", () => {
  it("10. PRESENT without URI is rejected", () => {
    expect(errorFields(basePresent({ artifact_uri_or_local_path: "" }))).toContain("artifact_uri_or_local_path");
  });

  it("11. PRESENT without hash is rejected", () => {
    expect(errorFields(basePresent({ artifact_hash: "" }))).toContain("artifact_hash");
  });

  it("12. malformed SHA-256 is rejected", () => {
    for (const bad of ["sha256:XYZ", "sha256:" + "A".repeat(64), SHA256.slice(0, -1), "abc"]) {
      expect(errorFields(basePresent({ artifact_hash: bad }))).toContain("artifact_hash");
    }
  });

  it("13. ABSENT with participant URI is reset to null", () => {
    const input = baseAbsent();
    input.artifact_uri_or_local_path = "should/be/dropped";
    expect(build(input).payload.artifact_uri_or_local_path).toBeNull();
  });

  it("14. ABSENT with participant hash is reset to null", () => {
    const input = baseAbsent();
    input.artifact_hash = SHA256;
    expect(build(input).payload.artifact_hash).toBeNull();
  });

  it("15. UNKNOWN without an explanation in limitations is rejected", () => {
    expect(errorFields(baseUnknown({ limitations: [] }))).toContain("limitations");
    expect(errorFields(baseUnknown({ limitations: ["none declared"] }))).toContain("limitations");
  });

  it("16. ABSENT missing any §12.1 audit field is rejected", () => {
    const cases: Array<[string, QuestionnaireInput]> = [
      ["no absence block", baseAbsent({ absence: undefined })],
      ["no search_scope", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), search_scope: "" } })],
      ["no search_method", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), search_method: [] } })],
      ["no search_time", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), search_time: "not-a-timestamp" } })],
      ["no search_locations", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), search_locations: [] } })],
      ["no absence_rationale", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), absence_rationale: "" } })],
      ["no evidence_class", baseAbsent({ absence: { ...(baseAbsent().absence as NonNullable<QuestionnaireInput["absence"]>), evidence_class: "" } })],
      ["no limitations", baseAbsent({ limitations: [] })],
    ];
    for (const [label, input] of cases) {
      expect(validateQuestionnaire(input).errors.length, label).toBeGreaterThan(0);
    }
  });
});

// ------------------------------------------------------------
// Orthogonality (17–20)
// ------------------------------------------------------------
describe("Quality axes are independent", () => {
  it("17. changing provenance does not change independence", () => {
    const a = build(basePresent({ provenance_level: "P0" })).payload;
    const b = build(basePresent({ provenance_level: "P3" })).payload;
    expect(a.provenance_level).not.toBe(b.provenance_level);
    expect(a.independence_level).toBe(b.independence_level);
  });

  it("18. changing independence does not change reproducibility", () => {
    const a = build(basePresent({ independence_level: "L0" })).payload;
    const b = build(basePresent({ independence_level: "L4" })).payload;
    expect(a.independence_level).not.toBe(b.independence_level);
    expect(a.reproducibility).toBe(b.reproducibility);
  });

  it("19. changing reproducibility does not change finding_validity", () => {
    const a = build(basePresent({ reproducibility: "REPRODUCIBLE" })).payload;
    const b = build(basePresent({ reproducibility: "NOT_REPRODUCIBLE" })).payload;
    expect(a.reproducibility).not.toBe(b.reproducibility);
    expect(a.finding_validity).toBe(b.finding_validity);
  });

  it("20. changing execution_status does not auto-change finding_validity", () => {
    const a = build(basePresent({ execution_status: "EXECUTED" })).payload;
    const b = build(basePresent({ execution_status: "NOT_EXECUTED" })).payload;
    expect(a.execution_status).not.toBe(b.execution_status);
    expect(a.finding_validity).toBe(b.finding_validity);
  });
});

// ------------------------------------------------------------
// Forbidden combinations are submitted, not pre-blocked (21–23)
// ------------------------------------------------------------
describe("Questionnaire does not pre-block §14.2 combinations", () => {
  it("21. EXECUTED + NOT_ESTABLISHED can be submitted (notice only)", () => {
    const input = basePresent({
      execution_status: "EXECUTED",
      execution_provenance: "NOT_ESTABLISHED",
    });
    const validation = validateQuestionnaire(input);
    expect(validation.errors).toHaveLength(0);
    expect(validation.notices.map(function (n) { return n.code; })).toContain("EXECUTED_WITHOUT_PROVENANCE");
    expect(build(input).payload.execution_provenance).toBe("NOT_ESTABLISHED");
  });

  it("22. P3 can be submitted (notice only)", () => {
    const input = basePresent({ provenance_level: "P3" });
    const validation = validateQuestionnaire(input);
    expect(validation.errors).toHaveLength(0);
    expect(validation.notices.map(function (n) { return n.code; })).toContain("P3_NO_PROMOTION");
    expect(build(input).payload.provenance_level).toBe("P3");
  });

  it("23. neither case is pre-blocked by the questionnaire", () => {
    const executed = basePresent({
      execution_status: "EXECUTED",
      execution_provenance: "NOT_ESTABLISHED",
      provenance_level: "P3",
    });
    expect(validateQuestionnaire(executed).errors).toHaveLength(0);
    expect(build(executed).status).toBe("SUBMITTED");
  });
});

// ------------------------------------------------------------
// System-field protection (24–29)
// ------------------------------------------------------------
describe("System-generated and derived fields are protected", () => {
  it("24. participant cannot override evidence_id", () => {
    const spoofed = { ...basePresent(), evidence_id: "HACKED-ID" } as unknown as QuestionnaireInput;
    expect(build(spoofed).payload.evidence_id).toBe(FIXED_ID);
    expect(build(spoofed).payload.evidence_id).not.toBe("HACKED-ID");
  });

  it("25. participant cannot override submitted_at", () => {
    const spoofed = { ...basePresent(), submitted_at: "1999-01-01T00:00:00Z" } as unknown as QuestionnaireInput;
    expect(build(spoofed).payload.submitted_at).toBe(FIXED_NOW);
  });

  it("26. evidence_status is system-derived — participant-supplied values are rejected", () => {
    const validation = validateQuestionnaire({
      ...basePresent(),
      evidence_status: "ACCEPTED",
    } as unknown as QuestionnaireInput);
    expect(validation.errors.map(function (e) { return e.field; })).toContain("evidence_status");
    // the system sets the §4.1 initial state — the FINAL value stays derived by the implementation
    expect(build(basePresent()).payload.evidence_status).toBe("PENDING");
  });

  it("27. participant cannot set verdict", () => {
    const spoofed = { ...basePresent(), verdict: "ACCEPTED" } as unknown as QuestionnaireInput;
    expect(Object.keys(build(spoofed).payload)).not.toContain("verdict");
  });

  it("28. participant cannot set validation_result", () => {
    const spoofed = { ...basePresent(), validation_result: "ACCEPTED" } as unknown as QuestionnaireInput;
    expect(Object.keys(build(spoofed).payload)).not.toContain("validation_result");
  });

  it("29. participant cannot set acceptance_status (and review stays system PENDING)", () => {
    const spoofed = {
      ...basePresent(),
      acceptance_status: "ACCEPTED",
      review: "REVIEWED",
      blocked_reason: ["x"],
      rejection_reason: ["x"],
    } as unknown as QuestionnaireInput;
    const payload = build(spoofed).payload;
    expect(Object.keys(payload)).not.toContain("acceptance_status");
    expect(Object.keys(payload)).not.toContain("blocked_reason");
    expect(Object.keys(payload)).not.toContain("rejection_reason");
    expect(payload.review).toBe("PENDING");
  });

  it("36. participant-supplied non-PENDING lifecycle values never reach the payload", () => {
    const injected = ["VALIDATED", "ARCHIVED", "REJECTED", "ACCEPTED"];
    for (const value of injected) {
      const spoofed = { ...basePresent(), evidence_status: value } as unknown as QuestionnaireInput;
      expect(errorFields(spoofed)).toContain("evidence_status");
      expect(function () { build(spoofed); }).toThrow();
    }
    // clean inputs: the payload carries only the system-derived initial state
    expect(build(basePresent()).payload.evidence_status).toBe("PENDING");
    expect(build(baseAbsent()).payload.evidence_status).toBe("PENDING");
    expect(build(baseUnknown()).payload.evidence_status).toBe("PENDING");
  });
});

// ------------------------------------------------------------
// Semantic boundary (30)
// ------------------------------------------------------------
describe("Semantic boundary", () => {
  it("30. successful submission claims no technical verification", () => {
    expect(INTRODUCTION_NOTICE).toContain("Submission ≠ verification");
    expect(INTRODUCTION_NOTICE).toContain(
      "The answers record what happened and what the submitter claims it means; they are not checked by this form."
    );
    const result = build(basePresent());
    expect(result.status).toBe("SUBMITTED");
    expect(result.notice).toContain("SUBMITTED ≠ VALIDATED");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('"verified":true');
    expect(serialized).not.toContain('"validated":true');
    expect(serialized).not.toMatch(/"verdict"\s*:/);
    expect(serialized).not.toMatch(/"validation_result"\s*:/);
    expect(serialized).not.toMatch(/"acceptance_status"\s*:/);
  });
});

// ------------------------------------------------------------
// Payload integrity (31–35)
// ------------------------------------------------------------
describe("Payload integrity", () => {
  it("31. payload contains every §2.1 required field", () => {
    for (const input of [basePresent(), baseAbsent(), baseUnknown()]) {
      const keys = Object.keys(build(input).payload);
      for (const field of REQUIRED_FIELDS_V1) {
        expect(keys, "missing " + field).toContain(field);
      }
    }
  });

  it("32. ABSENT payload contains all §12.1 audit fields", () => {
    const keys = Object.keys(build(baseAbsent()).payload);
    for (const field of ABSENCE_FIELDS_V1) {
      expect(keys, "missing " + field).toContain(field);
    }
  });

  it("33. UNKNOWN payload has URI and hash null", () => {
    const payload = build(baseUnknown()).payload;
    expect(payload.artifact_uri_or_local_path).toBeNull();
    expect(payload.artifact_hash).toBeNull();
  });

  it("34. PRESENT payload contains non-null URI and hash", () => {
    const payload = build(basePresent()).payload;
    expect(payload.artifact_uri_or_local_path).toBe("artifacts/report.md");
    expect(payload.artifact_hash).toBe(SHA256);
  });

  it("35. no undeclared questionnaire-only vocabulary enters the payload", () => {
    const allowed = new Set<string>([...REQUIRED_FIELDS_V1, ...ABSENCE_PAYLOAD_EXTRA_KEYS, "conflict_id"]);
    const presentKeys = Object.keys(build(basePresent()).payload);
    const absentKeys = Object.keys(build(baseAbsent()).payload);
    for (const key of [...presentKeys, ...absentKeys]) {
      expect(allowed.has(key), "unexpected payload key: " + key).toBe(true);
    }
    // PRESENT carries exactly the 20 §2.1 fields — nothing more
    expect(presentKeys.sort()).toEqual([...REQUIRED_FIELDS_V1].sort());
    // ABSENT adds exactly the 6 non-shared §12.1 keys
    expect(absentKeys.length).toBe(REQUIRED_FIELDS_V1.length + ABSENCE_PAYLOAD_EXTRA_KEYS.length);
  });
});

// ------------------------------------------------------------
// Contract-vocabulary sync guards
// ------------------------------------------------------------
describe("Vocabulary transcription guards (Contract v2.1)", () => {
  it("§4.1 lifecycle has 10 values and never includes ACCEPTED", () => {
    expect(EVIDENCE_STATUS_VALUES).toHaveLength(10);
    expect(EVIDENCE_STATUS_VALUES).not.toContain("ACCEPTED");
  });

  it("every axis vocabulary matches its contract section size", () => {
    expect(ARTIFACT_AUTHENTICITY_VALUES).toHaveLength(3);
    expect(EXECUTION_STATUS_VALUES).toHaveLength(6);
    expect(EXECUTION_PROVENANCE_VALUES).toHaveLength(6);
    expect(RESULT_OBSERVATION_VALUES).toHaveLength(6);
    expect(FINDING_VALIDITY_VALUES).toHaveLength(7);
    expect(PROVENANCE_LEVEL_VALUES).toHaveLength(7);
    expect(INDEPENDENCE_LEVEL_VALUES).toHaveLength(6);
    expect(REPRODUCIBILITY_VALUES).toHaveLength(6);
    expect(CONFLICT_TYPE_VALUES).toHaveLength(10);
  });

  it("ABSENT payload forces artifact_type_or_class to ABSENT (§3.2)", () => {
    const input = baseAbsent({ artifact_type_or_class: "report" });
    expect(build(input).payload.artifact_type_or_class).toBe("ABSENT");
  });

  it("a complete ABSENT submission remains submittable (Finding 3 stays deferred — questionnaire claims no outcome)", () => {
    const result = build(baseAbsent());
    expect(result.status).toBe("SUBMITTED");
    expect(result.notice).toContain("SUBMITTED ≠ VALIDATED");
  });
});
