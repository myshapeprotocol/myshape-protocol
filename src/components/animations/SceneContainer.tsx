'use client';
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Starfield from '../hero/Starfield'; // <-- 修改这里，跨文件夹引用

export default function SceneContainer() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Starfield />
        </Suspense>
      </Canvas>
    </div>
  );
}