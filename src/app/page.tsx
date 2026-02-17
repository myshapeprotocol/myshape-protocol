"use client";

import React from "react";
import Hero from "@/components/hero/Hero";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";
// 路径修正：确保与文件夹/文件名的小写一致
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
        
        <JoinWaitlist />

        <ProtocolFooter />
      </main>
    </>
  );
}