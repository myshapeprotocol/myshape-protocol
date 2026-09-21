import LabResearchClient from "./ResearchClient";

export const metadata = {
  title: "Research — Continuity Lab",
  description:
    "Open research on continuity: notes, experiments, datasets, and findings.",
  alternates: { canonical: "https://thecontinuitylab.org/research" },
};

export default function ResearchPage() {
  return <LabResearchClient />;
}
