import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "MyShape Contact — Connect Nodes",
  description: "Establish a secure uplink with the MyShape Protocol team for partnerships and integration.",
};

export default function ContactPage() {
  return <ContactClient />;
}
