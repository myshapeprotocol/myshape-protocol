// ============================================================
// MyShape Protocol — Canonical Content Contract
//
// Implements governance decisions G-1, G-2, G-3 and G-6 for the
// v1 Distribution System. G-4 (deterministic line endings) is a
// repository-level policy implemented in .gitattributes, not here.
//
// THE CHAIN
// ---------
//
//   Registry version
//     → content_path          G-1  exactly one governance-designated file
//     → allowed source type   G-6  .md / .txt only
//     → exact UTF-8 text      G-2  no semantic transformation
//     → canonical_title       G-3  the Registry's title, nothing else
//     → content_fingerprint
//
// THE THREE LAYERS DO NOT COLLAPSE
// --------------------------------
//
// G-6 answers "is this file TYPE eligible?". It must never answer
// "which file is canonical": every .md in a directory is type-eligible,
// and at least one of them is metadata rather than publication content.
// Inferring content_path from an extension would have selected RN-001's
// README.md — a submission checklist — as the canonical content of a
// research paper. That is why this module never selects a source. It
// only validates and reads the one the Registry already designates.
//
// G-2 answers "how is the selected file represented?". It is byte-exact
// UTF-8 text. No trim, no whitespace collapsing, no newline conversion,
// no Unicode normalization, no BOM stripping, no Markdown parsing, no
// LaTeX or HTML extraction. The fingerprint is defined over exact bytes,
// so any normalization here would silently redefine what an approval
// covers. The existing whitespace-significance test in
// content-fingerprint.test.ts pins that intent.
//
// G-3 answers "what is the title?". It is Registry canonical_title and
// nothing else — not a Markdown H1, not the filename, not front matter,
// not document metadata.
//
// FAIL CLOSED
// -----------
//
// Every rejection is returned as a typed value. Nothing here throws for
// ordinary invalid input, because a caller that forgets a catch block
// must not be able to turn "the content is not governable" into a
// publish attempt. There is no fallback path: a rejected extension never
// degrades into "try another source".
//
// SCOPE
// -----
//
// No platform, no HTTP, no credentials, no Supabase, no execution. This
// module resolves governed content and nothing else.
// ============================================================

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  computeContentFingerprint,
  type FingerprintInput,
} from "../content-fingerprint";

// ---------------------------------------------------------------
// G-6 — Allowed canonical content formats
//
// The v1 allowlist is exact and closed. "UTF-8 decodable" is not a
// qualification: .tex, .html and .bib are all decodable text and all
// three are excluded. Eligibility is decided by extension alone, before
// any filesystem access, so an ineligible path never reaches the disk.
// ---------------------------------------------------------------

export const ALLOWED_CANONICAL_CONTENT_EXTENSIONS = [".md", ".txt"] as const;

export type AllowedCanonicalContentExtension =
  (typeof ALLOWED_CANONICAL_CONTENT_EXTENSIONS)[number];

/**
 * Is this path's extension in the v1 canonical content allowlist?
 *
 * Pure and deterministic: extension only, case-insensitive, no
 * filesystem access, no MIME sniffing, no content inference, and
 * emphatically no source selection.
 */
export function isAllowedCanonicalContentPath(candidatePath: string): boolean {
  if (typeof candidatePath !== "string" || candidatePath.length === 0) {
    return false;
  }
  const extension = path.extname(candidatePath).toLowerCase();
  return (ALLOWED_CANONICAL_CONTENT_EXTENSIONS as readonly string[]).includes(
    extension,
  );
}

// ---------------------------------------------------------------
// Path safety
//
// content_path originates in a governance file. A Registry entry must
// not become an arbitrary filesystem read, so a path is accepted only
// when it is a repository-relative POSIX path that stays inside the
// repository root.
// ---------------------------------------------------------------

/**
 * Is this a repository-relative path that cannot escape the repository?
 *
 * Rejects absolute paths (POSIX and Windows forms), drive letters, UNC
 * prefixes, URL schemes, `..` segments, and backslash separators, which
 * would otherwise be a traversal vector on Windows.
 */
export function isSafeRepositoryRelativePath(candidatePath: string): boolean {
  if (typeof candidatePath !== "string" || candidatePath.length === 0) {
    return false;
  }
  if (candidatePath.includes("\\")) return false;
  if (candidatePath.includes("\0")) return false;
  if (/^[a-zA-Z]:/.test(candidatePath)) return false; // C:\ or C:/
  if (candidatePath.startsWith("/")) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidatePath)) return false;
  if (candidatePath.endsWith("/")) return false;

  const segments = candidatePath.split("/");
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") return false;
  }
  return true;
}

