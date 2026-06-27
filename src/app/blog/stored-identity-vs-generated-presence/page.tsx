import type { Metadata } from "next";
import PostClient from "./PostClient";

export const metadata: Metadata = {
  title: "Stored Identity vs. Generated Presence — Why Your 'Identity' Is Just a Copyable Database Record",
  description: "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics.",
  openGraph: {
    title: "Stored Identity vs. Generated Presence",
    description: "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot.",
    url: "https://www.myshape.com/blog/stored-identity-vs-generated-presence",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-06-27",
    authors: ["MyShape Protocol"],
    tags: ["identity", "presence", "AI", "protocol"],
  },
};

export default function Page() {
  return <PostClient />;
}
