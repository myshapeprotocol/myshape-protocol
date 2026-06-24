"use client";
import React, { useEffect, useState } from "react";
import "./genesis-badge.css";

export default function GenesisBadge() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1") {
      setEmail(sessionStorage.getItem("genesis_email") || "");
      setStatus(sessionStorage.getItem("genesis_status") || "ACTIVE");
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const isGenesis = status === "GENESIS_NODE";
  const masked = email
    ? `${email.slice(0, 3)}****${email.slice(-4)}`
    : "UNKNOWN_NODE";

  return (
    <div className={`genesis-badge ${isGenesis ? "tier-genesis" : "tier-active"}`}>
      {/* 粒子流边框 */}
      <div className="genesis-badge-border" />
      <div className="genesis-badge-glow" />

      {/* 内容 */}
      <div className="genesis-badge-inner">
        {/* 顶部状态点 */}
        <div className="genesis-badge-header">
          <div className="genesis-badge-dot" />
          <span className="genesis-badge-tier">
            {isGenesis ? "GENESIS_COHORT" : "ACTIVE_NODE"}
          </span>
        </div>

        {/* 主标题 */}
        <div className="genesis-badge-title">
          {isGenesis ? "FOUNDING_ENTITY" : "IDENTITY_VERIFIED"}
        </div>

        {/* 底部信息 */}
        <div className="genesis-badge-footer">
          <span className="genesis-badge-sig">
            SIG: {masked}
          </span>
          <span className="genesis-badge-status">
            {isGenesis ? "PERMANENT_TIER" : "ACTIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
