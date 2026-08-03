"use client";

import { useEffect, useState, useCallback } from "react";
import { CryptosResponse } from "@/lib/types";
import TickerTape from "@/components/TickerTape";
import ThemeToggle from "@/components/ThemeToggle";
import CryptoTable from "@/components/CryptoTable";

export default function Home() {
  const [data, setData] = useState<CryptosResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cryptos");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const json = (await res.json()) as CryptosResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const top = data?.coins ? [...data.coins].sort((a, b) => b.score.final - a.score.final).slice(0, 3) : [];

  return (
    <main className="min-h-screen">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-2.5 w-2.5 items-center justify-center">
              <span className="h-2 w-2 animate-pulseDot rounded-full bg-up" />
            </div>
            <h1 className="font-mono text-lg font-semibold tracking-tight">
              CRYPTO AI ANALYST
            </h1>
            <span className="hidden font-mono text-[11px] text-mute sm:inline">v0.1 · MVP</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {data && data.coins.length > 0 && <TickerTape coins={data.coins} />}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-md border border-down/40 bg-down/10 px-4 py-3 font-mono text-sm text-down">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex h-64 items-center justify-center font-mono text-sm text-mute">Cargando mercado…</div>
        )}

        {data && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {top.map((c, i) => (
                <div key={c.id} className="rounded-lg border border-hairline bg-panel p-4">
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-mute">
                    #{i + 1} Top IA Score
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <span className="font-mono text-xl text-signal">{c.score.final.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <CryptoTable coins={data.coins} />

            <footer className="mt-6 space-y-1 font-mono text-[11px] text-mute">
              <p>{data.disclaimer}</p>
              <p>
                Fuente: CoinGecko (datos públicos de mercado) · Actualizado:{" "}
                {new Date(data.updatedAt).toLocaleString("es-ES")} · {data.count} activos analizados
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
