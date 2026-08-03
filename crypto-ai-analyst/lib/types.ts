export interface RawCoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
  price_change_percentage_1y_in_currency: number | null;
  ath: number;
  ath_change_percentage: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  sparkline_in_7d?: { price: number[] };
}

export interface Indicators {
  rsi14: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  sma20: number | null;
  bollinger: { upper: number; mid: number; lower: number } | null;
  volatility7d: number | null; // stdev of hourly returns, annualized-ish %
  pricePositionInBands: number | null; // 0 = lower band, 1 = upper band
}

export interface ScoreBreakdown {
  technical: number; // 0-100
  momentum: number; // 0-100
  valuation: number; // 0-100
  liquidity: number; // 0-100
  final: number; // 0-100 weighted
  confidence: "alta" | "media" | "baja";
  reasons: string[];
}

export interface DirectionalProbabilities {
  h24: number; // 0-100
  d7: number;
  d30: number;
  d90: number;
  y1: number;
}

export interface AnalyzedCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  change1y: number | null;
  athChangePercentage: number;
  indicators: Indicators;
  score: ScoreBreakdown;
  probabilities: DirectionalProbabilities;
  riskLevel: "bajo" | "medio" | "alto" | "extremo";
  multiplierPotential: "bajo" | "moderado" | "alto" | "especulativo";
}

export interface CryptosResponse {
  updatedAt: string;
  count: number;
  disclaimer: string;
  coins: AnalyzedCoin[];
}
