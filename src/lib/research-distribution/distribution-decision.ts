// ============================================================
// MyShape Protocol — Research Distribution decision composer
//
// The composer is the THIRD pure stage. It joins two frozen results
// into one verdict and adds no judgement of its own.
//
//   events   ──►  deriveGovernanceState()  ──►  canDistribute()
//                     │                             │
//                     └──────────┬──────────────────┘
//                                ▼
//                    composeDistributionDecision()
//                                │
//                                ▼
//                       [future service]
//
// WHAT THIS MODULE DOES NOT DO
//
// It does not derive, does not gate, does not decide, and does not
// act. It composes. Every value it reports was produced upstream:
//
//   governance.state  ← deriveGovernanceState()
//   allowed           ← canDistribute()
//   reasons           ← canDistribute()
//   diagnostics       ← deriveGovernanceState()
//
// There is no governance rule here, no gate rule here, and no
// fifth GovernanceState here. Adding any of those would fork a
// frozen contract and make two sources of truth for one decision.
//
// THE INVARIANT
//
//   final.allowed  ≤  gate.allowed
//
// The composer may only NARROW. There is no input — no delivery
// state, no diagnostic, no shape of history — for which this
// module returns allowed: true while canDistribute() returned
// allowed: false. This is asserted directly by the test suite.
//
// DELIVERY IS REPORTED, NOT ENFORCED
//
// Per the contract §7.3 reconciliation guard, while an attempt has
// reconciliation_required = true no new attempt may be opened.
// That guard is deliberately NOT implemented here: the governance
// gate is untouched, and the composer does not invent a reason code
// it was not given. Instead the delivery result travels in the
// output as `delivery`, and a caller that must enforce the retry
// ban reads delivery.state.
//
// This is a report, not a prohibition. A caller that ignores
// `delivery` will retry a record whose last outcome is unknown.
// That is why the field is named and documented rather than folded
// into `allowed`: silently converting a governance question into a
// delivery question would misattribute the refusal.
// ============================================================

// ---------------------------------------------------------------
// Inputs — all frozen types, imported as TYPES ONLY.
//
// TypeScript erases `import type` at compile time, so this module
// carries no runtime dependency on its siblings beyond the two
// functions it must actually call. The type imports additionally
// guarantee the composer cannot drift from a changed contract: if
// either upstream shape changes, this file fails to compile.
// ---------------------------------------------------------------

import type {
  DeliveryDerivationResult,
  DeliveryState,
  Diagnostic,
  GovernanceDerivationResult,
  GovernanceState,
} from "./derivation";
import type { GateReason, GateResult } from "./governance-gate";

// ---------------------------------------------------------------
// Decision shape
// ---------------------------------------------------------------

/**
 * The composer verdict.
 *
 * `allowed` is the single authoritative answer. Everything else is
 * provenance — it explains the answer and never contradicts it.
 */
export type DistributionDecision = {
  /** True only when governance approved AND nothing narrowed it. */
  allowed: boolean;

  /**
   * Governance provenance, forwarded from the derivation result.
   * `state` is null exactly when the derivation failed.
   */
  governance: {
    ok: boolean;
    state: GovernanceState | null;
  };

  /**
   * Delivery provenance.
   *
   * Absent when the caller supplied no delivery result. When
   * present, `state` is reported for the caller's use under
   * contract §7.3 — it is NOT an input to `allowed`.
   */
  delivery: { state: DeliveryState } | null;

  /**
   * Denial reasons, forwarded verbatim from the gate.
   *
   * Empty exactly when `allowed` is true. Never contains a code
   * this module invented.
   */
  reasons: GateReason[];

  /** Derivation diagnostics, then delivery diagnostics. */
  diagnostics: Diagnostic[];
};

// ---------------------------------------------------------------
// The composer
// ---------------------------------------------------------------

/**
 * Compose a derivation result and a gate result into one verdict.
 *
 * ALLOWED only when `gate.allowed` is true. Nothing else can grant
 * permission — not a clean delivery state, not an empty diagnostic
 * list, not a HUMAN_APPROVED state the gate did not see.
 *
 * The composer does not call either upstream function. It receives
 * their outputs, which makes the layering explicit at the call site
 * and keeps this function a pure composition of two values.
 *
 * `delivery` is optional. When supplied it is reported, never
 * consulted for `allowed` — see the header note on the contract
 * §7.3 reconciliation guard. When omitted, `delivery` is null.
 *
 * Deterministic and pure: same inputs → identical output, no I/O,
 * no clock, no randomness, no mutation of the arguments.
 *
 * @param derivation Output of `deriveGovernanceState()`.
 * @param gate       Output of `canDistribute()`.
 * @param delivery   Optional output of `deriveDeliveryState()`.
 */
export function composeDistributionDecision(
  derivation: GovernanceDerivationResult,
  gate: GateResult,
  delivery?: DeliveryDerivationResult,
): DistributionDecision {
  // The authoritative answer. Assigned from the gate and never
  // recomputed here — this module holds no governance rule.
  //
  // Note this is not an `if (gate.allowed)` branch: there is no
  // second code path that could disagree. The gate's verdict IS
  // the verdict, which makes the narrowing invariant true by
  // construction rather than by careful coding.
  const allowed = gate.allowed;

  return {
    allowed,

    governance: {
      ok: derivation.ok,
      state: derivation.state,
    },

    // Reported only. `delivery` never affects `allowed`.
    delivery: delivery ? { state: delivery.state } : null,

    // Forwarded verbatim — never extended, never rewritten. A
    // caller matching on GateReason keeps working.
    reasons: gate.allowed ? [] : [...gate.reasons],

    // Governance diagnostics first, then delivery diagnostics.
    //
    // Both stages emit diagnostics that are facts about the
    // record, and a caller reading `diagnostics` reasonably
    // expects to see all of them. Dropping the delivery half
    // would silently hide RECONCILIATION_REQUIRED — the exact
    // signal contract §7.3 turns on — behind the U-06 path.
    //
    // Order is deterministic: governance stage, then delivery
    // stage. Both are already ordered by their identity column.
    diagnostics: [
      ...derivation.diagnostics,
      ...(delivery ? delivery.diagnostics : []),
    ],
  };
}

/**
 * Whether a retry is currently barred for a decision.
 *
 * Contract §7.3: while an attempt has reconciliation_required =
 * true, no new attempt may be opened for the same distribution
 * record.
 *
 * This is a SEPARATE question from `allowed`, deliberately. The
 * composer reports the delivery state; a caller that must enforce
 * the retry ban asks here. Folding the ban into `allowed` would
 * report a delivery problem as a governance refusal, and would
 * require a reason code the frozen gate does not define.
 *
 * True when delivery is IN_FLIGHT. NOT_ATTEMPTED is a normal
 * pre-delivery state and does not bar anything.
 */
export function isRetryBlocked(decision: DistributionDecision): boolean {
  return decision.delivery?.state === "IN_FLIGHT";
}