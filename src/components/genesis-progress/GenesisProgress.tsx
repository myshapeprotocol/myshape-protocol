"use client";
import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import "./genesis-progress.css";

const MAX_SLOTS = 100;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function GenesisProgress() {
  const [count, setCount] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // 首次加载从 API 获取
    fetch("/api/nodes/count")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.genesis_nodes === "number") {
          setCount(data.genesis_nodes);
        }
      })
      .catch(() => {});

    // 实时订阅 genesis 节点变化
    if (!supabase) return;

    const channel = supabase
      .channel("genesis_progress")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "protocol_nodes",
          filter: "status=eq.GENESIS_NODE",
        },
        () => {
          // 有更新时重新获取计数
          fetch("/api/nodes/count")
            .then((r) => r.json())
            .then((data) => {
              if (typeof data.genesis_nodes === "number") {
                setAnimating(true);
                setCount(data.genesis_nodes);
                setTimeout(() => setAnimating(false), 600);
              }
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const current = count ?? 0;
  const pct = Math.min((current / MAX_SLOTS) * 100, 100);
  const remaining = MAX_SLOTS - current;
  const showCount = current > 3; // 人数太少时不显示数字

  return (
    <div className="genesis-progress-root">
      {/* 标签行 */}
      <div className="genesis-progress-header">
        <div className="flex items-center gap-2">
          <div className="genesis-progress-dot" />
          <span className="genesis-progress-label">PHASE: GENESIS_ALPHA</span>
        </div>
        {showCount ? (
          <span className="genesis-progress-count">
            <span className="genesis-progress-current">{current}</span>
            <span className="genesis-progress-sep">/</span>
            <span className="genesis-progress-max">{MAX_SLOTS}</span>
            <span className="genesis-progress-remaining">
              &nbsp;— {remaining > 0 ? `${remaining} SLOTS_REMAIN` : 'COHORT_FULL'}
            </span>
          </span>
        ) : null}
      </div>

      {/* 进度条 */}
      <div className="genesis-progress-track">
        <div
          className={`genesis-progress-fill ${animating ? "genesis-progress-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
        {/* 扫光线 */}
        <div className="genesis-progress-scan" />
      </div>

      {/* 底部状态字 */}
      <div className="genesis-progress-footer">
        <span className="genesis-progress-footer-text">
          {remaining > 0
            ? "FOUNDING_ENTITY_TIER — PERMANENT_STATUS — NEVER_OFFERED_AGAIN"
            : "GENESIS_COHORT_SEALED — ALL_100_SLOTS_CLAIMED"}
        </span>
      </div>
    </div>
  );
}
