"use client";
import { useState, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";
import { useSovereignSlots } from "@/hooks/useSovereignSlots";
import "./announcement-bar.css";

const STORAGE_KEY = "myshape_announcement_dev_nodes_20260706";
const FULL_STORAGE_KEY = "myshape_announcement_cohort_full_20260706";

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const { isFull, sovereignNodes } = useSovereignSlots();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(isFull ? FULL_STORAGE_KEY : STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, [isFull]);

  const dismiss = () => {
    sessionStorage.setItem(isFull ? FULL_STORAGE_KEY : STORAGE_KEY, "1");
    setVisible(false);
    playTick(600, "sine", 0.06, 0.015);
  };

  if (!visible) return null;

  const message = isFull
    ? `Genesis 100 cohort is sealed — ${sovereignNodes} sovereign nodes anchored. Protocol is now in Continuity Phase.`
    : "Dev Nodes are live. Deploy a protocol anchor in 60 seconds. No wallet. No invite.";

  const link = isFull ? "/specs" : "/developers";
  const linkText = isFull ? "Read Specs →" : "Get Started →";

  return (
    <div className="ann-bar">
      <div className="ann-bar-inner">
        <span className="ann-dot" style={{ background: isFull ? "#d2991d" : undefined }} />
        <span className="ann-text">
          {message}{" "}
          <a href={link} className="ann-link">
            {linkText}
          </a>
        </span>
        <button
          onClick={dismiss}
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
          className="ann-close"
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
