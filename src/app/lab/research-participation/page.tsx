import type { Metadata } from "next";
import ParticipationClient from "./ParticipationClient";

export const metadata: Metadata = {
  title: "Participate in the Research — The Continuity Lab",
  description:
    "A public form for people interested in the Continuity Protocol research: learning about it, testing CPS-0001, challenging its assumptions, reproducing the experiments, or building an independent implementation. This is not a registration or an enrollment.",
  alternates: { canonical: "https://thecontinuitylab.org/lab/research-participation" },
};

export default function Page() {
  return <ParticipationClient />;
}
