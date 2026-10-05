/**
 * MyShape Protocol — controlled first-publication runner
 *
 * ONE script, ONE asset, ONE recipient, manually invoked. This is
 * the operational entrypoint for the first real governed external
 * publication. It assembles the six production MVDS ports and runs
 * the supported three-step sequence:
 *
 *   1. createDistribution()   — establishes the lifecycle record
 *   2. recordApproval()       — records a real human approval event
 *   3. distributeResearch()   — governance decides, then delivery
 *
 * Step 2 is a SEPARATE call on purpose. `distributeResearch()` reads
 * history immediately after creating the record, so on a brand-new
 * row the approval cannot exist yet and the first call must return
 * NOT_AUTHORIZED. The sequence is idempotent: step 3 reuses the
 * record created in step 1 (identity is version_id + surface +
 * platform + content_fingerprint), and governance now sees the
 * approval.
 *
 * WHAT THIS SCRIPT DELIBERATELY DOES NOT DO
 *
 * No HTTP route. No cron or scheduler. No retry loop. No queue. No
 * recipient discovery, mailing list, subscriber table, or default
 * recipient. No loop over recipients. No loop over platforms. No
 * automatic asset discovery. Nothing here fires unless a human runs
 * it with an explicit recipient and an explicit --confirm.
 *
 * NOTHING IS HARDCODED THAT MUST BE PROVENED
 *
 * The content fingerprint and the Registry commit are computed with
 * the existing canonical-content and registry-provenance functions.
 * They are never pasted in. The approval writer sources its
 * provenance from the distribution row, so this script cannot
 * substitute one.
 *
 * The email text is the canonical research source, read verbatim
 * through the existing canonical-content machinery. This script
 * never rewrites, summarises, or trims it. Pass --content-file to
 * supply different operator-authored text instead.
 *
 * INVOCATION (run from the repository root)
 *
 *   node --env-file=.env.local scripts/first-publication-runner.ts \
 *     --recipient <one-address> \
 *     --approver-id <human-id> \
 *     --approval-source console \
 *     --approval-ref <stable-ref> \
 *     --confirm
 *
 * Without --confirm the script prints the resolved plan and exits
 * WITHOUT touching the database or sending anything. --env-file is
 * required so NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * RESEND_API_KEY and RESEND_FROM_EMAIL are present. RESEND_FROM_EMAIL
 * has no development fallback here: a real publication must name a
 * verified sender.
 *
 * WHY THE RESOLVE HOOK BELOW
 *
 * The MVDS modules import each other with extensionless relative
 * specifiers and use the "@/src" alias, which Node's native
 * TypeScript stripping does not resolve on its own. The hook teaches
 * the loader those two project conventions. It is a loader detail
 * only: it changes how a module is FOUND, never what it does, and it
 * is registered before any MVDS module is imported.
 */

import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Module resolution hook (must be registered before the MVDS imports)
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC_DIR = pathToFileURL(path.join(REPO_ROOT, "src") + path.sep).href;

// `registerHooks` is present in Node 24 but absent from this project's
// @types/node, so its callback signature is not inferred here. The
// parameters are annotated explicitly rather than loosening any
// project-wide setting.
registerHooks({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(specifier: any, context: any, nextResolve: any): any {
    // Project alias: "@/lib/..." -> "src/lib/..."
    if (specifier.startsWith("@/")) {
      try {
        return nextResolve(specifier, context);
      } catch {
        return nextResolve(SRC_DIR + specifier.slice(2) + ".ts", context);
      }
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // Extensionless relative import: try the TypeScript file.
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const base = context.parentURL
          ? path.dirname(fileURLToPath(context.parentURL))
          : process.cwd();
        const absolute = path.resolve(base, specifier);
        if (existsSync(absolute + ".ts")) {
          return nextResolve(pathToFileURL(absolute + ".ts").href, context);
        }
      }
      throw error;
    }
  },
});

// ---------------------------------------------------------------------------
// The fixed first-publication candidate (from docs/research-assets.registry.yaml)
// ---------------------------------------------------------------------------

const CANDIDATE = {
  asset_id: "RN-002",
  version_id: "rn-002-r01",
  contentPath: "papers/rn-002/pes-benchmark-v0.2-article.md",
  canonicalTitle: "RN-002  PES Benchmark v0.2",
  surface: "myshape-public",
  brand: "myshape",
  platform: "email",
} as const;

