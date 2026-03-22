"use client";

import { Holding } from "./types";

const STORAGE_KEY = "investtracker_portfolio";

const defaultHoldings: Holding[] = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 10, avgCost: 150.0, currentPrice: 0, previousClose: 0 },
  { symbol: "GOOGL", name: "Alphabet Inc.", shares: 5, avgCost: 140.0, currentPrice: 0, previousClose: 0 },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 8, avgCost: 380.0, currentPrice: 0, previousClose: 0 },
  { symbol: "AMZN", name: "Amazon.com Inc.", shares: 12, avgCost: 178.0, currentPrice: 0, previousClose: 0 },
];

export function getHoldings(): Holding[] {
  if (typeof window === "undefined") return defaultHoldings;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHoldings));
    return defaultHoldings;
  }
  return JSON.parse(stored);
}

export function saveHoldings(holdings: Holding[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function addHolding(holding: Holding): Holding[] {
  const holdings = getHoldings();
  const existing = holdings.find((h) => h.symbol === holding.symbol);
  if (existing) {
    const totalShares = existing.shares + holding.shares;
    existing.avgCost =
      (existing.avgCost * existing.shares + holding.avgCost * holding.shares) / totalShares;
    existing.shares = totalShares;
  } else {
    holdings.push(holding);
  }
  saveHoldings(holdings);
  return holdings;
}

export function removeHolding(symbol: string): Holding[] {
  const holdings = getHoldings().filter((h) => h.symbol !== symbol);
  saveHoldings(holdings);
  return holdings;
}
