import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "MyShape Protocol";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#02040a",
          fontFamily: "monospace",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        {/* Dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "radial-gradient(circle, rgba(144,200,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Left accent */}
        <div
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0, width: 4,
            background: "linear-gradient(to bottom, #90c8ff, #d4af37)",
          }}
        />
        {/* Top label */}
        <div
          style={{
            color: "rgba(144,200,255,0.5)",
            fontSize: 16,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          The Continuity Lab
        </div>
        {/* Title */}
        <div
          style={{
            color: "#fff",
            fontSize: 48,
            fontWeight: 300,
            letterSpacing: "0.03em",
            lineHeight: 1.2,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {/* Bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 100,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#90c8ff",
              boxShadow: "0 0 10px rgba(144,200,255,0.6)",
            }}
          />
          <div
            style={{
              color: "rgba(144,200,255,0.5)",
              fontSize: 16,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            MyShape Protocol
          </div>
        </div>
        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 60, right: 100,
            color: "rgba(255,255,255,0.18)",
            fontSize: 14, letterSpacing: "0.2em",
          }}
        >
          myshape.com/blog
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
