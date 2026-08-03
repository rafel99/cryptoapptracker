import { Indicators, RawCoinGeckoCoin, ScoreBreakdown, DirectionalProbabilities } from "./types";

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/** Maps a value in [-limit, +limit] to a 0-100 score centered at 50. */
function centeredScore(value: number, limit: number): number {
  const ratio = clamp((value / limit) * 50 + 50, 0, 100);
  return ratio;
}

function technicalScore(ind: Indicators, reasons: string[]): number {
  const parts: number[] = [];

  if (ind.rsi14 !== null) {
    // RSI < 30 oversold (bullish reversal signal) -> higher score
    // RSI > 70 overbought (pullback risk) -> lower score
    let rsiScore: number;
    if (ind.rsi14 < 30) {
      rsiScore = 70 + (30 - ind.rsi14); // deeper oversold -> stronger reversal signal
      reasons.push(`RSI en ${ind.rsi14.toFixed(1)} (sobreventa) sugiere posible rebote`);
    } else if (ind.rsi14 > 70) {
      rsiScore = 30 - (ind.rsi14 - 70);
      reasons.push(`RSI en ${ind.rsi14.toFixed(1)} (sobrecompra) sugiere posible corrección`);
    } else {
      rsiScore = 50 + (50 - Math.abs(ind.rsi14 - 50)) * 0.2;
    }
    parts.push(clamp(rsiScore));
  }

  if (ind.macdHistogram !== null && ind.macd !== null) {
    const macdScore = centeredScore(ind.macdHistogram, Math.abs(ind.macd) * 2 || 1);
    parts.push(macdScore);
    if (ind.macdHistogram > 0) reasons.push("MACD por encima de la señal (momentum alcista)");
    else if (ind.macdHistogram < 0) reasons.push("MACD por debajo de la señal (momentum bajista)");
  }

  if (ind.pricePositionInBands !== null) {
    // near lower band -> potential bounce (higher score); near upper band -> potential pullback
    const bbScore = (1 - ind.pricePositionInBands) * 40 + 30;
    parts.push(clamp(bbScore));
    if (ind.pricePositionInBands < 0.2) reasons.push("Precio cerca de la banda inferior de Bollinger");
    if (ind.pricePositionInBands > 0.8) reasons.push("Precio cerca de la banda superior de Bollinger");
  }

  if (ind.ema12 !== null && ind.ema26 !== null) {
    const trendScore = ind.ema12 > ind.ema26 ? 65 : 35;
    parts.push(trendScore);
    reasons.push(ind.ema12 > ind.ema26 ? "EMA12 por encima de EMA26 (tendencia de corto plazo alcista)" : "EMA12 por debajo de EMA26 (tendencia de corto plazo bajista)");
  }

  if (parts.length === 0) return 50;
  return clamp(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function momentumScore(coin: RawCoinGeckoCoin, reasons: string[]): number {
  const weights: [number | null, number, string][] = [
    [coin.price_change_percentage_24h_in_currency, 8, "24h"],
    [coin.price_change_percentage_7d_in_currency, 15, "7d"],
    [coin.price_change_percentage_30d_in_currency, 30, "30d"],
    [coin.price_change_percentage_1y_in_currency, 80, "1a"],
  ];
  const scores: number[] = [];
  for (const [val, limit, label] of weights) {
    if (val === null || val === undefined) continue;
    scores.push(centeredScore(val, limit));
  }
  if (scores.length === 0) return 50;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  const changes = [coin.price_change_percentage_24h_in_currency, coin.price_change_percentage_7d_in_currency, coin.price_change_percentage_30d_in_currency];
  const defined = changes.filter((c) => c !== null && c !== undefined) as number[];
  if (defined.length >= 2 && defined.every((c) => c > 0)) {
    reasons.push("Tendencia positiva consistente en 24h, 7d y 30d");
  } else if (defined.length >= 2 && defined.every((c) => c < 0)) {
    reasons.push("Tendencia negativa consistente en 24h, 7d y 30d");
  }
  return clamp(avg);
}

function valuationScore(coin: RawCoinGeckoCoin, reasons: string[]): number {
  // Distance from ATH: further below ATH = more theoretical upside room (not a guarantee)
  const athDistance = coin.ath_change_percentage; // typically negative, e.g. -40 means 40% below ATH
  let athScore = 50;
  if (typeof athDistance === "number") {
    athScore = clamp(50 - athDistance * 0.4); // more negative -> higher score
    if (athDistance < -60) reasons.push(`Cotiza ${Math.abs(athDistance).toFixed(0)}% por debajo de su máximo histórico`);
  }

  // Market cap rank as a stability/maturity proxy (not a growth signal by itself)
  let rankScore = 50;
  if (coin.market_cap_rank) {
    if (coin.market_cap_rank <= 20) rankScore = 60;
    else if (coin.market_cap_rank <= 100) rankScore = 55;
    else rankScore = 45; // smaller caps: more upside potential but also more risk (reflected in risk tier, not here)
  }

  return clamp(athScore * 0.65 + rankScore * 0.35);
}

function liquidityScore(coin: RawCoinGeckoCoin, reasons: string[]): number {
  if (!coin.market_cap || coin.market_cap === 0) return 50;
  const ratio = coin.total_volume / coin.market_cap; // daily turnover
  // Healthy range roughly 0.02 - 0.25; too low = illiquid, too high = speculative frenzy
  let score: number;
  if (ratio < 0.01) score = 30;
  else if (ratio < 0.03) score = 55;
  else if (ratio < 0.15) score = 70;
  else if (ratio < 0.4) score = 55;
  else score = 35;
  if (ratio < 0.01) reasons.push("Volumen bajo respecto a su capitalización (liquidez limitada)");
  if (ratio > 0.4) reasons.push("Volumen muy elevado respecto a su capitalización (posible especulación)");
  return score;
}

export function computeScore(coin: RawCoinGeckoCoin, ind: Indicators): ScoreBreakdown {
  const reasons: string[] = [];
  const technical = technicalScore(ind, reasons);
  const momentum = momentumScore(coin, reasons);
  const valuation = valuationScore(coin, reasons);
  const liquidity = liquidityScore(coin, reasons);

  const final = clamp(technical * 0.35 + momentum * 0.25 + valuation * 0.2 + liquidity * 0.2);

  const dataPoints = [
    ind.rsi14 !== null,
    ind.macd !== null,
    coin.price_change_percentage_7d_in_currency !== null && coin.price_change_percentage_7d_in_currency !== undefined,
    coin.price_change_percentage_30d_in_currency !== null && coin.price_change_percentage_30d_in_currency !== undefined,
    coin.price_change_percentage_1y_in_currency !== null && coin.price_change_percentage_1y_in_currency !== undefined,
  ];
  const completeness = dataPoints.filter(Boolean).length / dataPoints.length;
  const confidence: ScoreBreakdown["confidence"] = completeness >= 0.8 ? "alta" : completeness >= 0.5 ? "media" : "baja";

  return { technical, momentum, valuation, liquidity, final, confidence, reasons: reasons.slice(0, 4) };
}

/**
 * Heuristic directional probabilities derived from the score + momentum, NOT from a trained
 * ML model. Squashed toward 50% (coin-flip) to avoid false precision, and widened for longer
 * horizons where uncertainty is structurally higher.
 */
export function computeProbabilities(score: ScoreBreakdown, coin: RawCoinGeckoCoin): DirectionalProbabilities {
  const centered = (score.final - 50) / 50; // -1..1

  const base = 50 + centered * 22; // short horizon: score has more say
  const softened = 50 + centered * 14; // longer horizon: regress toward 50/50

  const h24 = clamp(50 + ((coin.price_change_percentage_24h_in_currency ?? 0) > 0 ? 6 : -6) + centered * 10, 20, 80);
  const d7 = clamp(base, 22, 78);
  const d30 = clamp(50 + centered * 18, 25, 75);
  const d90 = clamp(softened, 30, 70);
  const y1 = clamp(50 + centered * 10, 35, 65);

  return {
    h24: Math.round(h24),
    d7: Math.round(d7),
    d30: Math.round(d30),
    d90: Math.round(d90),
    y1: Math.round(y1),
  };
}

export function computeRiskLevel(coin: RawCoinGeckoCoin, ind: Indicators): "bajo" | "medio" | "alto" | "extremo" {
  let riskPoints = 0;
  if (coin.market_cap_rank > 300) riskPoints += 2;
  else if (coin.market_cap_rank > 100) riskPoints += 1;

  if (ind.volatility7d !== null) {
    if (ind.volatility7d > 3) riskPoints += 2;
    else if (ind.volatility7d > 1.5) riskPoints += 1;
  }

  if (coin.market_cap && coin.total_volume / coin.market_cap > 0.4) riskPoints += 1;

  if (riskPoints >= 4) return "extremo";
  if (riskPoints >= 3) return "alto";
  if (riskPoints >= 1) return "medio";
  return "bajo";
}

export function computeMultiplierPotential(coin: RawCoinGeckoCoin): "bajo" | "moderado" | "alto" | "especulativo" {
  const rank = coin.market_cap_rank || 9999;
  const belowAth = Math.abs(coin.ath_change_percentage || 0);
  if (rank <= 15) return "bajo";
  if (rank <= 100) return belowAth > 70 ? "alto" : "moderado";
  if (rank <= 300) return "alto";
  return "especulativo";
}
