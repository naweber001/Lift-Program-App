"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { getHoldings } from "@/lib/portfolio-store";
import { Holding, TimeSeriesPoint } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#22d3ee", "#4ade80", "#facc15", "#f87171", "#a78bfa", "#fb923c", "#f472b6", "#34d399"];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function AnalyticsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = getHoldings();
    setHoldings(h);
    if (h.length > 0) {
      setSelectedSymbol(h[0].symbol);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;
    setLoadingChart(true);
    fetch(`/api/stocks?symbol=${selectedSymbol}&function=TIME_SERIES_DAILY`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTimeSeries(data);
        } else {
          setTimeSeries([]);
        }
      })
      .catch(() => setTimeSeries([]))
      .finally(() => setLoadingChart(false));
  }, [selectedSymbol]);

  if (loading) {
    return <div className="text-[var(--muted)] text-lg p-8">Loading...</div>;
  }

  const allocationData = holdings
    .filter((h) => h.currentPrice > 0)
    .map((h) => ({
      name: h.symbol,
      value: h.currentPrice * h.shares,
    }));

  const performanceData = holdings
    .filter((h) => h.currentPrice > 0 && h.avgCost > 0)
    .map((h) => ({
      name: h.symbol,
      gain: ((h.currentPrice - h.avgCost) / h.avgCost) * 100,
      value: (h.currentPrice - h.avgCost) * h.shares,
    }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Portfolio Allocation</h2>
          {allocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                >
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--muted)] py-12 text-center">No allocation data. Refresh prices on the Portfolio page.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Performance by Holding (%)</h2>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} />
                <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                  contentStyle={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
                />
                <Bar dataKey="gain">
                  {performanceData.map((entry, i) => (
                    <Cell key={i} fill={entry.gain >= 0 ? "#4ade80" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--muted)] py-12 text-center">No performance data available.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Price History (90 Days)</h2>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          >
            {holdings.map((h) => (
              <option key={h.symbol} value={h.symbol}>
                {h.symbol} — {h.name}
              </option>
            ))}
          </select>
        </div>
        {loadingChart ? (
          <div className="flex items-center justify-center h-64 text-[var(--muted)]">Loading chart data...</div>
        ) : timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="var(--muted)" fontSize={12} domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-[var(--muted)]">
            No historical data available. This may be due to API rate limits.
          </div>
        )}
      </Card>
    </div>
  );
}
