import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import HeroVisual from "@/components/hero/HeroVisual";
import React from "react";

export const metadata = {
  title: "MyShape Protocol",
  description: "Identity as motion.",
};

// 修复点：为 children 添加了 React.ReactNode 类型定义，解决了 Vercel 的 Type error
export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflowX: "hidden",
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

        {/* ⭐ 页面内容 - 保留原有层级 */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}