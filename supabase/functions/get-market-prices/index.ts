/**
 * get-market-prices — multi-source market data proxy
 *
 * Sources:
 *   • Stooq.com (primary, no key)       → OHLCV for commodities & indices (incl. high/low)
 *   • Yahoo Finance v8/finance/chart    → commodities fallback if Stooq fails
 *   • Frankfurter.app (no key)          → EUR, GBP, JPY, CHF, CNY forex rates
 *   • CoinGecko /coins/markets (no key) → BTC, ETH with 24h high/low
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
  { key: 'GOLD',   symbol: 'GC=F',  stooq: 'gc.f',  label: 'Gold',        tab: 'futures', decimals: 2  },
  { key: 'SILVER', symbol: 'SI=F',  stooq: 'si.f',  label: 'Silver',      tab: 'futures', decimals: 3  },
  { key: 'OIL',    symbol: 'CL=F',  stooq: 'cl.f',  label: 'Crude Oil',   tab: 'futures', decimals: 2  },
  { key: 'NATGAS', symbol: 'NG=F',  stooq: 'ng.f',  label: 'Natural Gas', tab: 'futures', decimals: 3  },
  { key: 'COPPER', symbol: 'HG=F',  stooq: 'hg.f',  label: 'Copper',      tab: 'futures', decimals: 3  },
  { key: 'SP500',  symbol: 'ES=F',  stooq: 'es.f',  label: 'S&P 500',     tab: 'futures', decimals: 0  },
  { key: 'WHEAT',  symbol: 'ZW=F',  stooq: 'zw.f',  label: 'Wheat',       tab: 'futures', decimals: 2  },
]

const FOREX_ASSETS = [
  { key: 'EUR', from: 'EUR', to: 'USD', label: 'EUR/USD', tab: 'forex', decimals: 4 },
  { key: 'GBP', from: 'GBP', to: 'USD', label: 'GBP/USD', tab: 'forex', decimals: 4 },
  { key: 'JPY', from: 'USD', to: 'JPY', label: 'USD/JPY', tab: 'forex', decimals: 2 },
  { key: 'CHF', from: 'USD', to: 'CHF', label: 'USD/CHF', tab: 'forex', decimals: 4 },
  { key: 'CNY', from: 'USD', to: 'CNY', label: 'USD/CNY', tab: 'forex', decimals: 4 },
]

const CRYPTO_ASSETS = [
  { key: 'BTC', cgId: 'bitcoin',  label: 'Bitcoin',  tab: 'crypto', decimals: 0 },
  { key: 'ETH', cgId: 'ethereum', label: 'Ethereum', tab: 'crypto', decimals: 2 },
]

// ─── Stooq CSV (primary for commodities — free, no auth, includes OHLCV) ─────
// URL: https://stooq.com/q/l/?s=gc.f&f=sd2t2ohlcv&h&e=csv
// CSV columns: Symbol, Date, Time, Open, High, Low, Close, Volume
// Change % uses today's Open as proxy for previous close (intraday move)

async function fetchStooq(asset: { key: string; stooq: string; label: string; tab: string; decimals: number }): Promise<any> {
  try {
    const url = `https://stooq.com/q/l/?s=${asset.stooq}&f=sd2t2ohlcv&h&e=csv`
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/csv,text/plain,*/*' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null

    const text = await r.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) return null

    const row = lines[1].split(',')
    if (row.length < 7) return null

    const open  = parseFloat(row[3])
    const high  = parseFloat(row[4])
    const low   = parseFloat(row[5])
    const close = parseFloat(row[6])

    // Stooq returns 'N/A' or 0 when the market has no data
    if (!close || isNaN(close) || close === 0) return null

    const change    = !isNaN(open) && open ? close - open : null
    const changePct = !isNaN(open) && open ? ((close - open) / open) * 100 : null

    return {
      key: asset.key,
      label: asset.label,
      tab: asset.tab,
      decimals: asset.decimals,
      price:  close,
      open:   !isNaN(open)  ? open  : null,
      high:   !isNaN(high)  ? high  : null,
      low:    !isNaN(low)   ? low   : null,
      change,
      changePercent: changePct,
      currency: 'USD',
      marketState: 'REGULAR',
      source: 'stooq',
    }
  } catch {
    return null
  }
}

