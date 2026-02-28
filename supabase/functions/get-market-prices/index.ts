/**
 * get-market-prices — server-side Yahoo Finance proxy
 *
 * Fetches live prices for all market assets (commodities, forex, crypto).
 * Must run server-side because Yahoo Finance blocks cross-origin browser requests.
 *
 * Returns:
 *   { prices: AssetPrice[], fetchedAt: string }
 *
 * Each AssetPrice:
 *   { key, symbol, label, tab, price, change, changePercent, currency, marketState }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Asset manifest ────────────────────────────────────────────────────────────
// Yahoo Finance ticker symbols for each asset we track
const ASSETS = [
  // Futures & Commodities
  { key: 'GOLD',    symbol: 'GC=F',     label: 'Gold',        tab: 'futures', unit: 'oz',     decimals: 2 },
  { key: 'SILVER',  symbol: 'SI=F',     label: 'Silver',      tab: 'futures', unit: 'oz',     decimals: 3 },
  { key: 'OIL',     symbol: 'CL=F',     label: 'Crude Oil',   tab: 'futures', unit: 'bbl',    decimals: 2 },
  { key: 'NATGAS',  symbol: 'NG=F',     label: 'Natural Gas', tab: 'futures', unit: 'MMBtu',  decimals: 3 },
  { key: 'COPPER',  symbol: 'HG=F',     label: 'Copper',      tab: 'futures', unit: 'lb',     decimals: 3 },
  { key: 'SP500',   symbol: 'ES=F',     label: 'S&P 500',     tab: 'futures', unit: 'pts',    decimals: 0 },
  { key: 'WHEAT',   symbol: 'ZW=F',     label: 'Wheat',       tab: 'futures', unit: 'bu',     decimals: 2 },
  // Forex majors (all priced against USD)
  { key: 'EUR',     symbol: 'EURUSD=X', label: 'EUR/USD',     tab: 'forex',   unit: '',       decimals: 4 },
  { key: 'GBP',     symbol: 'GBPUSD=X', label: 'GBP/USD',     tab: 'forex',   unit: '',       decimals: 4 },
  { key: 'JPY',     symbol: 'USDJPY=X', label: 'USD/JPY',     tab: 'forex',   unit: '',       decimals: 2 },
  { key: 'CHF',     symbol: 'USDCHF=X', label: 'USD/CHF',     tab: 'forex',   unit: '',       decimals: 4 },
  { key: 'CNY',     symbol: 'USDCNY=X', label: 'USD/CNY',     tab: 'forex',   unit: '',       decimals: 4 },
  // Crypto
  { key: 'BTC',     symbol: 'BTC-USD',  label: 'Bitcoin',     tab: 'crypto',  unit: '',       decimals: 0 },
  { key: 'ETH',     symbol: 'ETH-USD',  label: 'Ethereum',    tab: 'crypto',  unit: '',       decimals: 2 },
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const symbolList = ASSETS.map(a => a.symbol).join(',')

    // Yahoo Finance v7 quote — server-side only (CORS blocked in browsers)
    const yahooUrl =
      `https://query1.finance.yahoo.com/v7/finance/quote` +
      `?symbols=${encodeURIComponent(symbolList)}` +
      `&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,` +
      `regularMarketTime,regularMarketPreviousClose,marketState,currency,shortName`

    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`)

    const data = await res.json()
    const results: any[] = data?.quoteResponse?.result || []

    // Index results by symbol for O(1) lookup
    const bySymbol: Record<string, any> = {}
    for (const r of results) bySymbol[r.symbol] = r

    const prices = ASSETS.map(asset => {
      const q = bySymbol[asset.symbol]
      if (!q || q.regularMarketPrice == null) {
        return {
          key: asset.key,
          symbol: asset.symbol,
          label: asset.label,
          tab: asset.tab,
          decimals: asset.decimals,
          unit: asset.unit,
          price: null,
          change: null,
          changePercent: null,
          currency: 'USD',
          marketState: 'CLOSED',
        }
      }
      return {
        key: asset.key,
        symbol: asset.symbol,
        label: asset.label,
        tab: asset.tab,
        decimals: asset.decimals,
        unit: asset.unit,
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
        prevClose: q.regularMarketPreviousClose ?? null,
        currency: q.currency || 'USD',
        marketState: q.marketState || 'REGULAR',   // REGULAR | PRE | POST | CLOSED
        marketTime: q.regularMarketTime ?? null,
      }
    })

    return new Response(
      JSON.stringify({ prices, fetchedAt: new Date().toISOString() }),
      { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' }, status: 200 }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message, prices: [] }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
