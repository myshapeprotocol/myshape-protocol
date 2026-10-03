// ============================================================
// EV-000 — participant consent text
//
// SINGLE SOURCE OF THE FROZEN CONSENT PRESENTED TO PARTICIPANTS.
//
// The canonical definition §15A.1 freezes the participant-facing wording.
// It is duplicated here as a presentational asset only, because a React page
// cannot read a Markdown file at runtime and the enrollment flow must render
// the text the participant is agreeing to.
//
// Two guards keep this from drifting silently:
//
//   1. EV000-CONSENT-TEST-WARD against the canonical document
//      (enrollment-store.test.ts fails if the version or a required
//      disclosure is missing here).
//   2. EV-000-CONSENT-TEXT-UNIQUE — a test asserts this constant appears in
//      exactly one module, so the prose is never copied a second time.
//
// If the canonical consent changes, this file must change with it and the
// version identifier must be incremented. Editing the wording while leaving
// EV-000-CONSENT-1.0 in place is a governance violation, not a refactor.
// ============================================================

import { EV000_CONSENT_VERSION } from "./enrollment-store";

/** Marker used by the drift test. Do not rename without updating the test. */
export const EV000_CONSENT_TEXT_UNIQUE = "EV-000-CONSENT-TEXT-UNIQUE";

/** Canonical §15A.1, presented verbatim in structure and meaning. */
export const EV000_CONSENT_TITLE = "Taking part in Continuity Lab research (EV-000)";

export interface Ev000ConsentSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const EV000_CONSENT_SECTIONS: Ev000ConsentSection[] = [
  {
    heading: "What you are choosing to do",
    paragraphs: [
      "You are choosing to take part in Continuity Lab research. Taking part is voluntary. You can stop taking part at any time.",
    ],
  },
  {
    heading: "Enrolling is a separate step from taking part",
    paragraphs: [
      "Enrolling records your agreement to the terms below. It does not by itself mean you have done anything. You can enrol and then never take part in any activity, and you remain a participant. You do not have to complete any activity to enrol.",
    ],
  },
  {
    heading: "We do not ask who you are",
    paragraphs: [
      "EV-000 does not ask for your name, your email address, an account, a wallet, or any other profile about you. We do not ask for your device details or store your IP address.",
    ],
  },
  {
    heading: "You get one random code — your Participant Ref",
    paragraphs: [
      "When you enrol, we generate a random code for you. This is your Participant Ref. You will be shown it once, at that moment. It is not shown again, and we cannot show it to you later. Please keep it somewhere safe. You need it to stop taking part.",
      "What we store is not your Participant Ref but a one-way hash of it. We cannot use the stored value to work out your Participant Ref.",
    ],
  },
  {
    heading: "If you later take part in a research activity, it may be linked to your enrolment",
    paragraphs: [
      "If you go on to perform an EV-000 research activity, that activity may be recorded as linked to your EV-000 enrolment, using your Participant Ref and enrolment reference. That link exists only inside EV-000. It is not used to build an identity for you across the internet, across projects, or across products, and it is not intended to identify you.",
    ],
  },
  {
    heading: "How long we keep your data",
    paragraphs: [
      "We keep EV-000 participant data for 90 days counted from the day you enrol. Taking part in an activity later does not restart that 90 days. The 90-day period does not extend because you keep taking part.",
    ],
  },
  {
    heading: "How to stop taking part",
    paragraphs: [
      "You can stop at any time by using your Participant Ref. When you do:",
      "We keep only a non-identifying note that you withdrew, so that we can show your withdrawal was honoured.",
      "Stopping cannot be undone. Enrolling again afterwards creates a new enrolment with a new Participant Ref, and does not bring back anything already removed.",
    ],
    bullets: [
      "we stop collecting anything further from you;",
      "we remove your participant data from our records; and",
    ],
  },
  {
    heading: "If you cannot use your Participant Ref",
    paragraphs: [
      "If you cannot use your Participant Ref, or you would rather not use it, you can contact us at dev@myshape.com and ask to stop taking part. Withdrawal is irreversible: it removes your data going forward and does not bring back anything already removed.",
    ],
  },
  {
    heading: "What withdrawing does not do",
    paragraphs: [
      "Withdrawing does not take back research results that were already worked out or already published before you withdrew. Those results stay as they are. Withdrawing removes your data going forward; it does not rewrite results that are already out.",
    ],
  },
];

/** The version presented alongside this text. Frozen; see the module header. */
export const EV000_CONSENT_VERSION_PRESENTED = EV000_CONSENT_VERSION;