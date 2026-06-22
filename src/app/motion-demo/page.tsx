import type { Metadata } from "next";
import MotionDemoClient from "./MotionDemoClient";

export const metadata: Metadata = {
  title: "MyShape Motion Demo — Geometric Signature Prototype",
  description:
    "See your motion geometry in real-time. A proof-of-concept demonstrating the motion-to-geometry pipeline.",
};

export default function MotionDemoPage() {
  return <MotionDemoClient />;
}
