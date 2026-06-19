"use client";

import { useEffect } from "react";

/**
 * CanonicalLink — 为 "use client" 页面注入规范 URL
 *
 * SEO 用途：告诉 Google 这个页面的规范版本是哪个 URL。
 * 用于 /civ-layer/* 镜像路由 → 指向主路由，消除重复内容惩罚。
 *
 * GEO 用途：AI 爬虫读取 canonical 标签时会只索引规范版本，
 * 避免品牌概念在两个 URL 上分散权重。
 */
export default function CanonicalLink({ href }: { href: string }) {
  useEffect(() => {
    // 移除已有的 canonical link（如果有）
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) existing.remove();

    // 注入新的
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [href]);

  return null;
}