// ─── Yahoo Finance v8/finance/chart (fallback for commodities) ────────────────

async function fetchYahooChart(asset: { key: string; symbol: string; label: string; tab: string; decimals: number }): Promise<any> {
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
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null

    const data   = await r.json()
    const meta   = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null

    const price     = meta.regularMarketPrice as number
    const prevClose = (meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose) as number | undefined
    const high      = meta.regularMarketDayHigh as number | undefined
    const low       = meta.regularMarketDayLow  as number | undefined
    const open      = meta.regularMarketOpen    as number | undefined
    const change    = prevClose != null ? price - prevClose : null
    const changePct = prevClose != null ? ((price - prevClose) / prevClose) * 100 : null

    return {
      key: asset.key,
      label: asset.label,
      tab: asset.tab,
      decimals: asset.decimals,
      price,
      open:  open  ?? null,
      high:  high  ?? null,
      low:   low   ?? null,
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

// ─── Frankfurter.app for forex (ECB reference rates, yesterday for % change) ──

async function fetchForexPair(asset: { key: string; from: string; to: string; label: string; tab: string; decimals: number }): Promise<any> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yDate = yesterday.toISOString().split('T')[0]

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
      open: null,
      high: null,
      low:  null,
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

// ─── CoinGecko /coins/markets — price + 24h high/low + change% in one call ───

async function fetchCryptoPrices(): Promise<any[]> {
  try {
    const ids = CRYPTO_ASSETS.map(a => a.cgId).join(',')
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return []
    return await r.json()
  } catch {
    return []
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // All sources fire in parallel for minimum latency
    const [commodityResults, forexResults, cryptoMarkets] = await Promise.all([
      // Commodities: Stooq primary → Yahoo fallback
      Promise.allSettled(
        COMMODITY_ASSETS.map(async (asset) => {
          const stooq = await fetchStooq(asset)
          if (stooq) return stooq
          return fetchYahooChart(asset)
        })
      ),
      Promise.allSettled(FOREX_ASSETS.map(fetchForexPair)),
      fetchCryptoPrices(),
    ])

    const prices: any[] = []
    const sources = { stooq: 0, yahoo: 0, frankfurter: 0, coingecko: 0, unavailable: 0 }

    // Commodities
    for (let i = 0; i < COMMODITY_ASSETS.length; i++) {
      const res   = commodityResults[i]
      const asset = COMMODITY_ASSETS[i]
      if (res.status === 'fulfilled' && res.value) {
        prices.push(res.value)
        const src = res.value.source as keyof typeof sources
        if (src in sources) sources[src]++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, open: null, high: null, low: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
        sources.unavailable++
      }
    }

    // Forex
    for (let i = 0; i < FOREX_ASSETS.length; i++) {
      const res   = forexResults[i]
      const asset = FOREX_ASSETS[i]
      if (res.status === 'fulfilled' && res.value) {
        prices.push(res.value)
        sources.frankfurter++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, open: null, high: null, low: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
        sources.unavailable++
      }
    }

    // Crypto — build lookup by CoinGecko ID
    const cgMap: Record<string, any> = {}
    for (const row of cryptoMarkets) if (row?.id) cgMap[row.id] = row

    for (const asset of CRYPTO_ASSETS) {
      const cg = cgMap[asset.cgId]
      if (cg?.current_price != null) {
        prices.push({
          key: asset.key,
          label: asset.label,
          tab: asset.tab,
          decimals: asset.decimals,
          price: cg.current_price,
          open:  null,
          high:  cg.high_24h  ?? null,
          low:   cg.low_24h   ?? null,
          change:        cg.price_change_24h                ?? null,
          changePercent: cg.price_change_percentage_24h     ?? null,
          currency: 'USD',
          marketState: 'REGULAR',
          source: 'coingecko',
        })
        sources.coingecko++
      } else {
        prices.push({ key: asset.key, label: asset.label, tab: asset.tab, decimals: asset.decimals, price: null, open: null, high: null, low: null, change: null, changePercent: null, currency: 'USD', source: 'unavailable' })
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
