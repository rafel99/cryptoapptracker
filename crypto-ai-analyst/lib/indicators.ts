import { Indicators } from "./types";

/** Simple Moving Average over the last `period` values. */
function sma(series: number[], period: number): number | null {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Exponential Moving Average (full series, returns the last EMA value). */
function ema(series: number[], period: number): number | null {
  if (series.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = series.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < series.length; i++) {
    emaVal = series[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

/** EMA series (all values from `period` onward), used internally for MACD signal line. */
function emaSeries(series: number[], period: number): number[] {
  if (series.length < period) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let emaVal = series.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(emaVal);
  for (let i = period; i < series.length; i++) {
    emaVal = series[i] * k + emaVal * (1 - k);
    out.push(emaVal);
  }
  return out;
}

/** Relative Strength Index (Wilder's smoothing). */
function rsi(series: number[], period = 14): number | null {
  if (series.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = series[i] - series[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < series.length; i++) {
    const diff = series[i] - series[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** MACD (12,26,9) computed from an EMA series. */
function macd(series: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  if (series.length < 26) return { macd: null, signal: null, histogram: null };
  const ema12Series = emaSeries(series, 12);
  const ema26Series = emaSeries(series, 26);
  const offset = ema12Series.length - ema26Series.length;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26Series.length; i++) {
    macdLine.push(ema12Series[i + offset] - ema26Series[i]);
  }
  if (macdLine.length < 9) return { macd: macdLine.at(-1) ?? null, signal: null, histogram: null };
  const signalSeries = emaSeries(macdLine, 9);
  const macdVal = macdLine.at(-1)!;
  const signalVal = signalSeries.at(-1)!;
  return { macd: macdVal, signal: signalVal, histogram: macdVal - signalVal };
}

/** Bollinger Bands (period, numStdDev). */
function bollinger(series: number[], period = 20, numStdDev = 2) {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mid) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: mid + numStdDev * stdDev, mid, lower: mid - numStdDev * stdDev };
}

/** Volatility proxy: stdev of hourly % returns over the series, expressed as a % */
function volatility(series: number[]): number | null {
  if (series.length < 2) return null;
  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1] === 0) continue;
    returns.push((series[i] - series[i - 1]) / series[i - 1]);
  }
  if (returns.length === 0) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

/**
 * Computes the full indicator set from an hourly price series
 * (CoinGecko's sparkline_in_7d gives ~168 hourly points).
 */
export function computeIndicators(series: number[]): Indicators {
  const clean = series.filter((v) => typeof v === "number" && !Number.isNaN(v) && v > 0);
  const rsi14 = rsi(clean, 14);
  const ema12 = ema(clean, 12);
  const ema26 = ema(clean, 26);
  const { macd: macdVal, signal, histogram } = macd(clean);
  const sma20 = sma(clean, 20);
  const bb = bollinger(clean, 20, 2);
  const vol7d = volatility(clean);

  let pricePositionInBands: number | null = null;
  if (bb && clean.length > 0) {
    const lastPrice = clean.at(-1)!;
    const range = bb.upper - bb.lower;
    pricePositionInBands = range > 0 ? (lastPrice - bb.lower) / range : 0.5;
  }

  return {
    rsi14,
    ema12,
    ema26,
    macd: macdVal,
    macdSignal: signal,
    macdHistogram: histogram,
    sma20,
    bollinger: bb,
    volatility7d: vol7d,
    pricePositionInBands,
  };
}
