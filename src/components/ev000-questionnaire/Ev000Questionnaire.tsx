"use client";

// ============================================================
// EV-000 Questionnaire v1 — minimal usable intake form
//
// Presentation only: it collects answers, runs the shared
// questionnaire validation, and builds a Contract v2.1 payload.
// It performs no verification, sets no final status, and stores
// or transmits nothing by itself.
// ============================================================

import { useState, type JSX } from "react";
import {
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
  RESULT_OBSERVATION_VALUES,
  SEARCH_METHOD_OPTIONS,
  SUBMISSION_NOTICE,
  buildIntakePayload,
  validateQuestionnaire,
  type ArtifactAuthenticity,
  type ConflictType,
  type EvidenceStatus,
  type ExecutionProvenance,
  type ExecutionStatus,
  type FindingValidity,
  type IndependenceLevel,
  type ProvenanceLevel,
  type QuestionnaireInput,
  type Reproducibility,
  type ResultObservation,
  type SubmissionResult,
  type ValidationError,
  type ValidationNotice,
} from "@/lib/ev000/questionnaire";

const STEPS = [
  "Introduction",
  "Submission Context",
  "Artifact",
  "Execution",
  "Observation",
  "Provenance / Independence",
  "Reproducibility",
  "Limitations / Conflicts",
  "Review Declaration",
  "Submit",
] as const;

const labelCls = "block text-sm font-medium mb-1";
const inputCls =
  "w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-500";
const hintCls = "text-xs text-neutral-500 mt-1";
const sectionCls = "space-y-4";

interface ConflictDraft {
  conflict_type: string;
  conflict_sources: string;
  conflict_content: string;
  resolution: string;
  residual_notes: string;
}

interface AbsenceDraft {
  search_scope: string;
  search_method: string[];
  search_method_extra: string;
  search_time: string;
  search_locations_text: string;
  absence_rationale: string;
  evidence_class: string;
}

interface Draft {
  actor_label: string;
  submission_origin: string;
  evidence_status: string;
  artifact_authenticity: string;
  artifact_type_or_class: string;
  artifact_id: string;
  artifact_uri_or_local_path: string;
  artifact_hash: string;
  execution_status: string;
  execution_provenance: string;
  result_observation: string;
  finding_validity: string;
  provenance_level: string;
  independence_level: string;
  reproducibility: string;
  limitations_text: string;
  conflicts: ConflictDraft[];
  absence: AbsenceDraft;
}

const EMPTY_CONFLICT: ConflictDraft = {
  conflict_type: "",
  conflict_sources: "",
  conflict_content: "",
  resolution: "",
  residual_notes: "",
};

const INITIAL_DRAFT: Draft = {
  actor_label: "",
  submission_origin: "",
  evidence_status: "PENDING",
  artifact_authenticity: "",
  artifact_type_or_class: "",
  artifact_id: "",
  artifact_uri_or_local_path: "",
  artifact_hash: "",
  execution_status: "",
  execution_provenance: "",
  result_observation: "",
  finding_validity: "",
  provenance_level: "",
  independence_level: "",
  reproducibility: "",
  limitations_text: "",
  conflicts: [],
  absence: {
    search_scope: "",
    search_method: [],
    search_method_extra: "",
    search_time: "",
    search_locations_text: "",
    absence_rationale: "",
    evidence_class: "",
  },
};

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line.length > 0; });
}

