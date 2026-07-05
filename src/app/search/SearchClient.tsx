"use client";

import { useState, useEffect, useCallback } from "react";

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      setSubmitted(true);
      // Delegate to Google site search
      window.location.href = `https://www.google.com/search?q=site%3Amyshape.com+${encodeURIComponent(trimmed)}`;
    },
    [query],
  );

  // Auto-submit if query was passed via URL (e.g. from SearchAction)
  useEffect(() => {
    if (initialQuery.trim() && !submitted) {
      setSubmitted(true);
      window.location.href = `https://www.google.com/search?q=site%3Amyshape.com+${encodeURIComponent(initialQuery.trim())}`;
    }
  }, [initialQuery, submitted]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(2rem, 5vw, 4rem) 1rem" }}>
      <h1
        style={{
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "var(--foreground, #ededed)",
        }}
      >
        Search MyShape Protocol
      </h1>
      <p
        style={{
          color: "var(--foreground, #ededed)",
          opacity: 0.6,
          marginBottom: "2rem",
          fontSize: "0.95rem",
          lineHeight: 1.6,
        }}
      >
        Search across protocol docs, blog posts, papers, and technical specifications.
        Results are provided by Google site search.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "motion-signature", "zero-knowledge proof", "genesis ritual"'
          autoFocus
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--foreground, #ededed)",
            fontSize: "1rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            background: "var(--color-accent, #4da8da)",
            color: "#02040a",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Search
        </button>
      </form>

      <div style={{ marginTop: "3rem", opacity: 0.5, fontSize: "0.85rem" }}>
        <p>
          Looking for something specific? Try these:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          {[
            "motion-signature",
            "zero-knowledge proof",
            "presence entropy",
            "genesis ritual",
            "sovereign identity",
            "protocol architecture",
          ].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQuery(term);
                window.location.href = `https://www.google.com/search?q=site%3Amyshape.com+${encodeURIComponent(term)}`;
              }}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--foreground, #ededed)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
