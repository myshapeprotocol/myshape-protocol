"use client";

const COLORS = ["#90c8ff", "#d4af37", "#a78bfa", "#90c8ff"];
const PARTICLE_COUNT = 30;

/** Radial particle burst — ceremonial flourish on proof completion. */
export default function ParticleBurst() {
  return (
    <>
      {[...Array(PARTICLE_COUNT)].map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * 120;
        const y = Math.sin(angle) * 120;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
            style={{
              width: 4,
              height: 4,
              background: COLORS[i % 4],
              boxShadow: `0 0 10px ${COLORS[i % 4]}`,
              animation: `ceremonyParticle 2s ease-out ${i * 0.05}s forwards`,
              transform: `translate(${x}px, ${y}px)`,
            }}
          />
        );
      })}
    </>
  );
}
