import type { Metadata } from "next";
import MobileCaptureClient from "./MobileCaptureClient";

export const metadata: Metadata = {
  title: "Mobile Motion Capture — MyShape Protocol",
  description:
    "Capture IMU sensor data (accelerometer + gyroscope) for motion-signature research. Phone-native presence evidence collection.",
};

export default function MobileCapturePage() {
  return <MobileCaptureClient />;
}
