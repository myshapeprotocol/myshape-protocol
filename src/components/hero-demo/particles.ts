/**
 * Particle factory and scene initialization — extracted from HeroDemo.tsx.
 *
 * Particle math is 100% identical to HeroVisual's torus model:
 *   angle determines (x,z) on the torus ring
 *   radius determines ring size
 *   y is the vertical offset
 *   speed controls angular velocity
 */
import type { Particle } from "./HeroDemo";

/** Number of torus particles — reduced on mobile for performance. */
export function getTorusCount(): number {
  if (typeof window === "undefined") return 1500;
  return window.innerWidth < 768 ? 600 : 1500;
}

/** Create a single torus particle with default parameters. Pure factory. */
export function makeBaseParticle(): Particle {
  const r = Math.random() * 120;
  const y = (Math.random() - 0.5) * 300;
  const s = 0.008 + Math.random() * 0.022;
  return {
    angle: Math.random() * Math.PI * 2,
    radius: r,
    y,
    speed: s,
    baseRadius: r,
    baseY: y,
    baseSpeed: s,
    targetRadius: r,
    targetY: y,
    wavePhase: Math.random() * Math.PI * 2,
    clusterIdx: -1,
    clusterX: 0,
    clusterY: 0,
  };
}

/**
 * Generate particles for the given scene. Mutates the provided array in place.
 *
 * S1 (formation): particles scattered wide → converge to standard torus
 * S2/S3 (motion/genesis): standard torus distribution
 * S4 (mesh): 4-node diamond topology — N/E/S/W clusters
 */
export function initParticles(
  name: string,
  target: Particle[],
  canvasH: number,
): void {
  target.length = 0;
  const count = getTorusCount();

  if (name === "formation") {
    // S1: scattered → converge to target torus
    for (let i = 0; i < count; i++) {
      const p = makeBaseParticle();
      p.radius = 80 + Math.random() * 200;
      p.y = (Math.random() - 0.5) * canvasH * 0.8;
      p.targetRadius = p.baseRadius;
      p.targetY = p.baseY;
      target.push(p);
    }
  } else if (name === "mesh") {
    // S4: 4-node cardinal layout
    const clusters = [
      { x: 0, y: -120, s: 0.5 },
      { x: -130, y: 30, s: 0.45 },
      { x: 130, y: 30, s: 0.45 },
      { x: 0, y: 130, s: 0.48 },
    ];
    const per = Math.floor(count / clusters.length);
    for (let ci = 0; ci < clusters.length; ci++) {
      const cl = clusters[ci];
      for (let i = 0; i < per; i++) {
        const p = makeBaseParticle();
        p.baseRadius *= cl.s;
        p.radius = p.baseRadius;
        p.targetRadius = p.baseRadius;
        p.baseY *= cl.s;
        p.y = p.baseY;
        p.targetY = p.baseY;
        p.baseSpeed *= 1 + Math.random() * 0.5;
        p.speed = p.baseSpeed;
        p.clusterIdx = ci;
        p.clusterX = cl.x;
        p.clusterY = cl.y;
        target.push(p);
      }
    }
  } else {
    // S2/S3: standard torus
    for (let i = 0; i < count; i++) {
      target.push(makeBaseParticle());
    }
  }
}
