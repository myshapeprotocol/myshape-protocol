import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "FD-001 — Frame Rate Hypothesis · The Continuity Lab",
  description: "Failure report: higher sampling rate (10fps) degraded pass rate. More data does not always mean better data.",
  alternates: { canonical: "https://www.myshape.com/research/notes/005-failure-report-10fps" },
  openGraph: {
    title: "FD-001 — Frame Rate Hypothesis · The Continuity Lab",
    description: "We tested whether increasing the camera sampling rate improves cross-modal verification. It made things worse.",
    url: "https://www.myshape.com/research/notes/005-failure-report-10fps",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-18",
    authors: ["The Continuity Lab"],
  },
};

export default function Page() {
  return <NoteClient />;
}
