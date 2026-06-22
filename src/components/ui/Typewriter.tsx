"use client";

import { useState, useEffect } from "react";

export default function Typewriter({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    let dir = 1; // 1 = typing, -1 = deleting
    const type = setInterval(() => {
      if (dir === 1) {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          dir = -1;
          // Pause at full text
          clearInterval(type);
          setTimeout(() => {
            const del = setInterval(() => {
              i--;
              setDisplay(text.slice(0, i));
              if (i <= 0) {
                dir = 1;
                clearInterval(del);
              }
            }, 25);
          }, 3000);
        }
      }
    }, 40);
    return () => clearInterval(type);
  }, [text]);

  // Blink cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor(c => !c), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <span className={className}>
      {display}
      <span style={{ opacity: showCursor ? 1 : 0, transition: "opacity 0.1s" }}>_</span>
    </span>
  );
}
