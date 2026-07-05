import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search — MyShape Protocol",
  description:
    "Search MyShape Protocol documentation, blog posts, papers, and technical specifications on motion-signature verification, zero-knowledge presence, and sovereign identity.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://www.myshape.com/search",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return <SearchClient initialQuery={params.q || ""} />;
}
