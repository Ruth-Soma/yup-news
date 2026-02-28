/**
 * get-market-prices — multi-source market data proxy
 *
 * Sources:
 *   • Yahoo Finance v8/finance/chart  → commodities & indices (per-symbol, no crumb needed)
 *   • Frankfurter.app (no key)        → EUR, GBP, JPY, CHF, CNY forex rates
 *   • CoinGecko free API (no key)     → BTC, ETH
 *
 * Called from Market.jsx every 60 s.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0'

// ─── Asset manifest ────────────────────────────────────────────────────────────

const COMMODITY_ASSETS = [
  { key: 'GOLD',   symbol: 'GC=F',  label: 'Gold',        tab: 'futures', decimals: 2 },
  { key: 'SILVER', symbol: 'SI=F',  label: 'Silver',      tab: 'futures', decimals: 3 },
  { key: 'OIL',    symbol: 'CL=F',  label: 'Crude Oil',   tab: 'futures', decimals: 2 },
  { key: 'NATGAS', symbol: 'NG=F',  label: 'Natural Gas', tab: 'futures', decimals: 3 },
  { key: 'COPPER', symbol: 'HG=F',  label: 'Copper',      tab: 'futures', decimals: 3 },
  { key: 'SP500',  symbol: 'ES=F',  label: 'S&P 500',     tab: 'futures', decimals: 0 },
  { key: 'WHEAT',  symbol: 'ZW=F',  label: 'Wheat',       tab: 'futures', decimals: 2 },
]

const FOREX_ASSETS = [
  // pair: "EUR/USD" → base=EUR from=EUR to=USD
  { key: 'EUR', from: 'EUR', to: 'USD', label: 'EUR/USD', tab: 'forex', decimals: 4 },
  { key: 'GBP', from: 'GBP', to: 'USD', label: 'GBP/USD', tab: 'forex', decimals: 4 },
  // pair: "USD/JPY" → base=USD from=USD to=JPY  (keep as-is)
  { key: 'JPY', from: 'USD', to: 'JPY', label: 'USD/JPY', tab: 'forex', decimals: 2 },
  { key: 'CHF', from: 'USD', to: 'CHF', label: 'USD/CHF', tab: 'forex', decimals: 4 },
  { key: 'CNY', from: 'USD', to: 'CNY', label: 'USD/CNY', tab: 'forex', decimals: 4 },
]

const CRYPTO_ASSETS = [
  { key: 'BTC', cgId: 'bitcoin',  label: 'Bitcoin',  tab: 'crypto', decimals: 0 },
  { key: 'ETH', cgId: 'ethereum', label: 'Ethereum', tab: 'crypto', decimals: 2 },
]

// ─── Yahoo Finance v8/finance/chart (per-symbol, no crumb) ────────────────────
// This endpoint returns OHLCV + meta prices and does NOT require crumb auth,
// unlike the v7/finance/quote bulk endpoint.

async function fetchYahooChart(
  asset: { key: string; symbol: string; label: string; tab: string; decimals: number }
): Promise<any> {
  try {
    const url =
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.symbol)}` +
      `?interval=1d&range=2d&includePrePost=false&useYfid=false&lang=en-US&region=US`

    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': `https://finance.yahoo.com/quote/${asset.symbol}/`,
        'Origin': 'https://finance.yahoo.com',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null

    const data = await r.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null

    const price      = meta.regularMarketPrice as number
    const prevClose  = (meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose) as number | undefined
    const change     = prevClose != null ? price - prevClose : null
    const changePct  = prevClose != null ? ((price - prevClose) / prevClose) * 100 : null

    return {
      key: asset.key,
      label: asset.label,
      tab: asset.tab,
      decimals: asset.decimals,
      price,
      change,
      changePercent: changePct,
      currency: (meta.currency as string) || 'USD',
      marketState: (meta.marketState as string) || 'REGULAR',
      source: 'yahoo',
    }
  } catch {
    return null
  }
}

// ─── Frankfurter.app for forex ────────────────────────────────────────────────
// Fetch each pair correctly: EUR/USD = GET /latest?from=EUR&to=USD
// USD/JPY = GET /latest?from=USD&to=JPY  (rate is already USD/JPY)

async function fetchForexPair(
  asset: { key: string; from: string; to: string; label: string; tab: string; decimals: number }
): Promise<any> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yDate = yesterday.toISOString().split('T')[0]

    // Fetch today + yesterday in parallel for change %
    const [todayRes, yestRes] = await Promise.allSettled([
      fetch(`https://api.frankfurter.app/latest?from=${asset.from}&to=${asset.to}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://api.frankfurter.app/${yDate}?from=${asset.from}&to=${asset.to}`, { signal: AbortSignal.timeout(5000) }),
    ])

    if (todayRes.status !== 'fulfilled' || !todayRes.value.ok) return null

    const today = await todayRes.value.json()
    const price = today?.rates?.[asset.to] as number | undefined
    if (price == null) return null

    let yPrice: number | null = null
    if (yestRes.status === 'fulfilled' && yestRes.value.ok) {
      const yData = await yestRes.value.json()
      yPrice = yData?.rates?.[asset.to] ?? null
    }

    const change    = yPrice != null ? price - yPrice : null
    const changePct = yPrice != null ? ((price - yPrice) / yPrice) * 100 : null

    return {
      key: asset.key,
      label: asset.label,
      tab: asset.tab,
      decimals: asset.decimals,
      price,
      change,
      changePercent: changePct,
      currency: 'USD',
      marketState: 'REGULAR',
      source: 'frankfurter',
    }
  } catch {
    return null
  }
}

// ─── CoinGecko for crypto ─────────────────────────────────────────────────────

async function fetchCryptoPrices(): Promise<Record<string, any>> {
  const ids = CRYPTO_ASSETS.map(a => a.cgId).join(',')
  const r = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) }
  )
  if (!r.ok) return {}
  return await r.json()
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // All requests fire in parallel
    const [commodityResults, forexResults, cryptoData] = await Promise.all([
      Promise.allSettled(COMMODITY_ASSETS.map(fetchYahooChart)),
      Promise.allSettled(FOREX_ASSETS.map(fetchForexPair)),
      fetchCryptoPrices().catch(() => ({} as Record<string, any>)),
    ])

    const prices: any[] = []
    const sources = { yahoo: 0, frankfurter: 0, coingecko: 0, unavailable: 0 }

    // Commodities (Yahoo Finance v8 chart)
    for (let i = 0; i < COMMODITY_ASSETS.length; i++) {
      const res = commodityResults[i]
      const asset = COMMODITY_ASSETS[i]
      if (res.status === 'fulfilled' && res.value) {
        prices.push(res.value)
        sources.yahoo++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
        sources.unavailable++
      }
    }

    // Forex (Frankfurter)
    for (let i = 0; i < FOREX_ASSETS.length; i++) {
      const res = forexResults[i]
      const asset = FOREX_ASSETS[i]
      if (res.status === 'fulfilled' && res.value) {
        prices.push(res.value)
        sources.frankfurter++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
        sources.unavailable++
      }
    }

    // Crypto (CoinGecko)
    for (const asset of CRYPTO_ASSETS) {
      const cg = cryptoData[asset.cgId]
      if (cg?.usd != null) {
        prices.push({
          key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals,
          price: cg.usd,
          change: null,
          changePercent: cg.usd_24h_change ?? null,
          currency: 'USD', marketState: 'REGULAR', source: 'coingecko',
        })
        sources.coingecko++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
        sources.unavailable++
      }
    }

    return new Response(
      JSON.stringify({ prices, fetchedAt: new Date().toISOString(), sources }),
      { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' }, status: 200 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message, prices: [] }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
