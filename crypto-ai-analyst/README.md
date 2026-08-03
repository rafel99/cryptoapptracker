# Crypto AI Analyst — MVP

Dashboard de análisis cuantitativo de criptomonedas. Analiza ~50 monedas top por capitalización,
calcula indicadores técnicos reales (RSI, MACD, EMA, Bandas de Bollinger, volatilidad) a partir de
datos horarios de 7 días, y combina eso con momentum multi-horizonte, valoración vs. máximo
histórico y liquidez para generar un **IA Score (0-100)** explicable por moneda.

**Importante — léelo antes de usarlo con dinero real:** el IA Score y las "probabilidades" que
muestra son **heurísticas basadas en reglas**, no un modelo de Machine Learning entrenado con datos
históricos. Sirven para tener una lectura rápida y ordenada del mercado, no como asesoría
financiera. La Fase 2 (ver abajo) es la que incorpora modelos entrenados de verdad.

## Cómo correrlo en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. No necesita ninguna API key — usa el endpoint público y gratuito de
CoinGecko.

## Cómo desplegarlo en Vercel

1. Subí esta carpeta a un repo de GitHub (podés usar el editor web de GitHub como hacés con Serena:
   arrastrás los archivos, commit, listo).
2. Entrá a [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. Vercel detecta Next.js automáticamente. No hace falta configurar variables de entorno para esta
   versión. Deploy.

## Qué incluye esta versión (Fase 1)

- **Datos de mercado**: precio, market cap, volumen, cambios % en 24h/7d/30d/1a — vía CoinGecko
  (`/coins/markets`), una sola llamada por carga, con caché de 60s para no pegarle al rate limit
  gratuito.
- **Indicadores técnicos reales**: RSI(14), EMA(12/26), MACD, SMA(20), Bandas de Bollinger,
  volatilidad — calculados en el servidor a partir del `sparkline_in_7d` (168 puntos horarios) que
  CoinGecko entrega en la misma llamada.
- **IA Score explicable**: combina Técnico (35%), Momentum (25%), Valoración vs. ATH (20%) y
  Liquidez volumen/cap (20%). Cada score tiene un desglose visible al hacer click en una fila.
- **Riesgo y potencial de multiplicación**: clasificación heurística por rank de capitalización,
  volatilidad y liquidez.
- **Dashboard**: modo claro/oscuro, ticker tape animado, tabla ordenable y filtrable por riesgo,
  búsqueda, filas expandibles con la explicación de cada score.

## Roadmap — qué falta para acercarse al brief completo

Lo que pediste originalmente (1000+ monedas, on-chain, sentimiento con IA sobre redes, modelos de
ML entrenados y reentrenados, backtesting, alertas, blockchain, microservicios) es real, pero es
trabajo en capas. Orden sugerido:

1. **Más cobertura**: subir de 50 a 200-300 monedas (requiere paginar CoinGecko o pasar a un plan
   con API key para no chocar el rate limit).
2. **On-chain real**: integrar DefiLlama (gratis, sin key) para TVL, y evaluar Glassnode/
   IntoTheBlock (de pago) para whales y flujos de exchange.
3. **Sentimiento real**: pipeline que junte noticias/RSS + Reddit + X, y use la API de Claude para
   clasificar sentimiento — hoy el dashboard no fabrica un número de sentimiento falso, directamente
   no lo muestra hasta que haya datos reales detrás.
4. **Modelo de ML entrenado**: guardar cada predicción del score heurístico en una base de datos,
   comparar contra el resultado real, y entrenar un modelo (XGBoost es buen primer paso) que
   reemplace las reglas actuales.
5. **Backtesting y alertas**: una vez que hay histórico de predicciones guardado, backtesting sobre
   eso; alertas por Telegram cuando un score cruza un umbral.

Cada capa se puede sumar sin tirar abajo lo que ya funciona hoy.
