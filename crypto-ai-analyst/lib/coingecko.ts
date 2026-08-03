import { RawCoinGeckoCoin } from "./types";

const CACHE_TTL_MS = 60_000; // 1 minute — respects CoinGecko's free-tier rate limit
let cache: { data: RawCoinGeckoCoin[]; timestamp: number } | null = null;

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=50&page=1" +
  "&sparkline=true&price_change_percentage=24h%2C7d%2C30d%2C1y";

export async function fetchMarketData(): Promise<{ coins: RawCoinGeckoCoin[]; fromCache: boolean }> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return { coins: cache.data, fromCache: true };
  }

  const res = await fetch(COINGECKO_URL, {
    headers: { Accept: "application/json" },
    // Vercel/Next edge caching hint — belt and suspenders alongside our own cache
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (cache) {
      // Serve stale cache rather than failing the dashboard outright
      return { coins: cache.data, fromCache: true };
    }
    throw new Error(`CoinGecko respondió ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as RawCoinGeckoCoin[];
  cache = { data, timestamp: now };
  return { coins: data, fromCache: false };
}