const DEFAULT_SUBJECT = `${CANDIDATE.canonicalTitle} — research distribution`;


// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string | true> {
  const parsed: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function refuse(reason: string): never {
  console.error(`\nREFUSING TO RUN: ${reason}\n`);
  process.exit(1);
}

/**
 * Exactly one address. This rejects anything that could be read as a
 * list, so a single invocation can never fan out.
 */
function requireSingleRecipient(value: string | true | undefined): string {
  if (value === undefined || value === true) {
    refuse(
      "--recipient is required. Pass exactly one address.\n" +
        "  This script has no default recipient, no mailing list, and no\n" +
        "  recipient discovery.",
    );
  }
  const candidate = String(value).trim();

  if (/[,;\s]/.test(candidate)) {
    refuse(
      "--recipient must be a single address. Refusing anything that " +
        "could be read as a list.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    refuse(`--recipient is not a single valid address: ${candidate}`);
  }
  return candidate;
}

function requireText(
  value: string | true | undefined,
  flag: string,
): string {
  if (value === undefined || value === true || String(value).trim() === "") {
    refuse(`${flag} is required and must be non-empty.`);
  }
  return String(value).trim();
}

const args = parseArgs(process.argv.slice(2));
const recipient = requireSingleRecipient(args["recipient"]);
const approverId = requireText(args["approver-id"], "--approver-id");
const approvalSource = requireText(args["approval-source"], "--approval-source");
const approvalRef = requireText(args["approval-ref"], "--approval-ref");

// ---------------------------------------------------------------------------
// Resolve the two values that must never be hardcoded
// ---------------------------------------------------------------------------

const RD = path.join(REPO_ROOT, "src", "lib", "research-distribution");
const load = (file: string) => import(pathToFileURL(path.join(RD, file)).href);

const { computeCanonicalContentFingerprint } = await load("canonical-content.ts");
const { resolveRegistryCommit, REGISTRY_PATH } = await load("registry-provenance.ts");
const { createDistribution } = await load("distribution-writer.ts");
const { distributeResearch, recordApproval } = await load("distribute.ts");
const { createSupabaseDistributionWriterFromEnv } = await load(
  "distribution-store-supabase.ts",
);
const { createSupabaseDistributionRepositoryFromEnv } = await load(
  "distribution-repository-supabase.ts",
);
const { createSupabaseApprovalStoreFromEnv } = await load("approval-store.ts");
const { createSupabaseAttemptWriterFromEnv } = await load(
  "attempt-store-supabase.ts",
);
const { createSupabaseDeliveryStateStoreFromEnv } = await load(
  "delivery-state-store.ts",
);
const { createResendDeliveryAdapterFromEnv } = await load("delivery-resend.ts");

// 1. Content fingerprint, from the canonical source through the
//    existing machinery. Returns the text too, used verbatim below.
const fingerprint = await computeCanonicalContentFingerprint({
  contentPath: CANDIDATE.contentPath,
  canonicalTitle: CANDIDATE.canonicalTitle,
});
if (!fingerprint.ok) {
  refuse(
    `canonical content could not be read (${fingerprint.code}): ` +
      `${fingerprint.detail}`,
  );
}

// Operator-supplied text wins if given; otherwise the canonical
// source is used verbatim. This script never edits it either way.
const contentFile = args["content-file"];
const content =
  contentFile !== undefined && contentFile !== true
    ? readFileSync(path.resolve(REPO_ROOT, String(contentFile)), "utf8")
    : fingerprint.content;

// 2. Registry provenance. The validator is actually run, and the
//    working-tree and HEAD bytes are both read, because
//    resolveRegistryCommit refuses to record a commit that does not
//    contain the exact bytes that were validated.
const validation = execFileSync(
  process.execPath,
  [path.join("scripts", "validate-research-assets.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
const validationPassed = validation.includes("PASS: all registry invariants hold");

const provenance = resolveRegistryCommit({
  registryValidationPassed: validationPassed,
  workingTreeRegistryBytes: readFileSync(path.join(REPO_ROOT, REGISTRY_PATH)),
  headRegistryBytes: execFileSync(
    "git",
    ["show", `HEAD:${REGISTRY_PATH}`],
    { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 },
  ),
  headCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim(),
});
if (!provenance.ok) {
  refuse(
    `registry provenance could not be established (${provenance.code}): ` +
      `${provenance.detail}`,
  );

}

// ---------------------------------------------------------------------------
// Values derived from what was just resolved. Declared here, before the
// plan and the execution below use them.
// ---------------------------------------------------------------------------

const distributionInput = {
  asset_id: CANDIDATE.asset_id,
  version_id: CANDIDATE.version_id,
  surface: CANDIDATE.surface,
  brand: CANDIDATE.brand,
  platform: CANDIDATE.platform,
  content_fingerprint: fingerprint.contentFingerprint,
  registry_commit: provenance.registryCommit,
};

const subject =
  args["subject"] === undefined || args["subject"] === true
    ? DEFAULT_SUBJECT
    : String(args["subject"]).trim();

const confirmed = args["confirm"] === true;

// A real publication must name its verified sender. The adapter has a
// development fallback; refusing it here is the point.
if (!process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL.trim() === "") {
  refuse(
    "RESEND_FROM_EMAIL is required for a real publication.\n" +
      "  Supply it via --env-file=.env.local. This script will not fall\n" +
      "  back to the development sender.",
  );
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

console.log("\n=== RESOLVED FIRST-PUBLICATION PLAN ===");
console.log(`  asset_id           ${distributionInput.asset_id}`);
console.log(`  version_id         ${distributionInput.version_id}`);
console.log(`  surface            ${distributionInput.surface}`);
console.log(`  brand              ${distributionInput.brand}`);
console.log(`  platform           ${distributionInput.platform}`);
console.log(`  content_fingerprint ${distributionInput.content_fingerprint}`);
console.log(`  registry_commit    ${distributionInput.registry_commit}`);
console.log(`  recipient          ${recipient}`);
console.log(`  sender             ${process.env.RESEND_FROM_EMAIL}`);
console.log(`  approver           ${approverId} (${approvalSource} / ${approvalRef})`);
console.log(`  content chars      ${content.length}`);
console.log(`  subject            ${subject}`);

if (!confirmed) {
  console.log(
    "\nDRY RUN — nothing was created, approved, or sent.\n" +
      "Re-run with --confirm to execute the three-step sequence.\n",
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Execute: create -> approve -> distribute
// ---------------------------------------------------------------------------

const writer = await createSupabaseDistributionWriterFromEnv();
const repository = await createSupabaseDistributionRepositoryFromEnv();
const approvals = await createSupabaseApprovalStoreFromEnv();
const attempts = await createSupabaseAttemptWriterFromEnv();
const deliveryState = await createSupabaseDeliveryStateStoreFromEnv();
const adapter = await createResendDeliveryAdapterFromEnv();

console.log("\n=== STEP 1/3  create the distribution record ===");
const created = await createDistribution(writer, distributionInput);
if (!created.ok) {
  refuse(`step 1 failed (${created.code}): ${created.detail}`);
}
const distributionId = created.distribution.distribution_id;
console.log(`  distribution_id ${distributionId}  (created: ${created.created})`);

console.log("\n=== STEP 2/3  record the human approval ===");
// Provenance is NOT an input here: the approval writer reads the
// stored anchor from the distribution row.
const approval = await recordApproval(approvals, {
  distributionId,
  approverId,
  approvalSource,
  approvalRef,
  approvedAt: new Date().toISOString(),
});
if (!approval.ok) {
  refuse(`step 2 failed (${approval.code}): ${approval.detail}`);
}
console.log(`  event_id ${approval.eventId}  (registry_commit ${approval.registryCommit})`);

console.log("\n=== STEP 3/3  governance decision + delivery ===");
const outcome = await distributeResearch(
  {
    writer,
    repository,
    attempts,
    deliveryState,
    approvals,
    adapter,
    now: () => new Date().toISOString(),
  },
  {
    distribution: distributionInput,
    recipient,
    subject,
    content,
  },
);

if (outcome.ok) {
  console.log(
    `\nPUBLISHED\n  provider_message_id ${outcome.providerMessageId}\n` +
      `  delivery_state        ${outcome.deliveryState}\n`,
  );
} else {
  console.error(
    `\nNOT PUBLISHED\n  code   ${outcome.code}\n  detail ${outcome.detail}\n` +
      (outcome.deliveryState
        ? `  delivery_state ${outcome.deliveryState}\n`
        : ""),
  );
  process.exit(1);
}
