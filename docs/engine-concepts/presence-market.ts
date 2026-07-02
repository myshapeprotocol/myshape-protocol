// ============================================================
// MyShape Protocol — Presence Market (§20-22)
//
// §20 Presence Marketplace — exchange for verified presence
// §21 Presence Exchange — swap/lease/stake/verify
// §22 Presence Liquidity — pools, staking, leasing
// ============================================================

import type { PresenceToken } from "./presence-economy";

// ── §20 — Presence Marketplace ──

export type MarketRole = "human" | "ai_system" | "application" | "protocol";

export interface MarketParticipant {
  id: string;
  role: MarketRole;
  reputation: number;        // 0-1
  joined_at: number;
  active_listings: number;
  completed_trades: number;
}

export interface PresenceListing {
  listing_id: string;
  seller: MarketParticipant;
  token: PresenceToken;
  price: number;             // in $PULSE
  listed_at: number;
  expires_at: number;
  status: "active" | "matched" | "completed" | "expired";
}

export interface PresenceTrade {
  trade_id: string;
  listing: PresenceListing;
  buyer: MarketParticipant;
  price: number;
  executed_at: number;
  verification_hash: string;
}

export function createMarketplace() {
  const participants = new Map<string, MarketParticipant>();
  const listings = new Map<string, PresenceListing>();
  const trades: PresenceTrade[] = [];

  return {
    registerParticipant(p: MarketParticipant): void {
      participants.set(p.id, p);
    },

    listPresence(token: PresenceToken, seller: MarketParticipant, price: number): PresenceListing {
      const listing: PresenceListing = {
        listing_id: `LIST_${Date.now().toString(36).toUpperCase()}`,
        seller,
        token,
        price,
        listed_at: Math.floor(Date.now() / 1000),
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        status: "active",
      };
      listings.set(listing.listing_id, listing);
      seller.active_listings++;
      return listing;
    },

    executeTrade(listingId: string, buyer: MarketParticipant): PresenceTrade | null {
      const listing = listings.get(listingId);
      if (!listing || listing.status !== "active") return null;

      const quickHash = (s: string) => {
        let h = 0x6d797368;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
        return Math.abs(h).toString(16).padStart(8, "0");
      };

      listing.status = "completed";
      listing.seller.completed_trades++;
      listing.seller.active_listings--;

      const trade: PresenceTrade = {
        trade_id: `TRD_${Date.now().toString(36).toUpperCase()}`,
        listing,
        buyer,
        price: listing.price,
        executed_at: Math.floor(Date.now() / 1000),
        verification_hash: quickHash(`${listingId}:${buyer.id}:${Date.now()}`),
      };
      trades.push(trade);
      return trade;
    },

    getActiveListings(): PresenceListing[] {
      return Array.from(listings.values()).filter(l => l.status === "active");
    },

    getStats() {
      return {
        total_participants: participants.size,
        active_listings: Array.from(listings.values()).filter(l => l.status === "active").length,
        total_trades: trades.length,
        avg_price: trades.length > 0
          ? trades.reduce((s, t) => s + t.price, 0) / trades.length
          : 0,
      };
    },
  };
}

// ── §21 — Presence Exchange (swap/lease/stake/verify) ──

export type ExchangeAction = "swap" | "lease" | "stake" | "verify";

export interface ExchangeOrder {
  order_id: string;
  action: ExchangeAction;
  token_id: string;
  counterparty?: string;     // optional — open market if absent
  price: number;
  duration?: number;         // for lease: seconds
  created_at: number;
  status: "open" | "filled" | "cancelled";
}

export function createExchangeOrder(
  action: ExchangeAction,
  tokenId: string,
  price: number,
  duration?: number,
): ExchangeOrder {
  return {
    order_id: `ORD_${Date.now().toString(36).toUpperCase()}`,
    action,
    token_id: tokenId,
    price,
    duration,
    created_at: Math.floor(Date.now() / 1000),
    status: "open",
  };
}

// ── §22 — Presence Liquidity Pools ──

export interface LiquidityPool {
  pool_id: string;
  token_type: string;         // genesis / validator / presence / basic
  total_staked: number;       // number of tokens
  total_value: number;        // aggregate PV
  apr: number;               // annual presence rate
  stakers: Map<string, { token_id: string; staked_at: number; amount: number }>;
}

export function createLiquidityPool(tokenType: string): LiquidityPool {
  return {
    pool_id: `POOL_${tokenType.toUpperCase()}`,
    token_type: tokenType,
    total_staked: 0,
    total_value: 0,
    apr: tokenType === "genesis" ? 0.15 : tokenType === "validator" ? 0.10 : 0.05,
    stakers: new Map(),
  };
}

export function stakeToPool(
  pool: LiquidityPool,
  stakerId: string,
  token: PresenceToken,
): void {
  pool.stakers.set(stakerId, {
    token_id: token.token_id,
    staked_at: Math.floor(Date.now() / 1000),
    amount: token.value.pv,
  });
  pool.total_staked++;
  pool.total_value += token.value.pv;
}

export function getPoolYield(pool: LiquidityPool, stakerId: string): number {
  const stake = pool.stakers.get(stakerId);
  if (!stake) return 0;
  const elapsed = (Math.floor(Date.now() / 1000) - stake.staked_at) / 86400 / 365; // years
  return stake.amount * pool.apr * elapsed;
}
