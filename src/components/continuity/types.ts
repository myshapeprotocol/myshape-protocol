export interface NetworkNode {
  handle: string;
  mask: string;
  status: string;
  particleLevel: number;
  entropy: number;
  lastSeen: string;
  scans: number;
  isGenesis: boolean;
}

export interface NetworkData {
  totalNodes: number;
  activeHumans: number;
  sovereignNodes: number;
  agents: number;
  activeToday: number;
  totalScans: number;
  nodes: NetworkNode[];
  engines: number;
  attackSigs: number;
  protocolEnclave: boolean;
}

export function computeEvolutionaryEntropy(data: NetworkData): number {
  if (!data.nodes.length) return 0;
  const totalEntropy = data.nodes.reduce((sum, n) => sum + (n.entropy || 0), 0);
  const activeEntropy = data.nodes.filter((n) => n.scans > 0).length;
  const meanEntropy = totalEntropy / Math.max(data.nodes.length, 1);
  const diversityFactor = Math.min(
    activeEntropy / Math.max(data.nodes.length, 1),
    1,
  );
  return +(
    meanEntropy *
    diversityFactor *
    (1 + Math.log(Math.max(data.totalScans, 1)))
  ).toFixed(1);
}
