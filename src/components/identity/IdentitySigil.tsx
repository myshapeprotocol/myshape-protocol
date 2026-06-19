"use client";
import React from "react";

export default function IdentitySigil() {
  return (
    <div className="sigil-wrapper">
      <div className="sigil-container">
        <img
          src="/identity-sigil.jpg"
          alt="Identity Sigil"
          className="sigil-image"
          draggable={false}
        />
      </div>

      <style>{`
        .sigil-wrapper {
          display: flex;
          justify-content: center;
          height: 120px;
          position: relative;
          top: 35px;
          z-index: 1;
          animation: sigilBreathe 4s ease-in-out infinite;
        }

        .sigil-container {
          position: relative;
          height: 100%;
          mix-blend-mode: screen;
          filter: drop-shadow(0 0 20px rgba(0, 200, 255, 0.06))
                  drop-shadow(0 0 60px rgba(0, 200, 255, 0.03));
        }

        .sigil-image {
          height: 100%;
          width: auto;
          display: block;
          mix-blend-mode: screen;
          pointer-events: none;
          user-select: none;
          mask-image: radial-gradient(circle, black 60%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle, black 60%, transparent 100%);
        }

        @keyframes sigilBreathe {
          0%, 100% { opacity: 0.38; }
          50% { opacity: 0.42; }
        }
      `}</style>
    </div>
  );
}
