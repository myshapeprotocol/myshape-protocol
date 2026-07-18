import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "DL-001 — Direction Asymmetry in EE-003 · The Continuity Lab",
  description: "Decision Log: empirical observation of direction-dependent pass rates in the gyroscope challenge — rightward yaw fails significantly more often.",
  alternates: { canonical: "https://www.myshape.com/research/notes/007-ee003-direction-asymmetry" },
};

export default function Page() {
  return <NoteClient />;
}
