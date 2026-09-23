"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Returns the correct path prefix for LAB navigation based on host.
 * - LAB domain (thecontinuitylab.org): use canonical paths (/protocols, etc.)
 * - Localhost / preview: use /lab/ prefix for LAB preview namespace
 */
export function useLabPath(): (path: string) => string {
  const pathname = usePathname();

  // Detect if we're in LAB context by checking if current path starts with /lab
  const isLabContext = pathname?.startsWith("/lab");

  return (path: string) => {
    // If already has /lab prefix, return as-is
    if (path.startsWith("/lab/")) return path;

    // LAB home resolves to /lab in the preview namespace and / on the LAB domain
    if (path === "/") return isLabContext ? "/lab" : "/";

    // In LAB context on localhost, use /lab/ prefix
    if (isLabContext) {
      return `/lab${path}`;
    }

    // On LAB production domain, use canonical path
    return path;
  };
}

/* ═══════════════════════════════════════════════════════════════════
   LabHeader — minimal Continuity Lab navigation shell.

   IA (localhost preview → /lab/* namespace):
     LAB HOME    → /lab
     PROTOCOLS   → /lab/protocols
     RESEARCH    → /lab/research
     DEVELOP     → /lab/develop
     CONTRIBUTE  → /lab/contribute

   Cross-site:
     MYSHAPE     → https://www.myshape.com (canonical product domain)

   No speculative pages. Every link targets a verified existing route.

   Visual language (frozen):
   - Monospace-only type (Geist Mono) with wide tracking + single cyan accent.
   - Balanced 60px instrument bar on a 1080px grid.
   - Hover-glow states for every nav item; active route gets a glowing
     underline. External CTA is a refined pill with inset/outer glow.
   ═══════════════════════════════════════════════════════════════════ */

const NAV = [
  { label: "LAB HOME", href: "/" },
  { label: "Protocols", href: "/protocols" },
  { label: "Research", href: "/research" },
  { label: "Develop", href: "/develop" },
  { label: "Contribute", href: "/contribute" },
];

const EXTERNAL = [{ label: "MyShape", href: "https://www.myshape.com" }];

export default function LabHeader() {
  const pathname = usePathname();
  const labPath = useLabPath();

  return (
    <header
      className="lab-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: "rgba(5, 16, 37, 0.86)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      <style>{`
        .lab-header { box-shadow: inset 0 -1px 0 rgba(0,229,255,0.08); }
        .lab-header::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, rgba(0,229,255,0.4), transparent);
        }
        .lab-header-inner {
          max-width: 1080px; margin: 0 auto; padding: 0 24px; height: 60px;
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
        }
        /* Symmetric spacer keeps the nav optically centered with the CTA docked right */
        .lab-header-spacer { display: flex; justify-content: flex-end; }
        .lab-nav {
          display: flex; align-items: center; justify-content: center; gap: 2px;
          min-width: 0; overflow-x: auto; scrollbar-width: none;
        }
        .lab-nav::-webkit-scrollbar { display: none; }
        .lab-nav-link {
          position: relative; display: inline-flex; align-items: center;
          font-size: 10px; letter-spacing: 0.18em; padding: 9px 11px;
          text-transform: uppercase; text-decoration: none; white-space: nowrap;
          color: rgba(255,255,255,0.45);
          transition: color 0.25s ease, text-shadow 0.25s ease;
        }
        .lab-nav-link::after {
          content: ""; position: absolute; left: 11px; right: 11px; bottom: 5px; height: 1px;
          background: rgba(0,229,255,0.8);
          box-shadow: 0 0 8px rgba(0,229,255,0.6);
          transform: scaleX(0); transform-origin: left center;
          transition: transform 0.3s ease;
        }
        .lab-nav-link:hover { color: #e6edf7; text-shadow: 0 0 12px rgba(0,229,255,0.5); }
        .lab-nav-link:hover::after { transform: scaleX(1); }
        .lab-nav-link.is-active { color: rgb(34, 211, 238); text-shadow: 0 0 14px rgba(34, 211, 238, 0.55); }
        .lab-nav-link.is-active::after { transform: scaleX(1); }
        .lab-cta {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
          color: rgba(0,229,255,0.78); text-decoration: none; text-transform: uppercase; white-space: nowrap;
          padding: 8px 18px; border: 1px solid rgba(0,229,255,0.22); border-radius: 999px;
          background: rgba(0,229,255,0.04);
          transition: color 0.3s ease, border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .lab-cta:hover {
          color: #fff; border-color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.09);
          box-shadow: 0 0 20px rgba(0,229,255,0.18), inset 0 0 12px rgba(0,229,255,0.05);
          transform: translateY(-1px);
        }
        @media (max-width: 760px) {
          .lab-header-inner { padding: 0 14px; height: 56px; }
          .lab-nav-link { letter-spacing: 0.12em; padding: 9px 8px; }
          .lab-cta { padding: 7px 14px; }
        }
      `}</style>
      <div className="lab-header-inner">
        {/* Left spacer — keeps nav optically centered */}
        <div className="lab-header-spacer" aria-hidden="true" />

        {/* Primary nav — centered protocol control strip */}
        <nav className="lab-nav">
          {NAV.map((link) => {
            const resolvedHref = labPath(link.href);
            const isRoot = link.href === "/";
            const active =
              pathname === resolvedHref ||
              (!isRoot && pathname.startsWith(resolvedHref + "/"));
            return (
              <Link
                key={link.href}
                href={resolvedHref}
                className={`lab-nav-link${active ? " is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right dock — cross-site CTA */}
        <div className="lab-header-spacer">
          {EXTERNAL.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="lab-cta"
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
