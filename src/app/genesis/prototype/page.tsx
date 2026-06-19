"use client";

import { useEffect, useRef } from "react";

/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */
const CYAN = "#22d3ee";
const VB_W = 220;
const VB_H = 300;
const SCAN_DURATION = 2800;
const GLOW_RADIUS = 8;

/* ───────────────────────────────────────────────
   Point-Cloud Mesh Definition
   Nodes:  [x, y][]
   Edges:  [fromIdx, toIdx][]
   ─────────────────────────────────────────────── */

type NodeDef = [number, number]; // [x, y]
type EdgeDef = [number, number]; // [from, to]

const NODES: NodeDef[] = [
  // ── Head (7 nodes) ──
  [100, 2],
  [84, 12], [116, 12],
  [84, 22], [116, 22],
  [88, 34], [112, 34],

  // ── Neck (3 nodes) ──
  [92, 40], [108, 40],
  [100, 46],

  // ── Torso grid (3 cols × 13 rows = 39 nodes) ──
  // Row 0 (shoulders)
  [52, 52], [100, 52], [148, 52],
  // Row 0.5
  [60, 59], [100, 59], [140, 59],
  // Row 1
  [68, 66], [100, 66], [132, 66],
  // Row 1.5
  [66, 73], [100, 73], [134, 73],
  // Row 2
  [64, 80], [100, 80], [136, 80],
  // Row 2.5
  [63, 87], [100, 87], [137, 87],
  // Row 3
  [62, 94], [100, 94], [138, 94],
  // Row 3.5
  [63, 101], [100, 101], [137, 101],
  // Row 4
  [64, 108], [100, 108], [136, 108],
  // Row 4.5
  [66, 116], [100, 116], [134, 116],
  // Row 5
  [68, 124], [100, 124], [132, 124],
  // Row 5.5
  [71, 132], [100, 132], [129, 132],
  // Row 6 (hips)
  [74, 140], [100, 140], [126, 140],

  // ── Left arm (8 nodes: 49-56) ──
  [52, 52],
  [43, 62],
  [34, 74],
  [27, 86],
  [23, 100],
  [21, 114],
  [20, 128],
  [20, 135],

  // ── Right arm (8 nodes: 57-64) ──
  [148, 52],
  [157, 62],
  [166, 74],
  [173, 86],
  [177, 100],
  [179, 114],
  [180, 128],
  [180, 135],

  // ── Left leg (9 nodes: 65-73) ──
  [74, 140],
  [82, 154],
  [80, 170],
  [76, 186],
  [72, 202],
  [68, 218],
  [64, 236],
  [60, 254],
  [58, 274],

  // ── Right leg (9 nodes: 74-82) ──
  [126, 140],
  [118, 154],
  [120, 170],
  [124, 186],
  [128, 202],
  [132, 218],
  [136, 236],
  [140, 254],
  [142, 274],
];

