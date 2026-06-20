"use client";

export const useProtocolSound = () => {
  const playTick = (type: 'typewriter' | 'hover') => {
    // 确保只在浏览器端运行
    if (typeof window === 'undefined') return;

    const audioCtx = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'typewriter') {
      // 打字机声：更清脆，频率高
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // 极小声
    } else {
      // 悬停声：更低沉，有质感
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
    }

    oscillator.start();
    // 声音只持续 0.05 秒，形成“滴答”感
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
    oscillator.stop(audioCtx.currentTime + 0.05);
  };

  return { playTick };
};