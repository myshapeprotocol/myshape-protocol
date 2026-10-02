// ============================================================
// Registry commit provenance
//
// Implements the locked provenance contract for
// research_distribution.registry_commit (governance decisions D1-D6).
//
// WHAT registry_commit IS
// ------------------------
//
// A Git commit SHA identifying the repository commit at which the
// Distribution Decision was made and whose Registry snapshot was
// actually validated.
//
// It is DECISION PROVENANCE, not Registry content identity. Two
// decisions taken at different commits get different values even when
// the Registry bytes did not change. That is intentional.
//
// It is NOT:
//   - a Registry content hash
//   - a blob SHA
//   - a branch name
//   - a timestamp
//   - the source_commit (that anchors the source file, not the Registry)
//   - the Registry introduction commit
//
// WHY HEAD IS THE CANONICAL DERIVATION
// ---------------------------------------
//
// Git proves commit -> Registry bytes:
//
//   registry_commit -> commit -> tree -> <registry path> -> bytes
//
// The reverse is NOT used, because it has no unique answer. The same
// Registry blob is carried by multiple commits (a branch original and
// its merged form both exist in this repository), so "find the commit
// containing this blob" is ambiguous. No historical search is performed
// for the earliest, latest, introduction, merge-base, or master commit.
//
// WHY A DIRTY REGISTRY IS A HARD FAILURE
// -------------------------------------
//
// The validator reads the working tree. If the working-tree Registry
// differs from HEAD, the bytes that were validated are not the bytes
// any commit records, so no commit SHA can honestly represent them.
// Writing HEAD anyway would record provenance that is false.
//
// The comparison is over exact file bytes. It is NOT a comparison of
// parsed YAML, and it applies no normalization of any kind.
//
// SCOPE
// -----
//
// This module is pure. It performs no Git access, no filesystem
// access, no validation and no network I/O. It decides whether the
// inputs it is given permit a registry_commit to be recorded. The
// caller supplies the bytes and the commit; wiring those to Git is a
// later phase.
// ============================================================

export const REGISTRY_PATH = "docs/research-assets.registry.yaml";

export type RegistryProvenanceRejection =
  /** The Registry validator did not pass. */
  | "REGISTRY_VALIDATION_FAILED"
  /** HEAD could not be resolved to a commit. */
  | "HEAD_UNRESOLVED"
  /** The working-tree Registry is not the Registry stored at HEAD. */
  | "REGISTRY_DIRTY";

export type RegistryProvenanceResult =
  | {
      ok: true;
      /** Git commit SHA to record in research_distribution.registry_commit */
      registryCommit: string;
    }
  | {
      ok: false;
      code: RegistryProvenanceRejection;
      detail: string;
    };

export interface RegistryProvenanceInput {
  /** Result of running scripts/validate-research-assets.mjs. */
  registryValidationPassed: boolean;
  /** Exact bytes of the working-tree Registry file. */
  workingTreeRegistryBytes: Uint8Array;
  /** Exact bytes of the Registry file as stored at HEAD, or null if HEAD has none. */
  headRegistryBytes: Uint8Array | null;
  /** Resolved HEAD commit SHA, or null when it could not be resolved. */
  headCommit: string | null;
}

/**
 * Decide whether a registry_commit may be recorded, and which value.
 *
 * Order matters. Validation is checked first, then HEAD resolution, then
 * byte equality. A failure at any step is a hard failure: there is no
 * fallback to another commit, to a blob SHA, or to a default.
 */
export function resolveRegistryCommit(
  input: RegistryProvenanceInput,
): RegistryProvenanceResult {
  if (!input.registryValidationPassed) {
    return {
      ok: false,
      code: "REGISTRY_VALIDATION_FAILED",
      detail:
        "The Registry did not validate, so no Registry snapshot was " +
        "reviewed and no registry_commit may be recorded.",
    };
  }

  if (typeof input.headCommit !== "string" || input.headCommit.length === 0) {
    return {
      ok: false,
      code: "HEAD_UNRESOLVED",
      detail:
        "HEAD could not be resolved to a commit, so the decision-time " +
        "commit is unknown and no registry_commit may be recorded.",
    };
  }

  if (input.headRegistryBytes === null) {
    return {
      ok: false,
      code: "REGISTRY_DIRTY",
      detail:
        `HEAD does not contain ${REGISTRY_PATH}, so the validated ` +
        "Registry cannot be proven against it.",
    };
  }

  if (!bytesEqual(input.workingTreeRegistryBytes, input.headRegistryBytes)) {
    return {
      ok: false,
      code: "REGISTRY_DIRTY",
      detail:
        `The working-tree ${REGISTRY_PATH} differs from the copy stored ` +
        `at HEAD ${input.headCommit}. Validation covered uncommitted ` +
        "bytes that no commit records, so recording this commit would " +
        "state provenance that is false. Commit the Registry first.",
    };
  }

  return { ok: true, registryCommit: input.headCommit };
}

/**
 * Exact byte equality. No normalization: not line endings, not a BOM,
 * not trailing whitespace, not a YAML parse. Two files that differ in
 * any byte are different Registry snapshots.
 */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}