/* ── Edges ── */
const EDGES: EdgeDef[] = [
  // ── Head connections ──
  [0, 1], [0, 2],       // top to sides
  [1, 3], [2, 4],       // sides vertical
  [1, 2],               // cross top
  [3, 4],               // cross mid
  [3, 5], [4, 6],       // lower sides to bottom
  [5, 6],               // cross bottom
  [3, 5], [4, 6],       // vertical lower
  [1, 5], [2, 6],       // diagonals

  // ── Neck ──
  [7, 10], [8, 12],     // neck top to shoulders
  [7, 9], [8, 9],       // neck to center
  [9, 11],              // neck center down to torso
  [5, 7], [6, 8],       // head bottom to neck top

  // ── Torso: horizontal ribs ──
  [10, 11], [11, 12],   // row 0
  [13, 14], [14, 15],   // row 0.5
  [16, 17], [17, 18],   // row 1
  [19, 20], [20, 21],   // row 1.5
  [22, 23], [23, 24],   // row 2
  [25, 26], [26, 27],   // row 2.5
  [28, 29], [29, 30],   // row 3
  [31, 32], [32, 33],   // row 3.5
  [34, 35], [35, 36],   // row 4
  [37, 38], [38, 39],   // row 4.5
  [40, 41], [41, 42],   // row 5
  [43, 44], [44, 45],   // row 5.5
  [46, 47], [47, 48],   // row 6 (hips)

  // ── Torso: vertical columns ──
  [10, 13], [13, 16], [16, 19], [19, 22], [22, 25], [25, 28], [28, 31], [31, 34], [34, 37], [37, 40], [40, 43], [43, 46],  // left col
  [11, 14], [14, 17], [17, 20], [20, 23], [23, 26], [26, 29], [29, 32], [32, 35], [35, 38], [38, 41], [41, 44], [44, 47],  // center col
  [12, 15], [15, 18], [18, 21], [21, 24], [24, 27], [27, 30], [30, 33], [33, 36], [36, 39], [39, 42], [42, 45], [45, 48],  // right col

  // ── Torso: diagonals ──
  [10, 14], [11, 13], [11, 15], [12, 14],
  [13, 17], [14, 16], [14, 18], [15, 17],
  [16, 20], [17, 19], [17, 21], [18, 20],
  [19, 23], [20, 22], [20, 24], [21, 23],
  [22, 26], [23, 25], [23, 27], [24, 26],
  [25, 29], [26, 28], [26, 30], [27, 29],
  [28, 32], [29, 31], [29, 33], [30, 32],
  [31, 35], [32, 34], [32, 36], [33, 35],
  [34, 38], [35, 37], [35, 39], [36, 38],
  [37, 41], [38, 40], [38, 42], [39, 41],
  [40, 44], [41, 43], [41, 45], [42, 44],
  [43, 47], [44, 46], [44, 48], [45, 47],

  // ── Left arm (49-56) ──
  [10, 49],
  [49, 50], [50, 51], [51, 52], [52, 53], [53, 54], [54, 55], [55, 56],
  [49, 51], [50, 52], [51, 53], [52, 54], [53, 55], [54, 56],

  // ── Right arm (57-64) ──
  [12, 57],
  [57, 58], [58, 59], [59, 60], [60, 61], [61, 62], [62, 63], [63, 64],
  [57, 59], [58, 60], [59, 61], [60, 62], [61, 63], [62, 64],

  // ── Left leg (65-73) ──
  [46, 65],
  [65, 66], [66, 67], [67, 68], [68, 69], [69, 70], [70, 71], [71, 72], [72, 73],
  [65, 67], [66, 68], [67, 69], [68, 70], [69, 71], [70, 72], [71, 73],

  // ── Right leg (74-82) ──
  [48, 74],
  [74, 75], [75, 76], [76, 77], [77, 78], [78, 79], [79, 80], [80, 81], [81, 82],
  [74, 76], [75, 77], [76, 78], [77, 79], [78, 80], [79, 81], [80, 82],

  // ── Extra torso cross-links (X pattern) ──
  [10, 17], [12, 17],
  [16, 23], [18, 23],
  [22, 29], [24, 29],
  [28, 35], [30, 35],
  [34, 41], [36, 41],
  [40, 47], [42, 47],
];

/* ── Pre-compute Y bounds per node ── */
const NODE_Y_MIN = NODES.map(([, y]) => y - 3);
const NODE_Y_MAX = NODES.map(([, y]) => y + 3);

/* ── Pre-compute Y bounds per edge (derived from its endpoints) ── */
const EDGE_Y_MIN = EDGES.map(([a, b]) => Math.min(NODE_Y_MIN[a], NODE_Y_MIN[b]));
const EDGE_Y_MAX = EDGES.map(([a, b]) => Math.max(NODE_Y_MAX[a], NODE_Y_MAX[b]));

/* ─── SVG filters & gradient permanently applied; scan controls glow only ─── */

