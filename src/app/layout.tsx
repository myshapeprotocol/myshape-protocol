import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import HeroVisual from "@/components/hero/HeroVisual";
import React from "react";
import type { Metadata, Viewport } from "next"; // 引入类型定义

export const metadata: Metadata = {
  title: "MyShape Protocol",
  description: "Identity as motion.",
};

// ⭐ 修复点：添加 viewport 配置，防止移动端自动缩放，提升手感
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 禁用手动缩放，确保 UI 在手机端保持精密感
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* 这里由 Next.js 自动注入 metadata 和 viewport */}
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#02040a", // 确保首屏加载时的背景色统一
          overflowX: "hidden",   // 严格禁止横向滚动
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ⭐ 全站星空背景 - 保留原有逻辑与排版 */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <HeroVisual showCore={false} />
        </div>

        {/* ⭐ 页面内容 - 保留原有层级，确保内容撑满屏幕 */}
        <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
          {children}
        </div>
      </body>
    </html>
  );
}