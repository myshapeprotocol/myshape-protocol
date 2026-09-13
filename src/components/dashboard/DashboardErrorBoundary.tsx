"use client";
import { Component, type ReactNode } from "react";

/* ═══════════════════════════════════════════════
   DashboardErrorBoundary — render-level safety net
   All styles in dashboard.css — no inline styles.
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
        <div className="dash-error">
          <div className="dash-error-indicator">
            <span className="dash-error-dot" />
            <span className="dash-error-label">Protocol Syncing...</span>
          </div>

          <p className="dash-error-text">
            The dashboard render pipeline encountered a transient interrupt.
            Your local data is intact — this is a client-side rendering
            boundary, not a data loss event.
          </p>

          {this.state.errorMessage && (
            <div className="dash-error-detail">{this.state.errorMessage}</div>
          )}

          <button
            type="button"
            className="dash-error-retry"
            onClick={this.handleRetry}
          >
            Retry Render →
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