function toInput(draft: Draft): QuestionnaireInput {
  const isAbsent = draft.artifact_authenticity === "ABSENT";
  const methods = draft.absence.search_method.slice();
  if (draft.absence.search_method_extra.trim().length > 0) {
    methods.push(draft.absence.search_method_extra.trim());
  }

  const conflicts: Array<{
    conflict_type: ConflictType;
    conflict_sources: string;
    conflict_content: string;
    resolution: string;
    residual_notes: string;
  }> = draft.conflicts
    .filter(function (c) { return c.conflict_type.length > 0 && c.conflict_content.trim().length > 0; })
    .map(function (c) {
      return {
        conflict_type: c.conflict_type as ConflictType,
        conflict_sources: c.conflict_sources,
        conflict_content: c.conflict_content,
        resolution: c.resolution,
        residual_notes: c.residual_notes,
      };
    });

  return {
    actor_label: draft.actor_label,
    submission_origin: draft.submission_origin,
    artifact_authenticity: draft.artifact_authenticity as ArtifactAuthenticity,
    artifact_type_or_class: draft.artifact_type_or_class,
    artifact_id: draft.artifact_id,
    artifact_uri_or_local_path: draft.artifact_uri_or_local_path.trim() || undefined,
    artifact_hash: draft.artifact_hash.trim() || undefined,
    execution_status: draft.execution_status as ExecutionStatus,
    execution_provenance: draft.execution_provenance as ExecutionProvenance,
    result_observation: draft.result_observation as ResultObservation,
    finding_validity: draft.finding_validity as FindingValidity,
    provenance_level: draft.provenance_level as ProvenanceLevel,
    independence_level: draft.independence_level as IndependenceLevel,
    reproducibility: draft.reproducibility as Reproducibility,
    evidence_status: draft.evidence_status as EvidenceStatus,
    limitations: splitLines(draft.limitations_text),
    conflicts: conflicts,
    absence: isAbsent
      ? {
          search_scope: draft.absence.search_scope,
          search_method: methods,
          search_time: draft.absence.search_time.trim(),
          search_locations: splitLines(draft.absence.search_locations_text),
          absence_rationale: draft.absence.absence_rationale,
          evidence_class: draft.absence.evidence_class,
        }
      : undefined,
  };
}

interface EnumSelectProps<T extends string> {
  label: string;
  value: string;
  options: readonly T[];
  onChange: (value: string) => void;
  allowEmpty?: boolean;
}

