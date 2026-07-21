"use client";
import { useState, useEffect } from "react";

interface GenesisSlotState {
  isFull: boolean;
  slotsRemaining: number;
  sovereignNodes: number;
  isLoading: boolean;
}

/** Polls /api/nodes/count every 60s to track Genesis cohort availability. */
export function useSovereignSlots(): GenesisSlotState {
  const [state, setState] = useState<GenesisSlotState>({
    isFull: false,
    slotsRemaining: 100,
    sovereignNodes: 0,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/nodes/count");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const sovereignNodes: number = data.genesis_nodes ?? 0;
        const slotsRemaining = Math.max(0, 100 - sovereignNodes);
        setState({
          isFull: slotsRemaining <= 0,
          slotsRemaining,
          sovereignNodes,
          isLoading: false,
        });
      } catch {
        if (!cancelled) setState((s) => ({ ...s, isLoading: false }));
      }
    }

    check();
    const id = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return state;
}
