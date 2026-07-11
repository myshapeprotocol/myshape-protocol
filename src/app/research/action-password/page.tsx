import type { Metadata } from "next";
import ActionPasswordClient from "./ActionPasswordClient";

export const metadata: Metadata = {
  title: "Action Password — MyShape Protocol",
  description:
    "Set a secret motion as your password. Only a live human performing the exact motion can pass.",
};

export default function ActionPasswordPage() {
  return <ActionPasswordClient />;
}
