"use client";
import { playTick } from "@/utils/useAudioTick";
import "./genesis-cta.css";

export default function GenesisCTA() {
  return (
    <div className="genesis-cta-root">
      <div className="genesis-cta-header">
        <span className="genesis-cta-dot" />
        <span className="genesis-cta-title">GENESIS_PIONEER_PATH</span>
      </div>

      <div className="genesis-cta-body">
        <p className="genesis-cta-subtitle">
          VERIFY_ONCE → JOIN_DISCORD → CLAIM_SLOT → PERMANENT_TIER
        </p>

        <div className="genesis-cta-links">
          <a
            href="https://discord.gg/zr8Tczard"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
            className="genesis-cta-primary"
          >
            ◈ JOIN_DISCORD // VERIFY_BOT
          </a>

          <div className="genesis-cta-secondary-row">
            <a
              href="https://x.com/myshapeprotocol"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="genesis-cta-secondary"
            >
              X_PROTOCOL
            </a>
            <span className="genesis-cta-sep">·</span>
            <a
              href="https://www.linkedin.com/company/111557251/"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
              className="genesis-cta-secondary"
            >
              LINKED_IN
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
