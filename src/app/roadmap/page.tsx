import type { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
  title: "MyShape Roadmap — Protocol Evolution Timeline",
  description: "The four-epoch development roadmap for the sovereign identity layer.",
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
