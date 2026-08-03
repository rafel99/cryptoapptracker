import { NextResponse } from "next/server";
import { fetchMarketData } from "@/lib/coingecko";
import { computeIndicators } from "@/lib/indicators";
import { computeScore, computeProbabilities, computeRiskLevel, computeMultiplierPotential } from "@/lib/score";
import { AnalyzedCoin, CryptosResponse } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  try {
    const { coins } = await fetchMarketData();

    const analyzed: AnalyzedCoin[] = coins.map((coin) => {
      const series = coin.sparkline_in_7d?.price ?? [];
      const indicators = computeIndicators(series);
      const score = computeScore(coin, indicators);
      const probabilities = computeProbabilities(score, coin);
      const riskLevel = computeRiskLevel(coin, indicators);
      const multiplierPotential = computeMultiplierPotential(coin);

      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        price: coin.current_price,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        volume24h: coin.total_volume,
        change24h: coin.price_change_percentage_24h_in_currency,
        change7d: coin.price_change_percentage_7d_in_currency,
        change30d: coin.price_change_percentage_30d_in_currency,
        change1y: coin.price_change_percentage_1y_in_currency,
        athChangePercentage: coin.ath_change_percentage,
        indicators,
        score,
        probabilities,
        riskLevel,
        multiplierPotential,
      };
    });

    const payload: CryptosResponse = {
      updatedAt: new Date().toISOString(),
      count: analyzed.length,
      disclaimer:
        "IA Score y probabilidades son heurísticas basadas en reglas técnicas y de momentum sobre datos públicos de mercado. No son un modelo de ML entrenado ni asesoría financiera.",
      coins: analyzed,
    };

    return NextResponse.json(payload, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `No se pudo obtener datos del mercado: ${message}` }, { status: 502 });
  }
}
