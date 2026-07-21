import type { Metadata } from "next";
import SurveyClient from "./SurveyClient";

export const metadata: Metadata = {
  title: "Discovery Survey — The Continuity Lab",
  description: "5-minute research survey. We're studying whether teams working with sensor data have encountered a specific problem. No sales. No pitch.",
  alternates: { canonical: "https://www.myshape.com/research/discovery-survey" },
};

export default function Page() {
  return <SurveyClient />;
}