export default function GenesisPrototypePage() {
  const scanLineRef = useRef<SVGLineElement>(null);
  const nodeElements = useRef<(SVGCircleElement | null)[]>([]);
  const edgeElements = useRef<(SVGLineElement | null)[]>([]);
  const animFrameRef = useRef<number>(0);

  /* ── Animation loop ── */
  useEffect(() => {
    const nodeEls = nodeElements.current;
    const edgeEls = edgeElements.current;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const cycleMs = SCAN_DURATION * 2;
      const t = (elapsed % cycleMs) / cycleMs;

      let scanY: number;
      if (t <= 0.5) {
        scanY = VB_H * (1 - t * 2);
      } else {
        scanY = VB_H * ((t - 0.5) * 2);
      }

      // Move scan halo
      if (scanLineRef.current) {
        scanLineRef.current.setAttribute("y1", String(scanY));
        scanLineRef.current.setAttribute("y2", String(scanY));
      }

      // ── Activate nodes touched by the scan ──
      const nodeCount = NODES.length;
      const nodeActive = new Array<boolean>(nodeCount);

      for (let i = 0; i < nodeCount; i++) {
        const active =
          scanY >= NODE_Y_MIN[i] && scanY <= NODE_Y_MAX[i];
        nodeActive[i] = active;

        const el = nodeEls[i];
        if (!el) continue;

        if (active) {
          const flicker = Math.random();
          el.setAttribute("fill", "#ffffff");
          el.setAttribute("r", flicker > 0.85 ? "3.5" : "2.8");
          el.setAttribute("filter", "url(#nodeFlare)");
          el.setAttribute("opacity", "1");
        } else {
          el.setAttribute("fill", "#22d3ee");
          el.setAttribute("r", "1.2");
          el.removeAttribute("filter");
          el.setAttribute("opacity", "0.5");
        }
      }

      // ── Activate edges touched by the scan ──
      for (let i = 0; i < EDGES.length; i++) {
        const [a, b] = EDGES[i];
        const active = nodeActive[a] || nodeActive[b];

        const el = edgeEls[i];
        if (!el) continue;

        if (active) {
          const f = Math.random();
          el.setAttribute("stroke", f > 0.85 ? "#22d3ee" : "#ffffff");
          el.setAttribute("stroke-width", f > 0.7 ? "1.2" : "2");
          el.setAttribute("opacity", f > 0.6 ? "1" : "0.3");
          el.setAttribute("filter", "url(#edgeFlare)");
        } else {
          el.setAttribute("stroke", "url(#bodyGradient)");
          el.setAttribute("stroke-width", "0.5");
          el.setAttribute("opacity", "0.35");
          el.removeAttribute("filter");
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] overflow-hidden select-none">
      {/* ── SVG filters & gradients ── */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          {/* Baseline body gradient: top = near-black, bottom = cyan */}
          <linearGradient
            id="bodyGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#111111" />
            <stop offset="100%" stopColor={CYAN} />
          </linearGradient>

          {/* Permanent soft energy haze on the full mesh */}
          <filter id="meshHaze" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Edge glow when activated */}
          <filter id="edgeFlare" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node point-explosion flare */}
          <filter id="nodeFlare" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Scan-line glow */}
          <filter id="scanLineGlow" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ── Mesh container ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2 mesh-container"
        style={{ bottom: "5%", height: "70vh" }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMax meet"
          style={{ height: "100%", width: "auto" }}
        >
          {/* Permanent background glow behind the whole mesh */}
          <rect
            x="0"
            y="0"
            width={VB_W}
            height={VB_H}
            fill="none"
            filter="url(#meshHaze)"
            pointerEvents="none"
          />

          {/* Scanning halo */}
          <line
            ref={scanLineRef}
            x1="-10"
            x2={VB_W + 10}
            y1="0"
            y2="0"
            stroke={CYAN}
            strokeWidth="1.5"
            filter="url(#scanLineGlow)"
            opacity="0.9"
          />

          {/* ── Edges (mesh lines) ── */}
          <g filter="url(#meshHaze)" style={{ filter: "drop-shadow(0 0 15px #22d3ee)" }}>
            {EDGES.map(([a, b], i) => {
              const [x1, y1] = NODES[a];
              const [x2, y2] = NODES[b];
              return (
                <line
                  key={`e-${i}`}
                  ref={(el) => { edgeElements.current[i] = el; }}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#bodyGradient)"
                  strokeWidth="0.5"
                  opacity="0.35"
                />
              );
            })}
          </g>

          {/* ── Nodes (points) ── */}
          {NODES.map(([x, y], i) => (
            <circle
              key={`n-${i}`}
              ref={(el) => { nodeElements.current[i] = el; }}
              cx={x}
              cy={y}
              r="1.2"
              fill={CYAN}
              opacity="0.5"
            />
          ))}
        </svg>
      </div>

      {/* ── HUD overlays ── */}
      <div className="absolute top-12 left-10 font-mono text-[10px] tracking-[0.3em] text-cyan-400/70">
        [ PROTOCOL_CORE: ACTIVE ]
      </div>

      <div className="absolute bottom-12 right-10 font-mono text-[10px] tracking-[0.3em] text-cyan-400/70 flicker-text">
        [ IDENTITY_SYNCING: 24%... ]
      </div>

      <style>{`
        .flicker-text {
          animation: flicker 3s infinite steps(1);
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.7; }
          5% { opacity: 0.25; }
          10% { opacity: 0.7; }
          22% { opacity: 0.35; }
          23% { opacity: 0.7; }
          48% { opacity: 0.15; }
          50% { opacity: 0.7; }
          73% { opacity: 0.4; }
          74% { opacity: 0.7; }
          91% { opacity: 0.2; }
          93% { opacity: 0.7; }
        }
        .mesh-container {
          filter: drop-shadow(0 0 15px ${CYAN});
        }
      `}</style>
    </div>
  );
}
