"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

/* -------------------------------------------------------
   Utility: Genesis ID Generator
------------------------------------------------------- */
function makeGenesisId() {
  const t = Date.now().toString(16).toUpperCase();
  const r = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `GNS_${t.slice(-6)}_${r}`;
}

/* -------------------------------------------------------
   Mouse Influence — MUST run inside Canvas
------------------------------------------------------- */
const MouseTracker = ({ mouseRef }: any) => {
  const { size, camera } = useThree();

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      mouseRef.current.set(x, y);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [size, camera]);

  return null;
};

/* -------------------------------------------------------
   Scroll Energy (safe outside Canvas)
------------------------------------------------------- */
const useScrollEnergy = () => {
  const energyRef = useRef(1);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const delta = e.deltaY * 0.001;
      energyRef.current = THREE.MathUtils.clamp(
        energyRef.current + delta,
        0.7,
        1.6
      );
    };
    window.addEventListener("wheel", handleScroll);
    return () => window.removeEventListener("wheel", handleScroll);
  }, []);

  return energyRef;
};

/* -------------------------------------------------------
   Core Being — 脊柱型能量生命体
------------------------------------------------------- */
const CoreBeing = ({ scrollEnergyRef, mouseRef }: any) => {
  const coreRef = useRef<THREE.Points>(null);
  const contractRef = useRef(0);

  const { chaotic, target } = useMemo(() => {
    const count = 1800;
    const chaos = new Float32Array(count * 3);
    const tgt = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const y = (Math.random() - 0.5) * 1.8;
      const spineStrength = Math.pow(1 - Math.abs(y) / 1.8, 4);
      const rSpine = (0.05 + Math.random() * 0.1) * spineStrength;
      const angle = Math.random() * Math.PI * 2;

      // Chaotic: wide sphere — screen-filling, Y stable
      const chaosR = 4 + Math.random() * 1.5;
      const chaosTheta = Math.random() * Math.PI * 2;
      const chaosPhi = Math.acos(2 * Math.random() - 1);

      chaos[i * 3] = chaosR * Math.sin(chaosPhi) * Math.cos(chaosTheta);
      chaos[i * 3 + 1] = y;
      chaos[i * 3 + 2] = chaosR * Math.sin(chaosPhi) * Math.sin(chaosTheta);

      // Spine: tight sovereign core
      const noiseX = Math.cos(angle) * rSpine;
      const noiseZ = Math.sin(angle) * rSpine;
      const forwardTilt = y * 0.18;

      tgt[i * 3] = noiseX;
      tgt[i * 3 + 1] = y;
      tgt[i * 3 + 2] = noiseZ + forwardTilt;
    }
    return { chaotic: chaos, target: tgt };
  }, []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (!coreRef.current) return;

    // Lerp contraction: chaotic → sovereign spine over ~2s
    contractRef.current = Math.min(contractRef.current + 0.012, 1);
    const lerp = contractRef.current;
    const pos = coreRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count * 3; i++) {
      pos.array[i] = chaotic[i] + (target[i] - chaotic[i]) * lerp;
    }
    pos.needsUpdate = true;

    const energy = scrollEnergyRef.current;
    const pulse =
      1 +
      Math.sin(t * 1.8) * 0.05 * energy +
      Math.cos(t * 3.2) * 0.02 * energy;
    coreRef.current.scale.setScalar(pulse);

    coreRef.current.rotation.y = Math.sin(t * 0.4) * 0.18 * energy;
    coreRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;

    const mat = coreRef.current.material as THREE.PointsMaterial;
    if (mat) {
      const mouse = mouseRef.current.clone();
      const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5);
      vec.unproject(camera);
      const dist = vec.length();
      const influence = THREE.MathUtils.clamp(1.4 - dist, 0.8, 1.6);
      mat.size = 0.01 * influence;
      mat.opacity = 0.7 + (influence - 1) * 0.4;
    }
  });

  return (
    <points ref={coreRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[chaotic, 3]}
          count={chaotic.length / 3}
          array={chaotic}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.01}
        color="#9fbfff"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */
export default function IdentityLabPage() {
  const scrollEnergyRef = useScrollEnergy();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const [genesisId] = useState(makeGenesisId);

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <MouseTracker mouseRef={mouseRef} />

        <ambientLight intensity={1.4} />

        <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.7}>
          <group>
            <CoreBeing scrollEnergyRef={scrollEnergyRef} mouseRef={mouseRef} />
          </group>
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          autoRotate={false}
          rotateSpeed={0.6}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>

      {/* GENESIS_TELEMETRY HUD — bottom-center */}
      <section className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
        <div className="mx-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-md font-mono">
            <div className="pointer-events-none absolute -inset-[1px] rounded-md border border-cyan-200/20" />
            <div className="relative rounded-md border border-cyan-200/20 bg-transparent p-3 md:p-4">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-cyan-200/60 shadow-[0_0_18px_rgba(144,200,255,0.55)] identity-scan" />

              {/* Telemetry Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="text-[9px] tracking-[0.7em] uppercase text-white/45">
                  GENESIS_TELEMETRY
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70 identity-pulse" />
                    <span className="text-[9px] tracking-[0.5em] uppercase text-white/35">
                      IDENTITY_ESTABLISHED
                    </span>
                  </div>
                  <span className="text-[9px] tracking-[0.5em] uppercase text-white/25">
                    IDENTITY_LAYER_INITIALIZED
                  </span>
                </div>
              </div>

              {/* Telemetry Data */}
              <div className="mt-3 grid grid-cols-1 gap-2 text-[10px] tracking-[0.28em] uppercase">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/30">GENESIS_SECTOR</span>
                  <span className="text-cyan-200/85">IDENTITY_LAYER</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/30">SECTOR_KEY</span>
                  <span className="text-cyan-200/85">{genesisId}</span>
                </div>
              </div>

              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />

              <style>{`
                .identity-scan {
                  animation: identityScan 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes identityScan {
                  0% { transform: translateY(0); opacity: 0.15; }
                  100% { transform: translateY(260px); opacity: 0.15; }
                }
                .identity-pulse {
                  animation: identityPulse 1.4s ease-in-out infinite;
                }
                @keyframes identityPulse {
                  0%, 100% { transform: scale(1); opacity: 0.6; }
                  50% { transform: scale(1.35); opacity: 1; }
                }
              `}</style>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
