"use client";
import React, { useRef, useEffect, useState } from 'react';

// 注意：這裡接收的是 isGenesisActive，用於在創世按鈕點擊後觸發
export default function LiveCapture({ activeStage }: { activeStage: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("IDLE");
  const poseRef = useRef<any>(null);

  useEffect(() => {
    // ⭐ 修改關鍵：我們只在 activeStage 為 0 (假設 0 是 Genesis 階段) 
    // 或者你特定的啟動開關下才運行。
    // 如果是 1-4 階段，此組件保持靜默，確保閱讀文章不卡頓。
    if (activeStage !== 0) {
      setStatus("IDLE");
      return;
    }

    let isActive = true;
    let stream: MediaStream | null = null;

    const startGenesisProtocol = async () => {
      try {
        setStatus("WAKING_HARDWARE");
        
        // 1. 先啟動攝像頭 (瞬間觸發)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 480, height: 360, frameRate: 15 } 
        });
        
        if (!isActive || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        setStatus("FETCHING_CORE");

        // 2. 只有在此時才加載 MediaPipe，將 10 秒等待轉化為儀式感
        if (!(window as any).Pose) {
          await new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
            s.onload = resolve;
            document.head.appendChild(s);
          });
        }

        setStatus("INITIALIZING_GENESIS");

        const poseObj = new (window as any).Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        poseObj.setOptions({ 
          modelComplexity: 0, 
          smoothLandmarks: true, 
          minDetectionConfidence: 0.5 
        });

        poseObj.onResults((results: any) => {
          if (!isActive || !canvasRef.current || !results.poseLandmarks) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#22d3ee'; // 保持你喜歡的青色
            ctx.lineWidth = 2;
            ctx.beginPath();
            // 繪製核心骨架
            [11, 12, 24, 23, 11].forEach((idx, i) => {
              const p = results.poseLandmarks[idx];
              if (p) {
                const x = p.x * canvas.width;
                const y = p.y * canvas.height;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
          }
        });

        poseRef.current = poseObj;
        setStatus("GENESIS_ACTIVE");

        const loop = async () => {
          if (isActive && videoRef.current && poseRef.current) {
            if (videoRef.current.readyState === 4) {
              await poseRef.current.send({ image: videoRef.current });
            }
            requestAnimationFrame(loop);
          }
        };
        loop();

      } catch (err: unknown) {
        // 摄像头不可用是正常情况（无摄像头/权限拒绝），静默处理
        const msg = (err as Error).name === "NotFoundError"
          ? "NO_CAMERA_FOUND"
          : (err as Error).name === "NotAllowedError"
          ? "CAMERA_DENIED"
          : "HARDWARE_UNAVAILABLE";
        setStatus(msg);
      }
    };

    startGenesisProtocol();

    return () => {
      isActive = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (poseRef.current) {
        try { poseRef.current.close(); } catch(e) {}
      }
    };
  }, [activeStage]);

  // 如果不是 Genesis 階段，渲染一個空的容器，不佔用資源
  if (activeStage !== 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-20">
      {/* 狀態提示：保持極簡與半透明 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#22d3ee] font-mono text-[10px] opacity-40 tracking-[0.5em] uppercase">
        {status === "GENESIS_ACTIVE" ? "" : status}
      </div>
      
      <video ref={videoRef} className="hidden" playsInline muted />
      
      <canvas 
        ref={canvasRef} 
        width={480} 
        height={360} 
        className="w-full h-full object-cover scale-x-[-1] opacity-40 mix-blend-screen" 
      />
    </div>
  );
}