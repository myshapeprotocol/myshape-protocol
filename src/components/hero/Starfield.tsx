'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield() {
  const ref = useRef<THREE.Points>(null!);
  const count = 4000;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 100; // X
      arr[i * 3 + 1] = (Math.random() - 0.5) * 100; // Y
      arr[i * 3 + 2] = -20 - Math.random() * 130;   // Z 深度
    }
    return arr;
  }, []);

  const sizes = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() > 0.9 ? 0.02 : 0.008; // 大星星 / 小星星
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    const geo = ref.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const isBig = sizes[i] > 0.01;
      const speed = isBig ? delta * 6 : delta * 4;

      pos[i * 3 + 2] += speed;

      if (pos[i * 3 + 2] > 0) {
        pos[i * 3 + 2] = -150;
      }
    }

    geo.attributes.position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        {/* 核心修复：添加 args 解决 Vercel 报错，并将 attach 改为连字符格式 */}
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#88ccff"
        transparent
        opacity={0.9}
        size={0.015}
        sizeAttenuation
      />
    </points>
  );
}