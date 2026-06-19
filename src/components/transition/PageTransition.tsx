"use client";
import { useEffect, useRef } from "react";

/**
 * PageTransition — 全局页面过渡遮罩
 *
 * 所有页面切换通过 400ms 淡入淡出实现，消除硬切造成的白色闪屏。
 *
 * 使用方式：
 * - JS 导航：dispatchEvent(new CustomEvent("pt:navigate", { detail: { href: "/target" } }))
 * - <a> 链接：自动拦截（内部路由），无需修改
 *
 * 工作流程：
 *   离开旧页 → 遮罩淡入(400ms) → window.location.href → 新页加载
 *   → 遮罩从 opaque 淡出(400ms) → 隐藏
 */
export default function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    /* ───── 入场：新页面加载后自动淡出 ───── */
    const arriving = sessionStorage.getItem("pt_arriving") === "1";
    if (arriving) {
      sessionStorage.removeItem("pt_arriving");
      overlay.style.display = "block";
      // 强制重绘确保 display:block 生效
      void overlay.offsetHeight;
      overlay.style.opacity = "1";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.opacity = "0";
        });
      });
      timerRef.current = setTimeout(() => {
        overlay.style.display = "none";
      }, 500);
    }

    /* ───── 导航执行 ───── */
    const doNavigate = (href: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sessionStorage.setItem("pt_arriving", "1");
      overlay.style.display = "block";
      void overlay.offsetHeight;
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
      });
      timerRef.current = setTimeout(() => {
        window.location.href = href;
      }, 420);
    };

    /* ───── 监听自定义导航事件 ───── */
    const handleNavigate = (e: Event) => {
      doNavigate((e as CustomEvent).detail.href);
    };
    window.addEventListener("pt:navigate", handleNavigate);

    /* ───── 拦截内部 <a> 链接 ───── */
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // 仅拦截内部路由
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.getAttribute("target") === "_blank" ||
        anchor.getAttribute("download") !== null ||
        anchor.getAttribute("rel") === "noopener noreferrer"
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      doNavigate(href);
    };
    document.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("pt:navigate", handleNavigate);
      document.removeEventListener("click", handleClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        display: "none",
        zIndex: 99999,
        backgroundColor: "#02040a",
        opacity: "0",
        transition: "opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    />
  );
}
