"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { getHoldings, saveHoldings } from "@/lib/portfolio-store";
import { Holding, PortfolioSummary } from "@/lib/types";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function formatPercent(val: number) {
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const stored = getHoldings();
      const updated: Holding[] = [];

      for (const h of stored) {
        try {
          const res = await fetch(`/api/stocks?symbol=${h.symbol}`);
          if (res.ok) {
            const quote = await res.json();
            if (quote.price) {
              updated.push({ ...h, currentPrice: quote.price, previousClose: quote.previousClose });
              continue;
            }
          }
        } catch { /* use defaults */ }
        updated.push({ ...h, currentPrice: h.avgCost * 1.05, previousClose: h.avgCost * 1.03 });
      }

      saveHoldings(updated);
      setHoldings(updated);

      const totalValue = updated.reduce((s, h) => s + h.currentPrice * h.shares, 0);
      const totalCost = updated.reduce((s, h) => s + h.avgCost * h.shares, 0);
      const dayChange = updated.reduce((s, h) => s + (h.currentPrice - h.previousClose) * h.shares, 0);

      setSummary({
        totalValue,
        totalCost,
        totalGain: totalValue - totalCost,
        totalGainPercent: ((totalValue - totalCost) / totalCost) * 100,
        dayChange,
        dayChangePercent: (dayChange / (totalValue - dayChange)) * 100,
      });

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--muted)] text-lg">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <p className="text-sm text-[var(--muted)] mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)] mb-1">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
              {formatCurrency(summary.totalGain)}
            </p>
            <p className={`text-sm ${summary.totalGainPercent >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
              {formatPercent(summary.totalGainPercent)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)] mb-1">Day Change</p>
            <p className={`text-2xl font-bold ${summary.dayChange >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
              {formatCurrency(summary.dayChange)}
            </p>
            <p className={`text-sm ${summary.dayChangePercent >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
              {formatPercent(summary.dayChangePercent)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)] mb-1">Holdings</p>
            <p className="text-2xl font-bold">{holdings.length}</p>
            <p className="text-sm text-[var(--muted)]">Total Cost: {formatCurrency(summary.totalCost)}</p>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold mb-4">Holdings Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                <th className="pb-3 pr-4">Symbol</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4 text-right">Shares</th>
                <th className="pb-3 pr-4 text-right">Avg Cost</th>
                <th className="pb-3 pr-4 text-right">Price</th>
                <th className="pb-3 pr-4 text-right">Value</th>
                <th className="pb-3 text-right">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const value = h.currentPrice * h.shares;
                const gain = (h.currentPrice - h.avgCost) * h.shares;
                const gainPct = ((h.currentPrice - h.avgCost) / h.avgCost) * 100;
                return (
                  <tr key={h.symbol} className="border-b border-[var(--card-border)]/50 hover:bg-white/5">
                    <td className="py-3 pr-4 font-mono font-bold text-[var(--accent)]">{h.symbol}</td>
                    <td className="py-3 pr-4">{h.name}</td>
                    <td className="py-3 pr-4 text-right">{h.shares}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(h.avgCost)}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(h.currentPrice)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{formatCurrency(value)}</td>
                    <td className={`py-3 text-right font-medium ${gain >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
                      {formatCurrency(gain)} ({formatPercent(gainPct)})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
