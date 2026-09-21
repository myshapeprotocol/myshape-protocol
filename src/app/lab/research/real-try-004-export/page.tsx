"use client";

// ══════════════════════════════════════════════════════════════════
// REAL-TRY-004 — read-only JSON export page (data egress only).
//
// Calls the EXISTING public logger API (getRunsByEngine) and renders its
// result. Does NOT modify, recompute, filter-by-verdict, or rewrite any
// recorded value; does not touch challenge/threshold/verdict logic.
// Purpose: let the phone hand its persisted EE-003 runs to the offline
// analyzer (scripts/analyze-real-try-004.mjs) as verbatim JSON.
// ══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { getRunsByEngine } from "@/lib/experiment-logger";

export default function RealTry004ExportPage() {
  const [runs, setRuns] = useState<ReturnType<typeof getRunsByEngine>>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRuns(getRunsByEngine("EE-003"));
  }, []);

  const json = useMemo(() => JSON.stringify(runs, null, 2), [runs]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can still select from the textarea
    }
  }

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `real-try-004-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-lg font-semibold">REAL-TRY-004 · EE-003 JSON 导出</h1>
      <p className="text-xs opacity-60">
        只读导出本机 localStorage 中的 EE-003 runs(原样字段,不重算)。
        复制或下载后保存到仓库外的 .json 文件,交给 analyzer:
        <code className="ml-1">node scripts/analyze-real-try-004.mjs &lt;export.json&gt;</code>
      </p>
      {runs.length === 0 ? (
        <p className="text-sm text-red-400">
          本机没有找到 EE-003 runs —— 请确认是在跑实验的同一台设备/浏览器上打开本页。
        </p>
      ) : (
        <p className="text-sm">
          共 <strong>{runs.length}</strong> 个 EE-003 runs。
          ⚠️ 不要点其他页面的 Clear 按钮,那会清空数据。
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={runs.length === 0}
          className="px-3 py-1.5 border border-white/20 rounded text-xs hover:bg-white/10 disabled:opacity-30"
        >
          {copied ? "✓ 已复制" : "📋 复制 JSON"}
        </button>
        <button
          onClick={handleDownload}
          disabled={runs.length === 0}
          className="px-3 py-1.5 border border-white/20 rounded text-xs hover:bg-white/10 disabled:opacity-30"
        >
          ⬇️ 下载 .json
        </button>
      </div>
      <textarea
        readOnly
        value={json}
        rows={16}
        className="w-full font-mono text-[11px] p-3 border border-white/10 bg-black/40 rounded"
      />
    </div>
  );
}
