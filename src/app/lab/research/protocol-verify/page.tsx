import type { Metadata } from "next";
import ProtocolVerifyClient from "./ProtocolVerifyClient";

export const metadata: Metadata = {
  title: "Dual-Engine Verification — MyShape Protocol",
  description:
    "PE-001 passive observer + EE-003 active challenge. Two independent evidence engines operating in defense-in-depth formation.",
};

export default function Page() {
  return <ProtocolVerifyClient />;
}
