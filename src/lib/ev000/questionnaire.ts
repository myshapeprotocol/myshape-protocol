// ============================================================
// EV-000 Questionnaire v1 — pure intake model
//
// A front-end/data-collection layer only. It does NOT become a
// new authority: every vocabulary here is transcribed verbatim
// from EV-000 Evidence Intake Contract v2.1 (§§2–12). Acceptance,
// blocking, verdicts, and final lifecycle remain exclusively the
// contract + Phase-1 implementation's job.
//
// Boundaries enforced by construction:
// - participant answers are whitelisted into the payload; derived
//   fields (verdict / validation_result / acceptance_status /
//   blocked_reason / rejection_reason) are never emitted
// - review is system-generated ("PENDING") at intake
// - evidence_id / submitted_at are system-generated
// - provenance / independence / reproducibility / execution /
//   finding_validity are five independent inputs — nothing is
//   inferred from anything else
// - SUBMITTED ≠ VALIDATED
// ============================================================

// ------------------------------------------------------------
// Vocabularies (Contract v2.1, verbatim)
// ------------------------------------------------------------

export const ARTIFACT_AUTHENTICITY_VALUES = ["PRESENT", "ABSENT", "UNKNOWN"] as const; // §9.1
export type ArtifactAuthenticity = (typeof ARTIFACT_AUTHENTICITY_VALUES)[number];

export const EXECUTION_STATUS_VALUES = [
  "NOT_EXECUTED",
  "ATTEMPTED",
  "EXECUTED",
  "BLOCKED",
  "UNKNOWN",
  "INCONCLUSIVE",
] as const; // §7.1
export type ExecutionStatus = (typeof EXECUTION_STATUS_VALUES)[number];

export const EXECUTION_PROVENANCE_VALUES = [
  "NOT_ESTABLISHED",
  "PLACEHOLDER",
  "ESTABLISHED",
  "PARTIALLY_ESTABLISHED",
  "BLOCKED",
  "UNKNOWN",
] as const; // §9.2
export type ExecutionProvenance = (typeof EXECUTION_PROVENANCE_VALUES)[number];

export const RESULT_OBSERVATION_VALUES = [
  "NOT_OBSERVED",
  "PLACEHOLDER_OBSERVATION",
  "OBSERVED",
  "PARTIALLY_OBSERVED",
  "UNVERIFIED_OBSERVATION",
  "UNKNOWN",
] as const; // §9.3
export type ResultObservation = (typeof RESULT_OBSERVATION_VALUES)[number];

export const FINDING_VALIDITY_VALUES = [
  "UNVERIFIED",
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "DISPUTED",
  "BLOCKED",
  "INCONCLUSIVE",
  "UNKNOWN",
] as const; // §9.4
export type FindingValidity = (typeof FINDING_VALIDITY_VALUES)[number];

export const PROVENANCE_LEVEL_VALUES = [
  "P0",
  "P1",
  "P2",
  "P3",
  "ABSENT",
  "NOT_APPLICABLE",
  "UNKNOWN",
] as const; // §5.1
export type ProvenanceLevel = (typeof PROVENANCE_LEVEL_VALUES)[number];

export const INDEPENDENCE_LEVEL_VALUES = ["L0", "L1", "L2", "L3", "L4", "UNKNOWN"] as const; // §6.1
export type IndependenceLevel = (typeof INDEPENDENCE_LEVEL_VALUES)[number];

export const REPRODUCIBILITY_VALUES = [
  "REPRODUCIBLE",
  "PARTIAL",
  "NOT_REPRODUCIBLE",
  "BLOCKED",
  "NOT_APPLICABLE",
  "UNKNOWN",
] as const; // §8.1
export type Reproducibility = (typeof REPRODUCIBILITY_VALUES)[number];

export const EVIDENCE_STATUS_VALUES = [
  "PENDING",
  "INTAKE_READY",
  "SUBMITTED",
  "VALIDATED",
  "ARCHIVED",
  "DISMISSED",
  "DISPUTED",
  "REJECTED",
  "BLOCKED",
  "INCONCLUSIVE",
] as const; // §4.1 — ACCEPTED deliberately absent (it is not a lifecycle value)
export type EvidenceStatus = (typeof EVIDENCE_STATUS_VALUES)[number];