// ---------------------------------------------------------------
// Results
// ---------------------------------------------------------------

export type CanonicalContentRejectionCode =
  /** G-6: extension is not in the v1 allowlist. */
  | "EXTENSION_NOT_ALLOWED"
  /** The path is absolute, a URL, or escapes the repository root. */
  | "UNSAFE_PATH"
  /** The designated file is not present on disk. */
  | "FILE_NOT_FOUND"
  /** The read failed, or the bytes are not valid UTF-8 text. */
  | "READ_FAILED";

export type CanonicalContentRejection = {
  ok: false;
  code: CanonicalContentRejectionCode;
  detail: string;
};

export type CanonicalContentRead = {
  ok: true;
  contentPath: string;
  content: string;
};

export type CanonicalContentResult =
  | CanonicalContentRead
  | CanonicalContentRejection;

export interface ReadCanonicalContentOptions {
  repositoryRoot?: string;
}

export async function readCanonicalContent(
  contentPath: string,
  options: ReadCanonicalContentOptions = {},
): Promise<CanonicalContentResult> {
  if (!isAllowedCanonicalContentPath(contentPath)) {
    return {
      ok: false,
      code: "EXTENSION_NOT_ALLOWED",
      detail:
        "G-6: canonical content must be one of " +
        ALLOWED_CANONICAL_CONTENT_EXTENSIONS.join(", ") +
        ". UTF-8 decodability alone does not qualify a file.",
    };
  }

  if (!isSafeRepositoryRelativePath(contentPath)) {
    return {
      ok: false,
      code: "UNSAFE_PATH",
      detail:
        "G-1: content_path must be a repository-relative path. Absolute " +
        "paths, URLs, backslash separators and parent-directory segments " +
        "are refused so a Registry entry cannot become an arbitrary read.",
    };
  }

  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const absolutePath = path.resolve(repositoryRoot, contentPath);
  const root = path.resolve(repositoryRoot);
  if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
    return {
      ok: false,
      code: "UNSAFE_PATH",
      detail: "G-1: the resolved path falls outside the repository root.",
    };
  }

  let raw: Buffer;
  try {
    raw = await readFile(absolutePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    return {
      ok: false,
      code: code === "ENOENT" ? "FILE_NOT_FOUND" : "READ_FAILED",
      detail:
        code === "ENOENT"
          ? "G-1: the designated canonical source does not exist: " + contentPath
          : "G-2: the canonical source could not be read: " + contentPath,
    };
  }

  let content: string;
  try {
    content = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(raw);
  } catch {
    return {
      ok: false,
      code: "READ_FAILED",
      detail:
        "G-2: the designated canonical source is not valid UTF-8 text and " +
        "cannot be governed as canonical content.",
    };
  }

  return { ok: true, contentPath, content };
}

// ---------------------------------------------------------------
// G-3 - Title, and the fingerprint integration
// ---------------------------------------------------------------

export interface CanonicalContentRequest {
  contentPath: string;
  canonicalTitle: string;
}

export type CanonicalFingerprintResult =
  | {
      ok: true;
      contentPath: string;
      canonicalTitle: string;
      content: string;
      contentFingerprint: string;
    }
  | CanonicalContentRejection
  | {
      ok: false;
      code: "TITLE_MISSING";
      detail: string;
    };

export async function computeCanonicalContentFingerprint(
  request: CanonicalContentRequest,
  options: ReadCanonicalContentOptions = {},
): Promise<CanonicalFingerprintResult> {
  const { contentPath, canonicalTitle } =
    request ?? ({} as CanonicalContentRequest);

  if (typeof canonicalTitle !== "string" || canonicalTitle.length === 0) {
    return {
      ok: false,
      code: "TITLE_MISSING",
      detail:
        "G-3: canonical_title is the only permitted title source and it is " +
        "required. It is never inferred from the file, its heading, or its metadata.",
    };
  }

  const read = await readCanonicalContent(contentPath, options);
  if (!read.ok) return read;

  const fingerprintInput: FingerprintInput = {
    content: read.content,
    title: canonicalTitle,
  };

  return {
    ok: true,
    contentPath: read.contentPath,
    canonicalTitle,
    content: read.content,
    contentFingerprint: computeContentFingerprint(fingerprintInput),
  };
}
