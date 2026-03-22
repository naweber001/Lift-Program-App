import { NextRequest, NextResponse } from "next/server";

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const fn = searchParams.get("function") || "GLOBAL_QUOTE";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE}?function=${fn}&symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();

    if (data["Note"] || data["Information"]) {
      return NextResponse.json(
        { error: "API rate limit reached. Using demo key — add ALPHA_VANTAGE_API_KEY to .env.local for more requests." },
        { status: 429 }
      );
    }

    if (fn === "GLOBAL_QUOTE" && data["Global Quote"]) {
      const q = data["Global Quote"];
      return NextResponse.json({
        symbol: q["01. symbol"],
        price: parseFloat(q["05. price"]),
        change: parseFloat(q["09. change"]),
        changePercent: parseFloat(q["10. change percent"]?.replace("%", "")),
        volume: parseInt(q["06. volume"]),
        previousClose: parseFloat(q["08. previous close"]),
        high: parseFloat(q["03. high"]),
        low: parseFloat(q["04. low"]),
      });
    }

    if (fn === "TIME_SERIES_DAILY" && data["Time Series (Daily)"]) {
      const ts = data["Time Series (Daily)"];
      const points = Object.entries(ts)
        .slice(0, 90)
        .map(([date, values]: [string, unknown]) => {
          const v = values as Record<string, string>;
          return {
            date,
            open: parseFloat(v["1. open"]),
            high: parseFloat(v["2. high"]),
            low: parseFloat(v["3. low"]),
            close: parseFloat(v["4. close"]),
            volume: parseInt(v["5. volume"]),
          };
        })
        .reverse();
      return NextResponse.json(points);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
