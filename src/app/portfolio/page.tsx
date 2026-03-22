"use client";

import { useState, useEffect } from "react";
import Card from "@/components/Card";
import { getHoldings, addHolding, removeHolding, saveHoldings } from "@/lib/portfolio-store";
import { Holding } from "@/lib/types";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setHoldings(getHoldings());
    setLoading(false);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !avgCost) return;
    const updated = addHolding({
      symbol: symbol.toUpperCase().trim(),
      name: name || symbol.toUpperCase(),
      shares: parseFloat(shares),
      avgCost: parseFloat(avgCost),
      currentPrice: 0,
      previousClose: 0,
    });
    setHoldings(updated);
    setSymbol("");
    setName("");
    setShares("");
    setAvgCost("");
  };

  const handleRemove = (sym: string) => {
    const updated = removeHolding(sym);
    setHoldings(updated);
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    const updated: Holding[] = [];
    for (const h of holdings) {
      try {
        const res = await fetch(`/api/stocks?symbol=${h.symbol}`);
        if (res.ok) {
          const quote = await res.json();
          if (quote.price) {
            updated.push({ ...h, currentPrice: quote.price, previousClose: quote.previousClose });
            continue;
          }
        }
      } catch { /* fallback */ }
      updated.push(h);
    }
    saveHoldings(updated);
    setHoldings(updated);
    setRefreshing(false);
  };

  if (loading) {
    return <div className="text-[var(--muted)] text-lg p-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <button
          onClick={handleRefreshPrices}
          disabled={refreshing}
          className="px-4 py-2 bg-[var(--accent)] text-black font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {refreshing ? "Refreshing..." : "Refresh Prices"}
        </button>
      </div>

      <Card className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Holding</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Symbol *</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apple Inc."
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Shares *</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="10"
              step="any"
              min="0.001"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">Avg Cost *</label>
            <input
              type="number"
              value={avgCost}
              onChange={(e) => setAvgCost(e.target.value)}
              placeholder="150.00"
              step="any"
              min="0.01"
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[var(--accent-green)] text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Your Holdings ({holdings.length})</h2>
        {holdings.length === 0 ? (
          <p className="text-[var(--muted)]">No holdings yet. Add your first position above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                  <th className="pb-3 pr-4">Symbol</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4 text-right">Shares</th>
                  <th className="pb-3 pr-4 text-right">Avg Cost</th>
                  <th className="pb-3 pr-4 text-right">Current Price</th>
                  <th className="pb-3 pr-4 text-right">Market Value</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-[var(--card-border)]/50 hover:bg-white/5">
                    <td className="py-3 pr-4 font-mono font-bold text-[var(--accent)]">{h.symbol}</td>
                    <td className="py-3 pr-4">{h.name}</td>
                    <td className="py-3 pr-4 text-right">{h.shares}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(h.avgCost)}</td>
                    <td className="py-3 pr-4 text-right">
                      {h.currentPrice > 0 ? formatCurrency(h.currentPrice) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">
                      {h.currentPrice > 0 ? formatCurrency(h.currentPrice * h.shares) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemove(h.symbol)}
                        className="text-[var(--accent-red)] hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
