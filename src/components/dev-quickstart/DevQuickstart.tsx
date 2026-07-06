"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { playTick } from "@/utils/useAudioTick";
import "./dev-quickstart.css";

type Stage = "idle" | "registering" | "done" | "active" | "error";

interface DevNode {
  node_token: string;
  node_handle: string;
  email: string;
  curl_example: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const CLIENT_SNIPPET_JS = `// 5 lines to keep your node in sync
import { MyShapeClient } from '@myshapeprotocol/sdk';

const node = new MyShapeClient({
  token: 'ms_xxxxxxxx',  // ← your dev token
});

await node.connect();     // persistent presence stream
console.log(node.status); // { handle: 'DEV_XXXX', active: true }`;

const CLIENT_SNIPPET_PY = `# 5 lines to keep your node in sync
from myshape import Node

node = Node(token="ms_xxxxxxxx")  # ← your dev token

node.connect()                     # persistent presence stream
print(node.status)                 # { 'handle': 'DEV_XXXX', 'active': True }`;

export default function DevQuickstart() {
  const [handle, setHandle] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [node, setNode] = useState<DevNode | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [lang, setLang] = useState<"js" | "py">("js");
  const [ripple, setRipple] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup realtime channel + timeout on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase?.removeChannel(channelRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cleanupListeners = () => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const listenForActivation = (email: string) => {
    cleanupListeners();
    setTimedOut(false);

    if (!supabase) {
      // No Supabase client — fall back to timeout-only mode
      timeoutRef.current = setTimeout(() => setTimedOut(true), 90_000);
      return;
    }

    const channel = supabase
      .channel(`dev_activation_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "protocol_nodes",
          filter: `email=eq.${email}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if ((updated.scan_count as number) > 0) {
            setStage("active");
            setRipple(true);
            setTimedOut(false);
            playTick(1200, "sine", 0.15, 0.04);
            setTimeout(() => setRipple(false), 2000);
            cleanupListeners();
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Fallback: if no Realtime event within 120s, offer manual check
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
    }, 120_000);
  };

  const register = async () => {
    if (stage === "registering") return;
    playTick(800, "sine", 0.10, 0.025);
    setStage("registering");
    setErrorMsg("");

    try {
      const res = await fetch("/api/dev/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStage("error");
        setErrorMsg(data.error || "REGISTRATION_FAILED");
        return;
      }

      setNode(data);
      setStage("done");
      playTick(1200, "sine", 0.12, 0.03);

      // Start listening for activation
      listenForActivation(data.email);
    } catch {
      setStage("error");
      setErrorMsg("NETWORK_ERROR");
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    playTick(600, "sine", 0.06, 0.015);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    cleanupListeners();
    setStage("idle");
    setNode(null);
    setErrorMsg("");
    setHandle("");
    setRipple(false);
    setTimedOut(false);
  };

  // Manual re-check: poll API instead of waiting for Realtime
  const manualCheck = async () => {
    if (!node) return;
    playTick(700, "sine", 0.08, 0.02);
    setTimedOut(false);
    try {
      const res = await fetch(`/api/node/privileges?email=${encodeURIComponent(node.email)}`);
      const data = await res.json();
      if (data.scan_count > 0) {
        setStage("active");
        setRipple(true);
        playTick(1200, "sine", 0.15, 0.04);
        setTimeout(() => setRipple(false), 2000);
        cleanupListeners();
      } else {
        // Still not activated — restart the timeout + Realtime
        listenForActivation(node.email);
      }
    } catch {
      setTimedOut(true);
    }
  };

  return (
    <section className={`dqs-root ${ripple ? "dqs-root-ripple" : ""}`}>
      {/* Ripple overlay */}
      {ripple && <div className="dqs-ripple-overlay" />}

      <div className="dqs-header">
        <span className={`dqs-dot ${stage === "active" ? "dqs-dot-active" : ""}`} />
        <span className="dqs-title">
          {stage === "active"
            ? "PROTOCOL_ANCHOR // NODE_LIVE"
            : "DEV_SANDBOX // 60_SEC_TO_PROTOCOL_ANCHOR"}
        </span>
        <span className="dqs-badge">
          {stage === "active" ? "ANCHOR_DEPLOYED" : "NO_WALLET · NO_INVITE · NO_GENESIS"}
        </span>
      </div>

      <div className="dqs-body">
        {/* IDLE */}
        {stage === "idle" && (
          <div className="dqs-form">
            <p className="dqs-prompt">
              Choose a handle. Or leave it blank — we&apos;ll generate one.
              <br />
              <span className="dqs-hint">
                This deploys a Protocol Anchor. Not an account. Not a user. A cryptographic node in the identity mesh.
              </span>
            </p>
            <div className="dqs-input-row">
              <input
                type="text"
                placeholder="my_dev_handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.slice(0, 20))}
                onKeyDown={(e) => { if (e.key === "Enter") register(); }}
                maxLength={20}
                className="dqs-input"
                autoFocus
              />
              <button
                onClick={register}
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="dqs-btn"
              >
                Deploy Anchor →
              </button>
            </div>
          </div>
        )}

        {/* REGISTERING */}
        {stage === "registering" && (
          <div className="dqs-loading">
            <span className="dqs-spinner" />
            <span className="dqs-loading-text">DEPLOYING_PROTOCOL_ANCHOR...</span>
          </div>
        )}

        {/* DONE — token + curl, waiting for activation */}
        {stage === "done" && node && (
          <div className="dqs-result">
            <div className="dqs-success-banner">
              <span className="dqs-check">◈</span>
              <span>ANCHOR_DEPLOYED — AWAITING_ACTIVATION</span>
            </div>

            {!timedOut ? (
              <p className="dqs-listen-hint">
                <span className="dqs-listen-dot" />
                Listening for your terminal command...
                <br />
                <span className="dqs-hint">Copy the curl below. Paste in terminal. This page will react.</span>
              </p>
            ) : (
              <div className="dqs-timeout-banner">
                <span className="dqs-timeout-icon">⟳</span>
                <div className="dqs-timeout-text">
                  <span className="dqs-timeout-title">NO_ACTIVATION_DETECTED</span>
                  <span className="dqs-timeout-sub">
                    The Realtime signal may have been missed. Run the curl command in your terminal, then click below.
                  </span>
                </div>
                <button onClick={manualCheck} className="dqs-timeout-btn">
                  Check Again →
                </button>
              </div>
            )}

            {/* Handle */}
            <div className="dqs-field">
              <div className="dqs-field-label">NODE_HANDLE</div>
              <div className="dqs-field-value-row">
                <code className="dqs-code">{node.node_handle}</code>
                <button onClick={() => copy(node.node_handle, "handle")} className="dqs-copy-btn">
                  {copied === "handle" ? "✓" : "COPY"}
                </button>
              </div>
            </div>

            {/* Token */}
            <div className="dqs-field">
              <div className="dqs-field-label">DEV_TOKEN</div>
              <div className="dqs-field-value-row">
                <code className="dqs-code dqs-code-token">{node.node_token}</code>
                <button onClick={() => copy(node.node_token, "token")} className="dqs-copy-btn">
                  {copied === "token" ? "✓" : "COPY"}
                </button>
              </div>
            </div>

            {/* Activate curl */}
            <div className="dqs-field">
              <div className="dqs-field-label">ACTIVATE_YOUR_ANCHOR</div>
              <pre className="dqs-curl-block">
                <code>{node.curl_example}</code>
              </pre>
              <div className="dqs-curl-actions">
                <button
                  onClick={() => copy(node.curl_example, "curl")}
                  className="dqs-copy-btn dqs-copy-btn-curl"
                >
                  {copied === "curl" ? "✓ COPIED" : "COPY CURL"}
                </button>
                <span className="dqs-hint">Paste in terminal → watch this card</span>
              </div>
            </div>

            <button
              onClick={reset}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="dqs-reset-btn"
            >
              ↻ Deploy Another Anchor
            </button>
          </div>
        )}

        {/* ACTIVE — node activated, show next steps */}
        {stage === "active" && node && (
          <div className="dqs-result">
            <div className="dqs-active-banner">
              <span className="dqs-active-icon">◈</span>
              <span>PROTOCOL_ANCHOR_ACTIVE</span>
              <span className="dqs-active-sub">Your terminal command just resonated in the identity mesh.</span>
            </div>

            {/* Node info */}
            <div className="dqs-field">
              <div className="dqs-field-label">ANCHOR_STATUS</div>
              <div className="dqs-field-value-row dqs-field-active">
                <span className="dqs-status-dot" />
                <code className="dqs-code">{node.node_handle}</code>
                <span className="dqs-status-badge">ACTIVE</span>
              </div>
            </div>

            {/* 5-line client snippet */}
            <div className="dqs-field">
              <div className="dqs-field-label">
                KEEP_IN_SYNC — 5_LINE_CLIENT
                <div className="dqs-lang-toggle">
                  <button
                    onClick={() => { setLang("js"); playTick(500, "sine", 0.04, 0.01); }}
                    className={`dqs-lang-btn ${lang === "js" ? "dqs-lang-active" : ""}`}
                  >
                    JS
                  </button>
                  <button
                    onClick={() => { setLang("py"); playTick(500, "sine", 0.04, 0.01); }}
                    className={`dqs-lang-btn ${lang === "py" ? "dqs-lang-active" : ""}`}
                  >
                    PY
                  </button>
                </div>
              </div>
              <pre className="dqs-curl-block">
                <code>{lang === "js" ? CLIENT_SNIPPET_JS : CLIENT_SNIPPET_PY}</code>
              </pre>
              <div className="dqs-curl-actions">
                <button
                  onClick={() => copy(lang === "js" ? CLIENT_SNIPPET_JS : CLIENT_SNIPPET_PY, "snippet")}
                  className="dqs-copy-btn dqs-copy-btn-curl"
                >
                  {copied === "snippet" ? "✓ COPIED" : "COPY SNIPPET"}
                </button>
                <span className="dqs-hint">npm install @myshapeprotocol/sdk</span>
              </div>
            </div>

            {/* Next step: Agent */}
            <div className="dqs-next-step">
              <div className="dqs-next-step-label">NEXT_STEP</div>
              <p className="dqs-next-step-text">
                Deploy your first agent or visualize your node in the protocol mesh.
              </p>
              <div className="dqs-next-step-links">
                <a
                  href="/agent"
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="dqs-next-btn dqs-next-btn-primary"
                >
                  ◈ Deploy Agent →
                </a>
                <a
                  href="/dashboard"
                  onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                  className="dqs-next-btn"
                >
                  View Dashboard →
                </a>
              </div>
            </div>

            <button
              onClick={reset}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="dqs-reset-btn"
            >
              ↻ Deploy Another Anchor
            </button>
          </div>
        )}

        {/* ERROR */}
        {stage === "error" && (
          <div className="dqs-error">
            <span className="dqs-error-icon">⚠</span>
            <span className="dqs-error-text">{errorMsg}</span>
            <button
              onClick={reset}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="dqs-reset-btn"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