function EnumSelect<T extends string>(props: EnumSelectProps<T>): JSX.Element {
  return (
    <div>
      <label className={labelCls}>{props.label}</label>
      <select className={inputCls} value={props.value} onChange={function (e) { props.onChange(e.target.value); }}>
        {props.allowEmpty !== false && <option value="">— select —</option>}
        {props.options.map(function (option) {
          return (
            <option key={option} value={option}>
              {option}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default function Ev000Questionnaire(): JSX.Element {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [notices, setNotices] = useState<ValidationNotice[]>([]);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const isAbsent = draft.artifact_authenticity === "ABSENT";
  const isUnknown = draft.artifact_authenticity === "UNKNOWN";

  function patch(partial: Partial<Draft>): void {
    setDraft(function (prev) { return { ...prev, ...partial }; });
  }

  function patchAbsence(partial: Partial<AbsenceDraft>): void {
    setDraft(function (prev) {
      return { ...prev, absence: { ...prev.absence, ...partial } };
    });
  }

  function currentNotices(): ValidationNotice[] {
    return validateQuestionnaire(toInput(draft)).notices;
  }

  function handleNext(): void {
    setStep(function (prev) { return Math.min(prev + 1, STEPS.length - 1); });
  }

  function handlePrev(): void {
    setStep(function (prev) { return Math.max(prev - 1, 0); });
  }

  function handleSubmit(): void {
    const input = toInput(draft);
    const validation = validateQuestionnaire(input);
    setErrors(validation.errors);
    setNotices(validation.notices);
    if (validation.errors.length === 0) {
      setResult(buildIntakePayload(input));
      setStep(STEPS.length - 1);
    } else {
      setResult(null);
    }
  }

  function reset(): void {
    setDraft(INITIAL_DRAFT);
    setErrors([]);
    setNotices([]);
    setResult(null);
    setStep(0);
  }

  function renderStep(): JSX.Element {
    switch (step) {
      case 0:
        return (
          <div className={sectionCls}>
            <p className="text-sm">{INTRODUCTION_NOTICE}</p>
            <ul className="text-sm list-disc pl-5 space-y-1 text-neutral-600">
              <li>Answer with what you actually observed — failed, blocked, and inconclusive results are all valid submissions.</li>
              <li>No personal identification is required: choose your own actor label.</li>
              <li>Every answer maps to one Contract v2.1 field; nothing is inferred from anything else.</li>
            </ul>
          </div>
        );
      case 1:
        return (
          <div className={sectionCls}>
            <div>
              <label className={labelCls}>Actor label (your chosen handle) *</label>
              <input
                className={inputCls}
                value={draft.actor_label}
                onChange={function (e) { patch({ actor_label: e.target.value }); }}
                placeholder="e.g. external-researcher-01"
              />
            </div>
            <div>
              <label className={labelCls}>Submission origin (source locator) *</label>
              <input
                className={inputCls}
                value={draft.submission_origin}
                onChange={function (e) { patch({ submission_origin: e.target.value }); }}
                placeholder="URL, repo path, DOI, or archive link"
              />
              <p className={hintCls}>A real source locator for this evidence (Contract §2.2).</p>
            </div>
            <EnumSelect
              label="Initial evidence_status (§4.1) — final value is derived by the implementation"
              value={draft.evidence_status}
              options={EVIDENCE_STATUS_VALUES}
              onChange={function (value) { patch({ evidence_status: value }); }}
              allowEmpty={false}
            />
          </div>
        );
      case 2:
        return (
          <div className={sectionCls}>
            <EnumSelect
              label="Does the artifact exist? (artifact_authenticity) *"
              value={draft.artifact_authenticity}
              options={ARTIFACT_AUTHENTICITY_VALUES}
              onChange={function (value) { patch({ artifact_authenticity: value }); }}
            />
            <div>
              <label className={labelCls}>Artifact identifier (artifact_id) *</label>
              <input
                className={inputCls}
                value={draft.artifact_id}
                onChange={function (e) { patch({ artifact_id: e.target.value }); }}
                placeholder="e.g. ART-001"
              />
            </div>

            {draft.artifact_authenticity === "PRESENT" && (
              <div className="space-y-4 border border-neutral-200 rounded p-4">
                <div>
                  <label className={labelCls}>Artifact class (artifact_type_or_class) *</label>
                  <input
                    className={inputCls}
                    value={draft.artifact_type_or_class}
                    onChange={function (e) { patch({ artifact_type_or_class: e.target.value }); }}
                    placeholder="e.g. report, log, transcript"
                  />
                </div>
                <div>
                  <label className={labelCls}>Artifact URI / path *</label>
                  <input
                    className={inputCls}
                    value={draft.artifact_uri_or_local_path}
                    onChange={function (e) { patch({ artifact_uri_or_local_path: e.target.value }); }}
                    placeholder="https://… or repo://… or path"
                  />
                </div>
                <div>
                  <label className={labelCls}>Artifact hash (artifact_hash) *</label>
                  <input
                    className={inputCls}
                    value={draft.artifact_hash}
                    onChange={function (e) { patch({ artifact_hash: e.target.value }); }}
                    placeholder="sha256:0123456789abcdef… (64 lowercase hex)"
                  />
                  <p className={hintCls}>Format: sha256: followed by exactly 64 lowercase hexadecimal characters (§3.1).</p>
                </div>
              </div>
            )}

            {isUnknown && (
              <div className="space-y-2 border border-neutral-200 rounded p-4">
                <div>
                  <label className={labelCls}>Artifact class (artifact_type_or_class) *</label>
                  <input
                    className={inputCls}
                    value={draft.artifact_type_or_class}
                    onChange={function (e) { patch({ artifact_type_or_class: e.target.value }); }}
                  />
                </div>
                <div>
                  <label className={labelCls}>Why is presence UNKNOWN? (stored in limitations) *</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={draft.limitations_text}
                    onChange={function (e) { patch({ limitations_text: e.target.value }); }}
                    placeholder="Explain why presence could not be determined (Contract §3.3). This answer is stored in the existing limitations field."
                  />
                </div>
              </div>
            )}

            {isAbsent && (
              <div className="space-y-4 border border-neutral-200 rounded p-4 bg-neutral-50">
                <p className="text-sm">
                  ABSENT evidence is a first-class submission: URI and hash are set to <code>null</code> and
                  artifact_type_or_class is fixed to <code>ABSENT</code> (§3.2). An absence record documents a
                  scoped search — it does not prove non-existence.
                </p>
                <div>
                  <label className={labelCls}>What was searched? (search_scope) *</label>
                  <input
                    className={inputCls}
                    value={draft.absence.search_scope}
                    onChange={function (e) { patchAbsence({ search_scope: e.target.value }); }}
                    placeholder="what is being searched, which systems/artifacts (§12.2)"
                  />
                </div>
                <div>
                  <span className={labelCls}>Search method (search_method) *</span>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {SEARCH_METHOD_OPTIONS.map(function (option) {
                      const checked = draft.absence.search_method.indexOf(option) !== -1;
                      return (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={function () {
                              const next = checked
                                ? draft.absence.search_method.filter(function (m) { return m !== option; })
                                : draft.absence.search_method.concat([option]);
                              patchAbsence({ search_method: next });
                            }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  <input
                    className={inputCls + " mt-2"}
                    value={draft.absence.search_method_extra}
                    onChange={function (e) { patchAbsence({ search_method_extra: e.target.value }); }}
                    placeholder="additional method (free text, §12.3 is an open set)"
                  />
                </div>
                <div>
                  <label className={labelCls}>Search time (search_time) *</label>
                  <input
                    className={inputCls}
                    value={draft.absence.search_time}
                    onChange={function (e) { patchAbsence({ search_time: e.target.value }); }}
                    placeholder="YYYY-MM-DDTHH:MM:SSZ"
                  />
                </div>
                <div>
                  <label className={labelCls}>Locations searched (one per line) *</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={draft.absence.search_locations_text}
                    onChange={function (e) { patchAbsence({ search_locations_text: e.target.value }); }}
                    placeholder={"docs/\ntemp/artifacts\nbackup/archive"}
                  />
                </div>
                <div>
                  <label className={labelCls}>Why can this absence be recorded? (absence_rationale) *</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={draft.absence.absence_rationale}
                    onChange={function (e) { patchAbsence({ absence_rationale: e.target.value }); }}
                    placeholder="…absence is treated as a record, not as proof of non-existence (§12.6)"
                  />
                </div>
                <div>
                  <label className={labelCls}>Evidence class (evidence_class) *</label>
                  <input
                    className={inputCls}
                    value={draft.absence.evidence_class}
                    onChange={function (e) { patchAbsence({ evidence_class: e.target.value }); }}
                    placeholder="e.g. ABSENT (free text — the contract defines presence, not a closed vocabulary)"
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Limitations of the search — what was missing or inaccessible (one per line) *
                  </label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={draft.limitations_text}
                    onChange={function (e) { patch({ limitations_text: e.target.value }); }}
                    placeholder="§12.5 — what was missing / inaccessible / incomplete"
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className={sectionCls}>
            <EnumSelect
              label="Did execution occur, and how far? (execution_status) *"
              value={draft.execution_status}
              options={EXECUTION_STATUS_VALUES}
              onChange={function (value) { patch({ execution_status: value }); }}
            />
            <EnumSelect
              label="How established is execution provenance? (execution_provenance) *"
              value={draft.execution_provenance}
              options={EXECUTION_PROVENANCE_VALUES}
              onChange={function (value) { patch({ execution_provenance: value }); }}
            />
            {currentNotices()
              .filter(function (n) { return n.code === "EXECUTED_WITHOUT_PROVENANCE"; })
              .map(function (n) {
                return (
                  <p key={n.code} className="text-xs border border-neutral-300 rounded p-2 text-neutral-600">
                    {n.message}
                  </p>
                );
              })}
          </div>
        );
      case 4:
        return (
          <div className={sectionCls}>
            <EnumSelect
              label="What result was observed? (result_observation) *"
              value={draft.result_observation}
              options={RESULT_OBSERVATION_VALUES}
              onChange={function (value) { patch({ result_observation: value }); }}
            />
            <EnumSelect
              label="What do you assess the finding's validity to be? (finding_validity) *"
              value={draft.finding_validity}
              options={FINDING_VALIDITY_VALUES}
              onChange={function (value) { patch({ finding_validity: value }); }}
            />
            <p className={hintCls}>
              What happened (observation) and what you claim it means (validity) are recorded separately (§9.5).
            </p>
          </div>
        );
      case 5:
        return (
          <div className={sectionCls}>
            <EnumSelect
              label="Provenance level (provenance_level) *"
              value={draft.provenance_level}
              options={PROVENANCE_LEVEL_VALUES}
              onChange={function (value) { patch({ provenance_level: value }); }}
            />
            <EnumSelect
              label="Independence level (independence_level) *"
              value={draft.independence_level}
              options={INDEPENDENCE_LEVEL_VALUES}
              onChange={function (value) { patch({ independence_level: value }); }}
            />
            <p className={hintCls}>Provenance and independence are orthogonal and neither implies truth (§5.4, §6.3).</p>
            {currentNotices()
              .filter(function (n) { return n.code === "P3_NO_PROMOTION"; })
              .map(function (n) {
                return (
                  <p key={n.code} className="text-xs border border-neutral-300 rounded p-2 text-neutral-600">
                    {n.message}
                  </p>
                );
              })}
          </div>
        );
      case 6:
        return (
          <div className={sectionCls}>
            <EnumSelect
              label="How reproducible is it? (reproducibility) *"
              value={draft.reproducibility}
              options={REPRODUCIBILITY_VALUES}
              onChange={function (value) { patch({ reproducibility: value }); }}
            />
            <p className={hintCls}>Reproducibility is independent of execution_status: executed does not imply reproducible (§8.3).</p>
          </div>
        );
      case 7:
        return (
          <div className={sectionCls}>
            <div>
              <label className={labelCls}>
                Limitations (one per line) {isAbsent || isUnknown ? "*" : ""}
              </label>
              <textarea
                className={inputCls}
                rows={4}
                value={draft.limitations_text}
                onChange={function (e) { patch({ limitations_text: e.target.value }); }}
                placeholder={
                  isAbsent
                    ? "§12.5 — what was missing / inaccessible / incomplete"
                    : isUnknown
                      ? "§3.3 — why presence could not be determined"
                      : "known limitations, or a single line: none declared"
                }
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={labelCls + " mb-0"}>Conflicts (§11 — keep all sides)</span>
                <button
                  type="button"
                  className="text-xs border border-neutral-300 rounded px-2 py-1"
                  onClick={function () {
                    patch({ conflicts: draft.conflicts.concat([{ ...EMPTY_CONFLICT }]) });
                  }}
                >
                  Add conflict
                </button>
              </div>
              {draft.conflicts.map(function (conflict, index) {
                return (
                  <div key={index} className="border border-neutral-200 rounded p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Conflict {index + 1}</span>
                      <button
                        type="button"
                        className="text-xs text-neutral-500"
                        onClick={function () {
                          patch({ conflicts: draft.conflicts.filter(function (_, i) { return i !== index; }) });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <select
                      className={inputCls}
                      value={conflict.conflict_type}
                      onChange={function (e) {
                        const next = draft.conflicts.slice();
                        next[index] = { ...next[index], conflict_type: e.target.value };
                        patch({ conflicts: next });
                      }}
                    >
                      <option value="">— conflict_type (§11.3) —</option>
                      {CONFLICT_TYPE_VALUES.map(function (option) {
                        return (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      className={inputCls}
                      placeholder="conflict_sources"
                      value={conflict.conflict_sources}
                      onChange={function (e) {
                        const next = draft.conflicts.slice();
                        next[index] = { ...next[index], conflict_sources: e.target.value };
                        patch({ conflicts: next });
                      }}
                    />
                    <textarea
                      className={inputCls}
                      rows={2}
                      placeholder="conflict_content (required)"
                      value={conflict.conflict_content}
                      onChange={function (e) {
                        const next = draft.conflicts.slice();
                        next[index] = { ...next[index], conflict_content: e.target.value };
                        patch({ conflicts: next });
                      }}
                    />
                    <input
                      className={inputCls}
                      placeholder="resolution"
                      value={conflict.resolution}
                      onChange={function (e) {
                        const next = draft.conflicts.slice();
                        next[index] = { ...next[index], resolution: e.target.value };
                        patch({ conflicts: next });
                      }}
                    />
                    <input
                      className={inputCls}
                      placeholder="residual_notes"
                      value={conflict.residual_notes}
                      onChange={function (e) {
                        const next = draft.conflicts.slice();
                        next[index] = { ...next[index], residual_notes: e.target.value };
                        patch({ conflicts: next });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 8:
        return (
          <div className={sectionCls}>
            <p className="text-sm">{SUBMISSION_NOTICE}</p>
            <ul className="text-sm list-disc pl-5 space-y-1 text-neutral-600">
              <li>
                <strong>review</strong> is system-generated as <code>PENDING</code> at intake; reviews happen later.
              </li>
              <li>
                <strong>evidence_id</strong> and <strong>submitted_at</strong> are system-generated.
              </li>
              <li>
                Final <strong>evidence_status</strong>, <strong>verdict</strong>, <strong>validation_result</strong>,{" "}
                <strong>acceptance_status</strong>, <strong>blocked_reason</strong>, and{" "}
                <strong>rejection_reason</strong> are derived by the EV-000 implementation and reviewers — never by this form.
              </li>
              <li>Declaring nothing you did not observe is the only requirement of this step.</li>
            </ul>
          </div>
        );
      case 9:
      default:
        if (result) {
          return (
            <div className={sectionCls}>
              <p className="text-sm border border-neutral-300 rounded p-3">{result.notice}</p>
              <pre className="text-xs bg-neutral-50 border border-neutral-200 rounded p-3 overflow-auto max-h-96">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
              <button
                type="button"
                className="text-sm border border-neutral-300 rounded px-3 py-2"
                onClick={reset}
              >
                Start a new submission
              </button>
            </div>
          );
        }
        return (
          <div className={sectionCls}>
            {notices.length > 0 && (
              <div className="space-y-2">
                {notices.map(function (notice) {
                  return (
                    <p key={notice.code} className="text-xs border border-neutral-300 rounded p-2 text-neutral-600">
                      {notice.message}
                    </p>
                  );
                })}
              </div>
            )}
            {errors.length > 0 && (
              <div className="border border-neutral-400 rounded p-3">
                <p className="text-sm font-medium mb-2">Cannot submit yet — {errors.length} issue(s):</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {errors.map(function (error, index) {
                    return (
                      <li key={index}>
                        <code>{error.field}</code> — {error.message}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="text-sm">
              Submitting creates an evidence submission payload for the EV-000 intake process. It does not verify
              anything the payload claims.
            </p>
            <button
              type="button"
              className="border border-neutral-800 rounded px-4 py-2 text-sm font-medium"
              onClick={handleSubmit}
            >
              Submit evidence submission
            </button>
          </div>
        );
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">EV-000 Evidence Questionnaire v1</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>

      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Questionnaire steps">
        {STEPS.map(function (label, index) {
          return (
            <span
              key={label}
              className={
                "text-xs px-2 py-1 rounded " +
                (index === step ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-600")
              }
            >
              {index + 1}. {label}
            </span>
          );
        })}
      </nav>

      <section className="border border-neutral-200 rounded p-5 mb-6">{renderStep()}</section>

      <div className="flex justify-between">
        <button
          type="button"
          className="text-sm border border-neutral-300 rounded px-3 py-2 disabled:opacity-40"
          onClick={handlePrev}
          disabled={step === 0 || result !== null}
        >
          Previous
        </button>
        <button
          type="button"
          className="text-sm border border-neutral-300 rounded px-3 py-2 disabled:opacity-40"
          onClick={handleNext}
          disabled={step >= STEPS.length - 1}
        >
          Next
        </button>
      </div>
    </main>
  );
}
