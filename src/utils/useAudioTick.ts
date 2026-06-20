"use client";

let _ctx: AudioContext | null = null;
let _warmed = false;

function warmUp() {
  if (_warmed || typeof window === "undefined") return;
  _warmed = true;
  const resume = () => {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _ctx.resume();
  };
  document.addEventListener("click", resume, { once: true });
  document.addEventListener("touchstart", resume, { once: true });
  document.addEventListener("mouseenter", resume, { once: true });
}
warmUp();

export async function playTick(freq = 800, type: OscillatorType = "triangle", duration = 0.04, vol = 0.012) {
  if (typeof window === "undefined") return;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // 每次调用都尝试恢复（浏览器可能在后台暂停 AudioContext）
  if (_ctx.state === "suspended") await _ctx.resume();
  if (_ctx.state !== "running") return;
  try {
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, _ctx.currentTime);
    gain.gain.setValueAtTime(vol, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, _ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start();
    osc.stop(_ctx.currentTime + duration);
  } catch {
    // 静默
  }
}
