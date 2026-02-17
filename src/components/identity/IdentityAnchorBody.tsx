"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

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

  const coreData = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const spineY = (Math.random() - 0.5) * 1.8;
      const spineStrength = Math.pow(1 - Math.abs(spineY) / 1.8, 2);
      const verticalBias = spineY > 0 ? 1.4 : 0.7;
      const radial = 0.08 + Math.random() * 0.18 * verticalBias;
      const angle = Math.random() * Math.PI * 2;
      const noiseX = Math.cos(angle) * radial * spineStrength;
      const noiseZ = Math.sin(angle) * radial * spineStrength;
      const forwardTilt = spineY * 0.18;

      positions[i * 3] = noiseX;
      positions[i * 3 + 1] = spineY;
      positions[i * 3 + 2] = noiseZ + forwardTilt;
    }
    return positions;
  }, []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    if (!coreRef.current) return;

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
          args={[coreData, 3]}
          count={coreData.length / 3}
          array={coreData}
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
   Energy Flow — 螺旋能量轨迹
------------------------------------------------------- */
const EnergyFlow = ({ scrollEnergyRef }: any) => {
  const flowRef = useRef<THREE.Points>(null);

  const flowData = useMemo(() => {
    const count = 2200;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6;
      const radius = 0.6 + t * 0.9 + (Math.random() - 0.5) * 0.15;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.15;
      const y = (t - 0.5) * 2.0 + Math.sin(angle * 0.5) * 0.25 + (Math.random() - 0.5) * 0.12;
      const z = Math.sin(angle) * radius * 0.6 + (Math.random() - 0.5) * 0.4;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (!flowRef.current) return;
    const t = clock.getElapsedTime();
    const energy = scrollEnergyRef.current;

    flowRef.current.rotation.z = -t * 0.25 * energy;
    flowRef.current.rotation.x = Math.sin(t * 0.6) * 0.25;
    const scale = 1 + Math.sin(t * 1.6) * 0.08 * energy;
    flowRef.current.scale.setScalar(scale);
  });

  return (
    <points ref={flowRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[flowData, 3]}
          count={flowData.length / 3}
          array={flowData}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#80bfff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/* -------------------------------------------------------
   Outer Field — 深空粒子场
------------------------------------------------------- */
const OuterField = () => {
  const fieldRef = useRef<THREE.Points>(null);

  const fieldData = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame(({ clock }) => {
    if (!fieldRef.current) return;
    const t = clock.getElapsedTime();
    fieldRef.current.rotation.y = t * 0.05;
    fieldRef.current.position.y = Math.sin(t * 0.25) * 0.12;
  });

  return (
    <points ref={fieldRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[fieldData, 3]}
          count={fieldData.length / 3}
          array={fieldData}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.006}
        color="#d1f7ff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */
const IdentityAnchorBody = () => {
  const scrollEnergyRef = useScrollEnergy();
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  return (
    <div className="w-full h-screen relative bg-transparent overflow-visible">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <MouseTracker mouseRef={mouseRef} />

        <ambientLight intensity={1.4} />

        <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.7}>
          <group>
            <CoreBeing scrollEnergyRef={scrollEnergyRef} mouseRef={mouseRef} />
            <EnergyFlow scrollEnergyRef={scrollEnergyRef} />
            <OuterField />
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
    </div>
  );
};

export default IdentityAnchorBody;