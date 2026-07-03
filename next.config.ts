import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Scripts: self + eval for dev (Next.js Fast Refresh), MediaPipe CDN (scoped)
  IS_PROD
    ? "script-src 'self' https://cdn.jsdelivr.net/npm/@mediapipe/ https://va.vercel-scripts.com"
    : "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net/npm/@mediapipe/ https://va.vercel-scripts.com",
  // Styles: Tailwind needs 'unsafe-inline'
  "style-src 'self' 'unsafe-inline'",
  // Images: self + Supabase storage + data URIs
  "img-src 'self' data: https://*.supabase.co",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Connections: API + Supabase + WebSocket + MediaPipe
  IS_PROD
    ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://vitals.vercel-insights.com"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://vitals.vercel-insights.com ws://localhost:*",
  // Frames: none (no embeds needed)
  "frame-src 'none'",
  // Media: self only
  "media-src 'self'",
  // Workers: self
  "worker-src 'self' blob:",
  // Base URI: self
  "base-uri 'self'",
  // Form action: self
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  // ── Security headers applied to all routes ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // ── Static asset caching: 1 year immutable ──
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ── Public assets (images, fonts, etc.) — 1 week stale-while-revalidate ──
      {
        source: "/(.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      // ── API routes — no caching ──
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
