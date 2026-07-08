"use client";

interface Props {
  onRetry: () => void;
}

export default function ContinuityErrorState({ onRetry }: Props) {
  return (
    <div className="continuity-error" role="alert">
      <div className="continuity-error-label">Network Unreachable</div>
      <p className="continuity-error-text">
        The continuity network data could not be loaded. This may be a
        transient condition — the protocol state chain continues to operate
        independently.
      </p>
      <button
        type="button"
        className="continuity-error-retry"
        onClick={onRetry}
      >
        Retry Connection
      </button>
    </div>
  );
}
