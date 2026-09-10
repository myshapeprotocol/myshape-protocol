// QR Code SVG component using the qrcode library for production-scannable codes
"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export interface QRCodeSVGProps {
  value: string;
  size: number;
  bgColor: string;
  fgColor: string;
  level: string;
  includeMargin: boolean;
}

export default function QRCodeSVG({
  value,
  size,
  bgColor,
  fgColor,
  level,
  includeMargin,
}: QRCodeSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const ecLevel =
          level === "H"
            ? "H"
            : level === "Q"
            ? "Q"
            : level === "M"
            ? "M"
            : "L";

        const margin = includeMargin ? 4 : 0;
        const width = Math.max(21, size);

        const svg = await QRCode.toString(value, {
          type: "svg",
          errorCorrectionLevel: ecLevel,
          margin,
          width,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        });

        // Safety: only update if still mounted and container exists
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("QRCodeSVG generation failed:", err);
        }
      }
    }

    generate();

    return () => {
      cancelled = true;
    };
  }, [value, size, bgColor, fgColor, level, includeMargin]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        lineHeight: 0,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
      }}
    />
  );
}
