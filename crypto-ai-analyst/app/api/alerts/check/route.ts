import { NextRequest, NextResponse } from "next/server";
import { fetchMarketData } from "@/lib/coingecko";
import { computeIndicators } from "@/lib/indicators";
import { computeScore } from "@/lib/score";
import { sendTelegramMessage } from "@/lib/telegram";

export const revalidate = 0;

const HIGH_THRESHOLD = Number(process.env.ALERT_SCORE_HIGH ?? 75);
const LOW_THRESHOLD = Number(process.env.ALERT_SCORE_LOW ?? 25);
const MAX_ITEMS_PER_SIDE = 8;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const querySecret = req.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { coins } = await fetchMarketData();

    const scored = coins.map((coin) => {
      const indicators = computeIndicators(coin.sparkline_in_7d?.price ?? []);
      const score = computeScore(coin, indicators);
      return { coin, score };
    });

    const high = scored
      .filter((c) => c.score.final >= HIGH_THRESHOLD)
      .sort((a, b) => b.score.final - a.score.final)
      .slice(0, MAX_ITEMS_PER_SIDE);

    const low = scored
      .filter((c) => c.score.final <= LOW_THRESHOLD)
      .sort((a, b) => a.score.final - b.score.final)
      .slice(0, MAX_ITEMS_PER_SIDE);

    if (high.length === 0 && low.length === 0) {
      return NextResponse.json({ sent: false, reason: "Ninguna moneda cruzó los umbrales", high: 0, low: 0 });
    }

    const lines: string[] = [`<b>Crypto AI Analyst — alerta de score</b>`];

    if (high.length > 0) {
      lines.push(`\n📈 <b>Score alto (≥ ${HIGH_THRESHOLD})</b>`);
      for (const { coin, score } of high) {
        lines.push(`• ${coin.name} (${coin.symbol.toUpperCase()}) — ${score.final.toFixed(0)}/100`);
      }
    }

    if (low.length > 0) {
      lines.push(`\n📉 <b>Score bajo (≤ ${LOW_THRESHOLD})</b>`);
      for (const { coin, score } of low) {
        lines.push(`• ${coin.name} (${coin.symbol.toUpperCase()}) — ${score.final.toFixed(0)}/100`);
      }
    }

    lines.push(`\nHeurística, no asesoría financiera. https://cryptoapptracker.vercel.app`);

    const result = await sendTelegramMessage(lines.join("\n"));

    if (!result.ok) {
      return NextResponse.json({ sent: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({ sent: true, high: high.length, low: low.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