export const REVIEW_STATUS_VALUES = ["PENDING", "REVIEWED", "DISAGREED"] as const; // §11.1
export type ReviewStatus = (typeof REVIEW_STATUS_VALUES)[number];

export const CONFLICT_TYPE_VALUES = [
  "DEFINITION",
  "METHOD",
  "PROVENANCE",
  "EXECUTION",
  "RESULT",
  "OBSERVATION",
  "INTERPRETATION",
  "ACCESS",
  "REPRODUCIBILITY",
  "AUDIT",
] as const; // §11.3
export type ConflictType = (typeof CONFLICT_TYPE_VALUES)[number];

export const SEARCH_METHOD_OPTIONS = [
  "git grep",
  "file system scan",
  "manual review",
  "agent directory scan",
  "exclusion/inclusion list",
  "keyword search",
] as const; // §12.3 examples (open set — free text allowed)

// §2.1 required fields (20) — payload key contract
export const REQUIRED_FIELDS_V1 = [
  "evidence_id",
  "submitted_at",
  "submission_origin",
  "actor_label",
  "artifact_type_or_class",
  "artifact_id",
  "artifact_uri_or_local_path",
  "artifact_authenticity",
  "artifact_hash",
  "execution_status",
  "execution_provenance",
  "result_observation",
  "finding_validity",
  "provenance_level",
  "independence_level",
  "reproducibility",
  "evidence_status",
  "limitations",
  "review",
  "conflicts",
] as const;

// §12.1 absence fields (7) — limitations is shared with §2.1, so
// ABSENT payloads add exactly 6 keys on top of REQUIRED_FIELDS_V1
export const ABSENCE_FIELDS_V1 = [
  "search_scope",
  "search_method",
  "search_time",
  "search_locations",
  "limitations",
  "absence_rationale",
  "evidence_class",
] as const;
export const ABSENCE_PAYLOAD_EXTRA_KEYS = [
  "search_scope",
  "search_method",
  "search_time",
  "search_locations",
  "absence_rationale",
  "evidence_class",
] as const;

// Fields the questionnaire never sets (implementation/reviewer-derived)
export const RESERVED_DERIVED_FIELDS = [
  "verdict",
  "validation_result",
  "acceptance_status",
  "blocked_reason",
  "rejection_reason",
  "review_disputes",
] as const;

export const QUESTIONNAIRE_VERSION = "ev000-questionnaire-v1";

export const INTRODUCTION_NOTICE =
  "Submission ≠ verification. The answers record what happened and what the submitter claims it means; they are not checked by this form.";

export const SUBMISSION_NOTICE =
  "SUBMITTED ≠ VALIDATED. An evidence submission payload has been created for the EV-000 intake process. " +
  "Creating or sending a submission does not verify the technical claim it contains, and no final " +
  "evidence_status, verdict, validation_result, or acceptance_status is set by this form.";

// ------------------------------------------------------------
// Inputs
// ------------------------------------------------------------

export interface ConflictDeclaration {
  conflict_type: ConflictType;
  conflict_sources: string;
  conflict_content: string;
  resolution: string;
  residual_notes: string;
}

// §11.2 representation — conflict_id is system-generated by the builder
export interface ConflictRecord extends ConflictDeclaration {
  conflict_id: string;
}

export interface AbsenceAuditInput {
  search_scope: string;
  search_method: string[];
  search_time: string;
  search_locations: string[];
  absence_rationale: string;
  evidence_class: string;
}

