"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { getHoldings } from "@/lib/portfolio-store";
import { Holding } from "@/lib/types";

interface Recommendation {
  type: "warning" | "opportunity" | "info";
  title: string;
  description: string;
  action: string;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function analyzePortfolio(holdings: Holding[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const totalValue = holdings.reduce((s, h) => s + h.currentPrice * h.shares, 0);

  if (holdings.length === 0) {
    recs.push({
      type: "info",
      title: "Get Started",
      description: "Your portfolio is empty. Add some holdings to get personalized recommendations.",
      action: "Go to Portfolio page and add holdings",
    });
    return recs;
  }

  // Concentration check
  for (const h of holdings) {
    const weight = (h.currentPrice * h.shares) / totalValue;
    if (weight > 0.4) {
      recs.push({
        type: "warning",
        title: `High Concentration in ${h.symbol}`,
        description: `${h.symbol} makes up ${(weight * 100).toFixed(1)}% of your portfolio. Consider diversifying to reduce single-stock risk.`,
        action: `Consider reducing ${h.symbol} position or adding other holdings`,
      });
    }
  }

  // Diversification
  if (holdings.length < 5) {
    recs.push({
      type: "opportunity",
      title: "Increase Diversification",
      description: `You only hold ${holdings.length} position${holdings.length === 1 ? "" : "s"}. A well-diversified portfolio typically has 10-20 holdings across different sectors.`,
      action: "Consider adding holdings in different sectors (healthcare, energy, financials, etc.)",
    });
  }

  // Big winners – take profits?
  for (const h of holdings) {
    if (h.currentPrice > 0 && h.avgCost > 0) {
      const gainPct = ((h.currentPrice - h.avgCost) / h.avgCost) * 100;
      if (gainPct > 50) {
        recs.push({
          type: "opportunity",
          title: `Take Profits on ${h.symbol}?`,
          description: `${h.symbol} is up ${gainPct.toFixed(1)}% from your cost basis of ${formatCurrency(h.avgCost)}. Consider taking partial profits.`,
          action: `Review whether to sell some ${h.symbol} shares to lock in gains`,
        });
      }
      if (gainPct < -20) {
        recs.push({
          type: "warning",
          title: `Review ${h.symbol} Position`,
          description: `${h.symbol} is down ${Math.abs(gainPct).toFixed(1)}% from your cost basis. Evaluate whether the investment thesis still holds.`,
          action: `Research ${h.symbol} fundamentals and decide to hold, add, or cut losses`,
        });
      }
    }
  }

  // Day change alerts
  for (const h of holdings) {
    if (h.currentPrice > 0 && h.previousClose > 0) {
      const dayChange = ((h.currentPrice - h.previousClose) / h.previousClose) * 100;
      if (Math.abs(dayChange) > 3) {
        recs.push({
          type: "info",
          title: `${h.symbol} Moved ${dayChange > 0 ? "Up" : "Down"} ${Math.abs(dayChange).toFixed(1)}% Today`,
          description: `Significant daily move in ${h.symbol}. Price went from ${formatCurrency(h.previousClose)} to ${formatCurrency(h.currentPrice)}.`,
          action: "Check for news or earnings that may have driven this move",
        });
      }
    }
  }

  // General tips
  if (holdings.length >= 3) {
    const allTech = holdings.every((h) =>
      ["AAPL", "GOOGL", "MSFT", "AMZN", "META", "NVDA", "TSLA", "NFLX"].includes(h.symbol)
    );
    if (allTech) {
      recs.push({
        type: "warning",
        title: "Sector Concentration Risk",
        description: "All your holdings appear to be in the technology sector. Consider adding exposure to other sectors for better diversification.",
        action: "Look into healthcare (JNJ, UNH), financials (JPM, BRK.B), or consumer staples (PG, KO)",
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      type: "info",
      title: "Portfolio Looks Good",
      description: "No immediate concerns detected. Keep monitoring your positions and rebalance as needed.",
      action: "Continue to review your portfolio periodically",
    });
  }

  return recs;
}

const typeStyles = {
  warning: { bg: "bg-[var(--accent-red)]/10", border: "border-[var(--accent-red)]/30", icon: "⚠️", label: "Warning" },
  opportunity: { bg: "bg-[var(--accent-green)]/10", border: "border-[var(--accent-green)]/30", icon: "🎯", label: "Opportunity" },
  info: { bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/30", icon: "ℹ️", label: "Info" },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const holdings = getHoldings();
    const recs = analyzePortfolio(holdings);
    setRecommendations(recs);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="text-[var(--muted)] text-lg p-8">Analyzing portfolio...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Recommendations</h1>
      <p className="text-[var(--muted)] mb-8">
        Data-driven insights based on your current portfolio composition and performance.
      </p>

      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const style = typeStyles[rec.type];
          return (
            <Card key={i} className={`${style.bg} border ${style.border}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">{style.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{style.label}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{rec.title}</h3>
                  <p className="text-[var(--muted)] mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-[var(--accent)]">Suggested action:</span>
                    <span>{rec.action}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Disclaimer</h2>
        <p className="text-sm text-[var(--muted)]">
          These recommendations are generated algorithmically based on portfolio composition and basic metrics.
          They are not financial advice. Always do your own research and consult with a qualified financial advisor
          before making investment decisions.
        </p>
      </Card>
    </div>
  );
}
