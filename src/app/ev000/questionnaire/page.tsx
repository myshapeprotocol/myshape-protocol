import type { Metadata } from "next";
import Ev000Questionnaire from "@/components/ev000-questionnaire/Ev000Questionnaire";

// ============================================================
// EV-000 Questionnaire v1 — route wrapper
//
// Follows the /ev000 pattern: a single self-contained route that
// adds no navigation, footer, or sitemap entry. It is reachable
// only by URL; wiring it into site navigation is a separate
// decision.
// ============================================================

export const metadata: Metadata = {
  title: "EV-000 Evidence Questionnaire v1 — MyShape Protocol",
  description:
    "Submit structured EV-000 evidence: artifact state, execution, observed result, provenance, independence, and reproducibility context. Submission is not verification.",
};

export default function Ev000QuestionnairePage() {
  return <Ev000Questionnaire />;
}