export interface QuestionnaireInput {
  actor_label: string;
  submission_origin: string;
  artifact_authenticity: ArtifactAuthenticity;
  artifact_type_or_class: string;
  artifact_id: string;
  artifact_uri_or_local_path?: string;
  artifact_hash?: string;
  execution_status: ExecutionStatus;
  execution_provenance: ExecutionProvenance;
  result_observation: ResultObservation;
  finding_validity: FindingValidity;
  provenance_level: ProvenanceLevel;
  independence_level: IndependenceLevel;
  reproducibility: Reproducibility;
  evidence_status: EvidenceStatus;
  limitations: string[];
  conflicts: ConflictDeclaration[];
  absence?: AbsenceAuditInput;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationNotice {
  code: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  notices: ValidationNotice[];
}

export interface EvidencePayload {
  evidence_id: string;
  submitted_at: string;
  submission_origin: string;
  actor_label: string;
  artifact_type_or_class: string;
  artifact_id: string;
  artifact_uri_or_local_path: string | null;
  artifact_authenticity: ArtifactAuthenticity;
  artifact_hash: string | null;
  execution_status: ExecutionStatus;
  execution_provenance: ExecutionProvenance;
  result_observation: ResultObservation;
  finding_validity: FindingValidity;
  provenance_level: ProvenanceLevel;
  independence_level: IndependenceLevel;
  reproducibility: Reproducibility;
  evidence_status: EvidenceStatus;
  limitations: string[];
  review: ReviewStatus;
  conflicts: ConflictRecord[];
  search_scope?: string;
  search_method?: string;
  search_time?: string;
  search_locations?: string[];
  absence_rationale?: string;
  evidence_class?: string;
}

export interface SubmissionResult {
  status: "SUBMITTED";
  questionnaire: typeof QUESTIONNAIRE_VERSION;
  notice: string;
  payload: EvidencePayload;
}

export interface BuildOptions {
  now?: string;
  evidenceId?: string;
}

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/; // §3.1 + lowercase-hex implementation rule
const SEARCH_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/; // §12.4

const BOILERPLATE_LIMITATIONS = ["none", "none declared", "none declared.", "n/a", "no limitations"];

function isMember<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.indexOf(value as T) !== -1;
}

function meaningful(entries: string[]): boolean {
  return entries.some(function (entry) {
    const trimmed = entry.trim();
    if (trimmed.length === 0) return false;
    return BOILERPLATE_LIMITATIONS.indexOf(trimmed.toLowerCase()) === -1;
  });
}

