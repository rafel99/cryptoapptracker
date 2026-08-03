"use client";

import { AnalyzedCoin } from "@/lib/types";

function fmtPrice(p: number) {
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return p.toPrecision(4);
}

export default function TickerTape({ coins }: { coins: AnalyzedCoin[] }) {
  const movers = [...coins].sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0)).slice(0, 20);
  const items = [...movers, ...movers]; // duplicate for seamless loop

  return (
    <div className="relative overflow-hidden border-y border-hairline bg-panel/60 py-2 dark:border-hairline">
      <div className="flex w-max animate-ticker gap-8 whitespace-nowrap font-mono text-[13px]">
        {items.map((c, i) => {
          const up = (c.change24h ?? 0) >= 0;
          return (
            <span key={`${c.id}-${i}`} className="flex items-center gap-2 px-2">
              <span className="text-mute">{c.symbol.toUpperCase()}</span>
              <span className="tabular text-ink">${fmtPrice(c.price)}</span>
              <span className={up ? "text-up" : "text-down"}>
                {up ? "▲" : "▼"} {Math.abs(c.change24h ?? 0).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
