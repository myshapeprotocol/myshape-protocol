"use client";

import React from "react";
import Hero from "@/components/hero/Hero";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";
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
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <Hero />
        <Vision />
        <Capabilities />
        <HowItWorks />
        
        {/* 注意：如果 JoinWaitlist 内部自带了截图中的那两行小字，
           建议进入该组件代码中，将那部分文字删除或注释掉。
        */}
        <JoinWaitlist />

        <ProtocolFooter />
      </main>
    </>
  );
}