export function validateQuestionnaire(input: QuestionnaireInput): ValidationResult {
  const errors: ValidationError[] = [];
  const notices: ValidationNotice[] = [];

  function fail(field: string, message: string): void {
    errors.push({ field: field, message: message });
  }

  // --- Identity / submission (§2.1) ---
  if (!input.actor_label || input.actor_label.trim().length === 0) {
    fail("actor_label", "actor_label is required (§2.1).");
  }
  if (!input.submission_origin || input.submission_origin.trim().length === 0) {
    fail("submission_origin", "submission_origin must be a source locator (§2.1, §2.2).");
  }

  // --- Artifact (§2, §3) ---
  if (!isMember(input.artifact_authenticity, ARTIFACT_AUTHENTICITY_VALUES)) {
    fail("artifact_authenticity", "artifact_authenticity must be PRESENT, ABSENT, or UNKNOWN (§9.1).");
  }
  if (!input.artifact_id || input.artifact_id.trim().length === 0) {
    fail("artifact_id", "artifact_id is required (§2.1).");
  }
  if (input.artifact_authenticity !== "ABSENT") {
    if (!input.artifact_type_or_class || input.artifact_type_or_class.trim().length === 0) {
      fail("artifact_type_or_class", "artifact_type_or_class is required for a PRESENT/UNKNOWN artifact (§2.1, §3.1).");
    }
  }

  if (input.artifact_authenticity === "PRESENT") {
    // §2.2 / §3.1
    if (!input.artifact_uri_or_local_path || input.artifact_uri_or_local_path.trim().length === 0) {
      fail("artifact_uri_or_local_path", "artifact_uri_or_local_path is required when the artifact is PRESENT (§2.2, §3.1).");
    }
    if (!input.artifact_hash || input.artifact_hash.trim().length === 0) {
      fail("artifact_hash", "artifact_hash is required when the artifact is PRESENT (§2.1, §3.1).");
    } else if (!SHA256_PATTERN.test(input.artifact_hash.trim())) {
      fail("artifact_hash", "artifact_hash must match sha256:<64 lowercase hexadecimal characters> (§3.1).");
    }
  }

  // --- ABSENT audit (§3.2, §12) — ABSENT is first-class ---
  if (input.artifact_authenticity === "ABSENT") {
    const audit = input.absence;
    if (!audit) {
      fail("absence", "absence audit fields are required for ABSENT evidence (§12.1).");
    } else {
      if (!audit.search_scope || audit.search_scope.trim().length === 0) {
        fail("search_scope", "search_scope is required for ABSENT evidence (§12.1, §12.2).");
      }
      if (!audit.search_method || audit.search_method.length === 0 || audit.search_method.join("").trim().length === 0) {
        fail("search_method", "search_method is required for ABSENT evidence (§12.1, §12.3).");
      }
      if (!audit.search_time || !SEARCH_TIME_PATTERN.test(audit.search_time.trim())) {
        fail("search_time", "search_time must be YYYY-MM-DDTHH:MM:SSZ (§12.1, §12.4).");
      }
      if (!audit.search_locations || audit.search_locations.filter(function (l) { return l.trim().length > 0; }).length === 0) {
        fail("search_locations", "search_locations must list the searched locations (§12.1).");
      }
      if (!audit.absence_rationale || audit.absence_rationale.trim().length === 0) {
        fail("absence_rationale", "absence_rationale is required for ABSENT evidence (§12.1, §12.6).");
      }
      if (!audit.evidence_class || audit.evidence_class.trim().length === 0) {
        fail("evidence_class", "evidence_class is required for ABSENT evidence (§12.1); vocabulary is contract-silent free text.");
      }
    }
    if (!input.limitations || input.limitations.length === 0 || !meaningful(input.limitations)) {
      fail("limitations", "ABSENT evidence must document what was missing or inaccessible in limitations (§2.1, §12.5).");
    }
  }

  // --- UNKNOWN: explanation lives in limitations (§3.3) — no unknown_reason field ---
  if (input.artifact_authenticity === "UNKNOWN") {
    if (!input.limitations || input.limitations.length === 0 || !meaningful(input.limitations)) {
      fail("limitations", "UNKNOWN artifact presence must be explained in limitations (§3.3).");
    }
  }

  // --- Execution / observation / quality axes (§§5–9): validated, never inferred ---
  if (!input.execution_status || !isMember(input.execution_status, EXECUTION_STATUS_VALUES)) {
    fail("execution_status", "execution_status must come from §7.1 vocabulary.");
  }
  if (!input.execution_provenance || !isMember(input.execution_provenance, EXECUTION_PROVENANCE_VALUES)) {
    fail("execution_provenance", "execution_provenance must come from §9.2 vocabulary.");
  }
  if (!input.result_observation || !isMember(input.result_observation, RESULT_OBSERVATION_VALUES)) {
    fail("result_observation", "result_observation must come from §9.3 vocabulary.");
  }
  if (!input.finding_validity || !isMember(input.finding_validity, FINDING_VALIDITY_VALUES)) {
    fail("finding_validity", "finding_validity must come from §9.4 vocabulary.");
  }
  if (!input.provenance_level || !isMember(input.provenance_level, PROVENANCE_LEVEL_VALUES)) {
    fail("provenance_level", "provenance_level must come from §5.1 vocabulary.");
  }
  if (!input.independence_level || !isMember(input.independence_level, INDEPENDENCE_LEVEL_VALUES)) {
    fail("independence_level", "independence_level must come from §6.1 vocabulary.");
  }
  if (!input.reproducibility || !isMember(input.reproducibility, REPRODUCIBILITY_VALUES)) {
    fail("reproducibility", "reproducibility must come from §8.1 vocabulary.");
  }

  // --- Lifecycle input (§4.1): participant supplies an INITIAL value only ---
  if (!input.evidence_status || !isMember(input.evidence_status, EVIDENCE_STATUS_VALUES)) {
    fail("evidence_status", "evidence_status must be an initial §4.1 lifecycle value (ACCEPTED is not one); the final value is derived by the EV-000 implementation.");
  }

  // --- Limitations / conflicts (§2.1, §11) ---
  if (!Array.isArray(input.limitations)) {
    fail("limitations", "limitations is required (§2.1).");
  }
  if (!Array.isArray(input.conflicts)) {
    fail("conflicts", "conflicts is required (§2.1); use an empty array when there are none.");
  } else {
    input.conflicts.forEach(function (conflict, index) {
      if (!conflict.conflict_type || !isMember(conflict.conflict_type, CONFLICT_TYPE_VALUES)) {
        fail("conflicts[" + index + "].conflict_type", "conflict_type must come from §11.3 vocabulary.");
      }
      if (!conflict.conflict_content || conflict.conflict_content.trim().length === 0) {
        fail("conflicts[" + index + "].conflict_content", "conflict_content must record the substance of the conflict (§11.2).");
      }
    });
  }

  // --- Informational notices: the questionnaire never pre-blocks (§14.2 stays authoritative) ---
  if (input.execution_status === "EXECUTED" &&
      (input.execution_provenance === "NOT_ESTABLISHED" || input.execution_provenance === "PLACEHOLDER")) {
    notices.push({
      code: "EXECUTED_WITHOUT_PROVENANCE",
      message: "Note: EXECUTED with NOT_ESTABLISHED/PLACEHOLDER provenance is a §14.2 forbidden combination; the EV-000 implementation records it as BLOCKED with a reason. Submission is still allowed here.",
    });
  }
  if (input.provenance_level === "P3") {
    notices.push({
      code: "P3_NO_PROMOTION",
      message: "Note: P3 historical claims remain P3/NEEDS_SOURCE with no automatic promotion (§5.4); INTAKE_READY with P3 is a §14.2 forbidden combination. Submission is still allowed here.",
    });
  }

  return { errors: errors, notices: notices };
}

