/** @experimental ZK subsystem — under active research. Not production-grade. */
"use client";

interface ZKProofBoxProps {
  zkp: string;
  pop: string;
  mp: string;
  ep: string;
}

/** Continuity proof hash display with sub-proof breakdown. */
export default function ZKProofBox({ zkp, pop, mp, ep }: ZKProofBoxProps) {
  return (
    <div className="mt-4 p-3 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.03] space-y-2">
      <div className="text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase">Continuity_Proof</div>
      <div className="text-[#90c8ff]/70 text-[11px] font-mono break-all leading-relaxed motion-demo__proof-hash">
        {zkp}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <span className="text-white/20">PoP</span>
          <div className="text-[#90c8ff]/50 font-mono truncate">{pop.slice(0, 6)}</div>
        </div>
        <div>
          <span className="text-white/20">MP</span>
          <div className="text-[#90c8ff]/50 font-mono truncate">{mp.slice(0, 6)}</div>
        </div>
        <div>
          <span className="text-white/20">EP</span>
          <div className="text-[#90c8ff]/50 font-mono truncate">{ep.slice(0, 6)}</div>
        </div>
      </div>
      <div className="text-white/15 text-[11px] mt-1 tracking-[0.15em]">§6 ZK-PRESENCE — PROOF-OF-CONCEPT</div>
    </div>
  );
}
