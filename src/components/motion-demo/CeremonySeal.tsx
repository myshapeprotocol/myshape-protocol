"use client";

/** Ceremony completion seal — gold SVG insignia rendered on proof completion. */
export default function CeremonySeal() {
  return (
    <div className="relative w-36 h-36 motion-demo__ceremony-seal">
      <svg viewBox="0 0 140 140" className="w-full h-full">
        <defs>
          <radialGradient id="sealGlow">
            <stop offset="0%" stopColor="rgba(212,175,55,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="sealGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#f0d060" />
            <stop offset="100%" stopColor="#b8941f" />
          </linearGradient>
        </defs>
        {/* Outer glow */}
        <circle cx="70" cy="70" r="62" fill="url(#sealGlow)" />
        {/* Outer ring */}
        <circle cx="70" cy="70" r="50" fill="none" stroke="url(#sealGold)" strokeWidth="2" strokeDasharray="4 3" className="motion-demo__ceremony-ring" />
        {/* Inner ring */}
        <circle cx="70" cy="70" r="42" fill="rgba(10,8,4,0.8)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" />
        {/* Octagon border */}
        <polygon points="70,18 107,33 122,70 107,107 70,122 33,107 18,70 33,33" fill="none" stroke="rgba(212,175,55,0.4)" strokeWidth="1" />
        {/* Text */}
        <text x="70" y="62" textAnchor="middle" fill="rgba(212,175,55,0.5)" fontSize="6" fontFamily="monospace" letterSpacing="4">MYSHAPE</text>
        <text x="70" y="78" textAnchor="middle" fill="rgba(212,175,55,0.95)" fontSize="16" fontFamily="monospace" fontWeight="300" letterSpacing="2">SEALED</text>
        <text x="70" y="94" textAnchor="middle" fill="rgba(212,175,55,0.35)" fontSize="5" fontFamily="monospace" letterSpacing="3">PROTOCOL</text>
        {/* Star */}
        <polygon points="70,24 72,30 78,30 73,34 75,40 70,36 65,40 67,34 62,30 68,30" fill="rgba(212,175,55,0.6)" />
      </svg>
    </div>
  );
}
