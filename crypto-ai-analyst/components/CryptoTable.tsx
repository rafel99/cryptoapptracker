"use client";

import { useMemo, useState } from "react";
import { AnalyzedCoin } from "@/lib/types";
import ScoreBar from "./ScoreBar";

type SortKey = "rank" | "score" | "change24h" | "change7d" | "change30d";

const riskColor: Record<AnalyzedCoin["riskLevel"], string> = {
  bajo: "text-up",
  medio: "text-signal",
  alto: "text-down",
  extremo: "text-down",
};

function fmtUsd(n: number, compact = false) {
  if (compact) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  }
  if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toPrecision(4)}`;
}

function Change({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-faint">—</span>;
  const up = value >= 0;
  return <span className={`tabular font-mono text-xs ${up ? "text-up" : "text-down"}`}>{up ? "+" : ""}{value.toFixed(2)}%</span>;
}

export default function CryptoTable({ coins }: { coins: AnalyzedCoin[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDesc, setSortDesc] = useState(true);
  const [riskFilter, setRiskFilter] = useState<AnalyzedCoin["riskLevel"] | "todos">("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = coins.filter(
      (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
    );
    if (riskFilter !== "todos") list = list.filter((c) => c.riskLevel === riskFilter);

    const key: Record<SortKey, (c: AnalyzedCoin) => number> = {
      rank: (c) => c.marketCapRank,
      score: (c) => c.score.final,
      change24h: (c) => c.change24h ?? -999,
      change7d: (c) => c.change7d ?? -999,
      change30d: (c) => c.change30d ?? -999,
    };
    list = [...list].sort((a, b) => (key[sortKey](a) - key[sortKey](b)) * (sortDesc ? -1 : 1));
    return list;
  }, [coins, search, sortKey, sortDesc, riskFilter]);

  const headerBtn = (label: string, k: SortKey) => (
    <button
      onClick={() => {
        if (sortKey === k) setSortDesc((d) => !d);
        else {
          setSortKey(k);
          setSortDesc(true);
        }
      }}
      className={`flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider ${sortKey === k ? "text-ink" : "text-mute"} hover:text-ink`}
    >
      {label}
      {sortKey === k && <span className="text-signal">{sortDesc ? "↓" : "↑"}</span>}
    </button>
  );

  return (
    <div className="rounded-lg border border-hairline bg-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar moneda o símbolo…"
          className="flex-1 min-w-[180px] rounded-md border border-hairline bg-raised px-3 py-1.5 font-mono text-sm text-ink placeholder:text-faint outline-none focus:border-signal"
        />
        <div className="flex gap-1.5">
          {(["todos", "bajo", "medio", "alto", "extremo"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase transition-colors ${
                riskFilter === r ? "border-signal text-signal" : "border-hairline text-mute hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse">
          <thead>
            <tr className="border-b border-hairline text-left">
              <th className="px-3 py-2">{headerBtn("Rank", "rank")}</th>
              <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute">Moneda</th>
              <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute">Precio</th>
              <th className="px-3 py-2">{headerBtn("24h", "change24h")}</th>
              <th className="px-3 py-2">{headerBtn("7d", "change7d")}</th>
              <th className="px-3 py-2">{headerBtn("30d", "change30d")}</th>
              <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute">RSI</th>
              <th className="px-3 py-2">{headerBtn("IA Score", "score")}</th>
              <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute">Riesgo</th>
              <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-mute">Prob. 7d ↑</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className="cursor-pointer border-b border-hairline/60 transition-colors hover:bg-raised"
                >
                  <td className="px-3 py-2 font-mono text-xs text-mute">{c.marketCapRank}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img src={c.image} alt="" className="h-5 w-5 rounded-full" />
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="font-mono text-xs text-mute">{c.symbol.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="tabular px-3 py-2 font-mono text-sm">{fmtUsd(c.price)}</td>
                  <td className="px-3 py-2"><Change value={c.change24h} /></td>
                  <td className="px-3 py-2"><Change value={c.change7d} /></td>
                  <td className="px-3 py-2"><Change value={c.change30d} /></td>
                  <td className="tabular px-3 py-2 font-mono text-xs text-mute">
                    {c.indicators.rsi14 !== null ? c.indicators.rsi14.toFixed(0) : "—"}
                  </td>
                  <td className="px-3 py-2"><ScoreBar value={c.score.final} /></td>
                  <td className={`px-3 py-2 font-mono text-xs uppercase ${riskColor[c.riskLevel]}`}>{c.riskLevel}</td>
                  <td className="tabular px-3 py-2 font-mono text-xs text-ink">{c.probabilities.d7}%</td>
                </tr>
                {expanded === c.id && (
                  <tr className="border-b border-hairline/60 bg-raised/60">
                    <td colSpan={10} className="px-6 py-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-mute">Desglose del score</p>
                          <ul className="space-y-1 font-mono text-xs">
                            <li>Técnico: {c.score.technical.toFixed(0)}/100</li>
                            <li>Momentum: {c.score.momentum.toFixed(0)}/100</li>
                            <li>Valoración: {c.score.valuation.toFixed(0)}/100</li>
                            <li>Liquidez: {c.score.liquidity.toFixed(0)}/100</li>
                            <li className="text-mute">Confianza: {c.score.confidence}</li>
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-mute">Probabilidad direccional (heurística)</p>
                          <ul className="space-y-1 font-mono text-xs">
                            <li>24h: {c.probabilities.h24}%</li>
                            <li>7 días: {c.probabilities.d7}%</li>
                            <li>30 días: {c.probabilities.d30}%</li>
                            <li>90 días: {c.probabilities.d90}%</li>
                            <li>1 año: {c.probabilities.y1}%</li>
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-mute">Por qué</p>
                          <ul className="list-inside list-disc space-y-1 text-xs text-ink/90">
                            {c.score.reasons.length > 0 ? (
                              c.score.reasons.map((r, i) => <li key={i}>{r}</li>)
                            ) : (
                              <li className="text-mute">Datos insuficientes para explicación detallada</li>
                            )}
                          </ul>
                          <p className="mt-2 font-mono text-[11px] text-mute">
                            Potencial de multiplicación: <span className="text-ink">{c.multiplierPotential}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center font-mono text-sm text-mute">Sin resultados para este filtro.</p>}
      </div>
    </div>
  );
}
