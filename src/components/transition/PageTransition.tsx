"use client";
import { useEffect, useRef } from "react";

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
