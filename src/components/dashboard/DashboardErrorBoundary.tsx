"use client";
import { Component, type ReactNode } from "react";

/* ═══════════════════════════════════════════════
   DashboardErrorBoundary — render-level safety net

   Catches crashes in the three-layer dashboard
   (Hero / CapabilityMatrix / ActionCall) so one
   sub-component failure doesn't wipe the whole page.

   Shows "Protocol Syncing..." with a retry that
   resets the error boundary state.
   ═══════════════════════════════════════════════ */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message.slice(0, 120) };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(
      "[DashboardErrorBoundary] Render crash:",
      error.message,
      info.componentStack?.slice(0, 300),
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12 space-y-5">
          {/* Pulsing sync indicator */}
          <div className="flex items-center justify-center gap-2.5">
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{
                background: "#90c8ff",
                boxShadow: "0 0 12px rgba(144,200,255,0.6)",
              }}
            />
            <span className="text-[#90c8ff]/50 font-mono text-[10px] tracking-[0.35em] uppercase">
              Protocol Syncing...
            </span>
          </div>

          <p className="text-white/20 text-[10px] tracking-[0.08em] leading-relaxed max-w-sm mx-auto">
            The dashboard render pipeline encountered a transient interrupt.
            Your identity data is intact — this is a client-side rendering
            boundary, not a data loss event.
          </p>

          {/* Error detail — subdued, for debugging */}
          {this.state.errorMessage && (
            <div className="text-white/10 text-[8px] font-mono tracking-[0.05em] break-all max-w-md mx-auto">
              {this.state.errorMessage}
            </div>
          )}

          <button
            onClick={this.handleRetry}
            className="px-8 py-2.5 border border-[#90c8ff]/25 text-[#90c8ff]/50 font-mono text-[9px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/50 hover:text-[#90c8ff]/80 transition-all"
            style={{ background: "rgba(144,200,255,0.03)" }}
          >
            Retry Render →
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
