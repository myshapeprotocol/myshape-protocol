"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  {
    id: "the-new-problem",
    heading: "When Agents Act Alone",
    content: `By the end of 2026, autonomous AI agents will execute more on-chain transactions than humans.

Trading agents managing DeFi positions. Governance agents voting on DAO proposals. Curation agents filtering information feeds. Treasury agents optimizing cross-chain yield. These are not chatbots with wallet connections — they are autonomous economic actors making thousands of decisions per day, each with financial and governance consequences.

This creates an identity problem that no existing protocol solves:

When an agent executes a $100K trade at 3 AM, who — or what — is liable? The human principal? The agent itself? The protocol that deployed the agent?

Current answers are inadequate:
- "The private key holder is liable" — but the agent holds the key autonomously
- "The deployer is liable" — but the agent has learned and evolved since deployment
- "The agent has no identity" — but it has a persistent on-chain presence, a reputation, and economic agency

We need agent identity. Not as a legal fiction. As a cryptographic primitive.`,
  },
  {
    id: "what-agents-need",
    heading: "What Agent Identity Requires",
    content: `An agent identity protocol must provide three primitives that human identity protocols do not:

1. Agent Declaration
A cryptographic proof that "this agent was deployed by this human principal at this time, with this initial state." The declaration is a birth certificate for the agent — an immutable record of its origin. In MyShape, this is the Agent Registration transaction: the human principal signs a declaration binding the agent's public key to their own continuity chain.

2. Agent Continuity
A proof that "this agent has operated continuously under the same sovereign control since deployment." If the agent is compromised — if an attacker gains control of its private key — the continuity chain breaks. The attacker cannot produce valid continuity proofs because they cannot produce the human principal's motion-signature. The agent's actions after compromise are cryptographically distinguishable from its actions before compromise.

3. Agent-Human Binding
A proof that "this agent's actions are authorized by this continuously-present human." Not every action needs a human signature — that would defeat the purpose of autonomy. But the binding creates a cryptographic audit trail: every agent action is linked to a specific presence receipt in the human's continuity chain. If a dispute arises, the trail answers: "which human authorized this agent, and were they continuously sovereign at the time of authorization?"`,
  },
  {
    id: "myShape-approach",
    heading: "The MyShape Approach: Coexistence",
    content: `MyShape is the only identity protocol designed from first principles for human-agent coexistence.

The architecture is symmetric: human nodes and agent nodes exist in the same identity mesh, using the same protocol primitives, but verified through different mechanisms.

Human nodes: verified through motion-signature (proof of biological presence). The 128-dimensional motion vector, PES scoring, and ZK-Presence proof ensure that only a physically present human can initialize or verify a human node.

Agent nodes: registered through cryptographic declaration (proof of deployment provenance). The agent's public key is bound to the human principal's continuity chain. The agent inherits the human's continuity guarantees — but cannot spoof the human's motion-signature.

The two node types interact through the Identity Mesh: a distributed graph where every node — human or agent — maintains sovereign control over its own Data-Body while participating in the collective verification network. An agent can query a human's continuity status. A human can audit their agent's action history. A third-party protocol can verify that "agent A, deployed by human H, with unbroken continuity since deployment, executed transaction T."

This is not science fiction. The Agent Declaration endpoint is live. The continuity chain architecture is deployed. The motion-signature engine distinguishes human from AI with mathematical certainty.`,
  },
  {
    id: "why-now",
    heading: "Why Agent Identity Matters Now",
    content: `Three converging trends make agent identity the most urgent unsolved problem in crypto:

1. Agent Proliferation
The number of autonomous on-chain agents is doubling every 6 months. By mid-2027, the average DeFi user will have 50+ agents operating on their behalf. Without agent identity, this is a compliance nightmare — every agent action is potentially a regulatory violation because there is no cryptographic proof of who authorized what.

2. AI Capability
Agents are getting smarter. GPT-5 class models can now execute multi-step DeFi strategies, negotiate with other agents, and adapt to market conditions in real time. This is not "a script that buys when RSI < 30." This is an autonomous economic actor with learned behavior. It needs identity.

3. Regulatory Pressure
The EU's AI Act, the US Executive Order on AI, and the FATF's virtual asset guidance all point in the same direction: autonomous agents need verifiable identity. Not KYC — cryptographic proof of provenance, continuity, and human binding. The protocols that provide this infrastructure will be the compliance layer for the Agent Economy.

MyShape is building that infrastructure. Not as an afterthought bolted onto a human identity protocol. As a first-class primitive designed for coexistence from day one.`,
  },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase">
              <span>GENESIS 009</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
              AI Agent<br />
              <span className="text-[#90c8ff]">Identity</span>
            </h1>
            <p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">
              How autonomous agents prove who they are — and why the Agent
              Economy needs cryptographic agent identity as a first-class
              protocol primitive.
            </p>
          </div>
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-[#90c8ff]/30" />
                  {section.heading}
                </h2>
                <div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{section.content}</div>
              </section>
            ))}
          </div>
          <PostNavigation slug="/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4">
            <p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/blog/proof-of-personhood-vs-proof-of-continuity" onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/55 text-[12px] tracking-[0.08em]">PoP vs PoC</p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Two problems, two protocols →</p>
              </Link>
              <Link href="/blog/what-is-proof-of-continuity" onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Proof of Continuity?</p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">The missing primitive →</p>
              </Link>
              <Link href="/agent" onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/55 text-[12px] tracking-[0.08em]">Agent Declaration</p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Register your agent →</p>
              </Link>
            </div>
          </div>
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/55 text-[13px] tracking-[0.1em] uppercase">Register Your Agent</p>
            <p className="text-white/45 text-[12px] leading-[1.7] max-w-md mx-auto">The Agent Declaration protocol is live. Register your autonomous agent in the MyShape identity mesh — cryptographic proof of provenance and continuity.</p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href="/agent" onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/65 text-[10px] tracking-[0.18em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">Agent Registration →</Link>
              <Link href="/developers" onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/50 text-[10px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">SDK Docs →</Link>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}
