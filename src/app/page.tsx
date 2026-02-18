"use client";

import React from "react";
import Hero from "@/components/hero/Hero";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";
// 确保路径完全匹配项目实际文件夹名
import ProtocolHeader from "@/components/header/header"; 
import ProtocolFooter from "@/components/footer/footer";

export default function HomePage() {
  return (
    <>
      <ProtocolHeader />
      <main
        style={{
          background: "transparent",
          overflowX: "hidden",
          width: "100%",
          position: "relative", // 替代 flex，确保层级正确
        }}
      >
        <Hero />
        <Vision />
        <Capabilities />
        <HowItWorks />
        <JoinWaitlist />
      </main>
      <ProtocolFooter />
    </>
  );
}