// ------------------------------------------------------------
// Payload construction (whitelist — only declared fields enter)
// ------------------------------------------------------------

function generateEvidenceId(nowMs: number): string {
  const stamp = nowMs.toString(36);
  const suffix = Math.random().toString(36).slice(2, 6);
  return "E-Q1-" + stamp + "-" + suffix;
}

export function buildIntakePayload(input: QuestionnaireInput, options?: BuildOptions): SubmissionResult {
  const validation = validateQuestionnaire(input);
  if (validation.errors.length > 0) {
    const detail = validation.errors.map(function (e) { return e.field + ": " + e.message; }).join(" | ");
    throw new Error("questionnaire input is not submittable — " + detail);
  }

  const nowMs = Date.now();
  const submittedAt = options && options.now ? options.now : new Date(nowMs).toISOString();
  const evidenceId = options && options.evidenceId ? options.evidenceId : generateEvidenceId(nowMs);

  const isAbsent = input.artifact_authenticity === "ABSENT";
  const isUnknown = input.artifact_authenticity === "UNKNOWN";

  // System-set nulls mandated by §2.2 / §3.2 / §3.3 — participant values are overridden.
  const uri = input.artifact_authenticity === "PRESENT"
    ? (input.artifact_uri_or_local_path || "").trim()
    : null;
  const hash = input.artifact_authenticity === "PRESENT"
    ? (input.artifact_hash || "").trim()
    : null;

  const payload: EvidencePayload = {
    evidence_id: evidenceId,
    submitted_at: submittedAt,
    submission_origin: input.submission_origin.trim(),
    actor_label: input.actor_label.trim(),
    artifact_type_or_class: isAbsent ? "ABSENT" : input.artifact_type_or_class.trim(),
    artifact_id: input.artifact_id.trim(),
    artifact_uri_or_local_path: uri,
    artifact_authenticity: input.artifact_authenticity,
    artifact_hash: hash,
    execution_status: input.execution_status,
    execution_provenance: input.execution_provenance,
    result_observation: input.result_observation,
    finding_validity: input.finding_validity,
    provenance_level: input.provenance_level,
    independence_level: input.independence_level,
    reproducibility: input.reproducibility,
    evidence_status: input.evidence_status,
    limitations: input.limitations.map(function (entry) { return entry.trim(); }),
    review: "PENDING", // §11.1 — system-generated at intake, not participant-settable
    conflicts: input.conflicts.map(function (conflict, index) {
      return {
        conflict_id: "C-Q1-" + (index + 1), // system-generated (§11.2)
        conflict_type: conflict.conflict_type,
        conflict_sources: (conflict.conflict_sources || "").trim(),
        conflict_content: conflict.conflict_content.trim(),
        resolution: (conflict.resolution || "").trim(),
        residual_notes: (conflict.residual_notes || "").trim(),
      };
    }),
  };

  if (isAbsent && input.absence) {
    payload.search_scope = input.absence.search_scope.trim();
    payload.search_method = input.absence.search_method
      .map(function (m) { return m.trim(); })
      .filter(function (m) { return m.length > 0; })
      .join(" + ");
    payload.search_time = input.absence.search_time.trim();
    payload.search_locations = input.absence.search_locations
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });
    payload.absence_rationale = input.absence.absence_rationale.trim();
    payload.evidence_class = input.absence.evidence_class.trim();
  }

  return {
    status: "SUBMITTED",
    questionnaire: QUESTIONNAIRE_VERSION,
    notice: SUBMISSION_NOTICE,
    payload: payload,
  };
}
