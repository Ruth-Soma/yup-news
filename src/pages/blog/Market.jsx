/**
 * Market.jsx — Professional markets page for forex, futures & crypto traders.
 *
 * Features:
 * - Live prices from Yahoo Finance via get-market-prices edge function (refreshes every 60s)
 * - Permanent asset watchlist always showing all assets with price, % change, and news sentiment
 * - BTC / ETH crypto tab
 * - Only business + finance + breaking-news (no politics bleed-through)
 * - Articles scored for asset impact using advanced multi-factor keyword detection
 * - Tabs: All · Forex · Futures & Commodities · Crypto
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'
import { getMarketPosts } from '@/lib/queries'
import { timeAgo, readingTime, placeholderImage, flagEmoji } from '@/lib/utils'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// ─── Asset definitions ─────────────────────────────────────────────────────────
// Must stay in sync with get-market-prices/index.ts ASSETS array

const ASSETS = [
  // ── Futures & Commodities ──────────────────────────────────────────────────
  { key: 'GOLD',   symbol: 'GOLD',   label: 'Gold',        tab: 'futures', icon: '🥇',
    keywords: ['gold','bullion','xau','spot gold','gold price','gold futures','precious metal',
               'gold reserve','gold demand','central bank gold','gold rally','gold slump',
               'yellow metal','gold output','gold mine','gold production'] },

  { key: 'SILVER', symbol: 'SILVER', label: 'Silver',      tab: 'futures', icon: '🥈',
    keywords: ['silver','xag','spot silver','silver price','silver futures','silver demand',
               'industrial silver','silver mine','silver output'] },

  { key: 'OIL',    symbol: 'OIL',    label: 'Crude Oil',   tab: 'futures', icon: '🛢️',
    keywords: ['crude oil','brent','wti','petroleum','opec','barrel','oil price','energy price',
               'oil market','oil supply','oil output','oil demand','oil inventory',
               'oil production cut','opec+','oil embargo','refinery','oil sanctions',
               'oil glut','oil shortage','energy crisis','oil export'] },

  { key: 'NATGAS', symbol: 'NATGAS', label: 'Natural Gas',  tab: 'futures', icon: '🔥',
    keywords: ['natural gas','nat gas','lng','gas price','gas supply','gas market',
               'gas pipeline','gas shortage','gas storage','gas demand',
               'liquefied natural gas','gas export','gas import','gas crisis'] },

  { key: 'COPPER', symbol: 'COPPER', label: 'Copper',       tab: 'futures', icon: '🪙',
    keywords: ['copper','copper price','base metal','copper demand','copper supply',
               'copper mine','copper futures','copper output','copper deficit',
               'industrial metal','copper import','copper export','dr congo copper',
               'chile copper','zambia copper'] },

  { key: 'SP500',  symbol: 'SP500',  label: 'S&P 500',     tab: 'futures', icon: '📈',
    keywords: ["s&p 500","s&p500","sp500","wall street","stock market","equities",
               "nasdaq","dow jones","us stocks","us equities","us index",
               "stock sell-off","stock rally","equity market","fed rate decision",
               "earnings season","corporate earnings","market correction","market crash",
               "risk appetite","investor sentiment","us economy"] },

  { key: 'WHEAT',  symbol: 'WHEAT',  label: 'Wheat',        tab: 'futures', icon: '🌾',
    keywords: ['wheat','grain price','food inflation','cereal','grain market',
               'wheat supply','wheat demand','wheat export','black sea grain',
               'ukraine grain','russia grain','food security','food crisis',
               'crop yield','harvest','drought crop','wheat futures'] },

  // ── Forex Majors ───────────────────────────────────────────────────────────
  { key: 'EUR',    symbol: 'EUR',    label: 'EUR/USD',     tab: 'forex',   icon: '💶',
    keywords: ['euro','eurozone','ecb','european central bank','lagarde',
               'eur/usd','eurusd','euro strengthens','euro weakens','euro falls',
               'eurozone gdp','eurozone inflation','eurozone economy','eu economy',
               'ecb rate','ecb hike','ecb cut','german economy','eu recession',
               'europe economy','european inflation','european growth','eu gdp',
               'european market','eu interest rate','ecb meeting','frankfurt',
               'germany gdp','france gdp','italy gdp','spain gdp','eu trade',
               'european stocks','euro area','single currency'] },

  { key: 'GBP',   symbol: 'GBP',    label: 'GBP/USD',     tab: 'forex',   icon: '💷',
    keywords: ['sterling','pound','gbp','bank of england','boe rate',
               'gbp/usd','gbpusd','pound strengthens','pound weakens','pound falls',
               'uk inflation','uk gdp','uk economy','uk recession','bailey boe',
               'uk budget','uk interest rate','uk rate hike','uk rate cut',
               'britain economy','british pound','london economy','england economy',
               'andrew bailey','uk trade','uk growth','uk fiscal','uk debt',
               'autumn statement','spring budget','office for budget responsibility'] },

  { key: 'JPY',   symbol: 'JPY',    label: 'USD/JPY',     tab: 'forex',   icon: '💴',
    keywords: ['yen','jpy','bank of japan','boj','usdjpy','usd/jpy',
               'yen weakens','yen strengthens','yen intervention','japan rate',
               'boj policy','japan inflation','japan gdp','ueda boj',
               'yen carry trade','japan economy','japanese yen','tokyo stocks',
               'japan trade','japan export','japan import','nikkei',
               'japan interest rate','japan monetary','boj decision'] },

  { key: 'CHF',   symbol: 'CHF',    label: 'USD/CHF',     tab: 'forex',   icon: '🇨🇭',
    keywords: ['swiss franc','chf','snb','swiss national bank','jordan snb',
               'switzerland inflation','safe haven currency','chf strengthens',
               'switzerland gdp','snb rate','swiss economy','switzerland economy',
               'swiss interest rate','geneva','zurich market','swiss bank'] },

  { key: 'CNY',   symbol: 'CNY',    label: 'USD/CNY',     tab: 'forex',   icon: '🇨🇳',
    keywords: ['yuan','renminbi','cny','pboc','peoples bank of china',
               'china currency','yuan devaluation','yuan weakens','yuan strengthens',
               'china rate','pboc rate cut','china economy','china gdp',
               'china trade','china exports','offshore yuan','china growth',
               'beijing economy','shanghai economy','china stimulus',
               'china monetary policy','china inflation','li qiang economy'] },

  // ── Crypto ─────────────────────────────────────────────────────────────────
  { key: 'BTC',   symbol: 'BTC',    label: 'Bitcoin',      tab: 'crypto',  icon: '₿',
    keywords: ['bitcoin','btc','crypto','cryptocurrency','digital asset',
               'bitcoin price','btc rally','btc crash','bitcoin etf','spot btc etf',
               'bitcoin halving','satoshi','lightning network','bitcoin mining',
               'bitcoin adoption','institutional bitcoin','btc futures',
               'blackrock bitcoin','bitcoin regulation','crypto market',
               'crypto crackdown','crypto rally','crypto sell-off'] },

  { key: 'ETH',   symbol: 'ETH',    label: 'Ethereum',     tab: 'crypto',  icon: '⟠',
    keywords: ['ethereum','eth','ether','defi','nft market','smart contract',
               'ethereum price','eth rally','ethereum network','layer 2',
               'ethereum staking','proof of stake','ethereum etf','vitalik',
               'crypto token','altcoin','ethereum upgrade'] },
]

// ─── Advanced sentiment engine ────────────────────────────────────────────────
//
// Each pattern includes a WEIGHT (1–3) reflecting market impact magnitude.
// Context-aware: "rate hike" is bearish for gold but bullish for USD —
// handled by asset-specific overrides in detectAssets().

const BULLISH_SIGNALS = [
  // Strong price action signals  (weight 3)
  { re: /\b(surge|surged|surges|soar|soared|soars|rocket|rocketed|skyrocket|spike|spiked)\b/i,       w: 3 },
  { re: /\b(record high|all.time high|multi.year high|52.week high|historic high)\b/i,                 w: 3 },
  { re: /\b(short squeeze|massive rally|strong rally|explosive rally)\b/i,                             w: 3 },
  // Moderate bullish signals     (weight 2)
  { re: /\b(rally|rallies|rallied|climb|climbed|climbs|advance|advances|advanced)\b/i,                 w: 2 },
  { re: /\b(rise|rises|rose|gain|gains|gained|rebound|rebounds|rebounded|bounce|bounced)\b/i,          w: 2 },
  { re: /\b(strengthen|strengthened|strengthens|appreciate|appreciated|recovery)\b/i,                  w: 2 },
  { re: /\b(rate cut|rate cuts|easing|monetary easing|quantitative easing|qe|stimulus)\b/i,            w: 2 },
  { re: /\b(strong gdp|gdp beat|growth beat|better.than.expected|beats forecast|beat estimates)\b/i,   w: 2 },
  { re: /\b(supply cut|production cut|opec cut|output cut|quota cut)\b/i,                              w: 2 },
  { re: /\b(safe haven|flight to safety|risk.off buying|demand surge)\b/i,                             w: 2 },
  { re: /\b(etf inflow|institutional buying|central bank buying|reserve accumulation)\b/i,             w: 2 },
  { re: /\b(halving|adoption surge|mainstream adoption|regulatory approval|spot etf approved)\b/i,    w: 2 },
  // Mild bullish signals          (weight 1)
  { re: /\b(jump|jumped|jumps|boost|boosted|lift|lifts|lifted|tick up|edge up|inch up)\b/i,            w: 1 },
  { re: /\b(stabilise|stabilize|stabilised|floor|bottomed|support level)\b/i,                          w: 1 },
  { re: /\b(positive outlook|bullish|upside|upbeat|optimistic)\b/i,                                    w: 1 },
  { re: /\b(lower inflation|inflation cools|inflation falls|disinflation)\b/i,                         w: 1 },
]

const BEARISH_SIGNALS = [
  // Strong bearish signals         (weight 3)
  { re: /\b(crash|crashed|crashes|collapse|collapsed|collapses|plunge|plunged|plunges)\b/i,            w: 3 },
  { re: /\b(record low|all.time low|multi.year low|52.week low|historic low)\b/i,                      w: 3 },
  { re: /\b(bank run|financial crisis|liquidity crisis|default|sovereign default)\b/i,                 w: 3 },
  { re: /\b(war|invasion|invaded|airstrike|nuclear|chemical attack|weapon of mass)\b/i,                w: 3 },
  // Moderate bearish signals       (weight 2)
  { re: /\b(fall|falls|fell|drop|drops|dropped|decline|declines|declined|tumble|tumbled)\b/i,          w: 2 },
  { re: /\b(slide|slides|slid|sink|sinks|sank|slump|slumped|slumps|plummet|plummeted)\b/i,            w: 2 },
  { re: /\b(rate hike|rate hikes|tightening|hawkish|aggressive hike|supersized hike)\b/i,              w: 2 },
  { re: /\b(recession|stagflation|contraction|gdp miss|gdp shrinks|negative growth)\b/i,               w: 2 },
  { re: /\b(tariff|tariffs|sanction|sanctions|embargo|trade war|trade ban|export ban)\b/i,             w: 2 },
  { re: /\b(supply glut|oversupply|inventory build|demand slump|demand collapse)\b/i,                  w: 2 },
  { re: /\b(sell.?off|liquidation|margin call|forced selling|etf outflow|capital flight)\b/i,          w: 2 },
  { re: /\b(exchange hack|exchange collapse|fraud|rug pull|scam|ban crypto|crypto ban)\b/i,            w: 2 },
  // Mild bearish signals            (weight 1)
  { re: /\b(weak|weakens|weakened|soften|softens|ease lower|retreat|retreats|retreated)\b/i,           w: 1 },
  { re: /\b(concern|concerns|fear|fears|risk|uncertainty|warn|warning|caution)\b/i,                    w: 1 },
  { re: /\b(hawkish|tighten|tightening|higher for longer|elevated rates)\b/i,                          w: 1 },
  { re: /\b(bearish|downside|downbeat|pessimistic|negative outlook)\b/i,                               w: 1 },
  { re: /\b(inflation surge|inflation spike|inflation accelerates|inflation high)\b/i,                 w: 1 },
]

// Asset-specific context overrides: certain macro events affect assets in OPPOSITE directions.
// e.g. "rate hike" is bearish for gold/equities but bullish for USD.
const ASSET_CONTEXT = {
  USD:   { bullish_extra: [/\b(rate hike|hawkish|fed hike|strong jobs|nonfarm payroll beat)\b/i],
           bearish_extra: [/\b(rate cut|dovish|fed cut|weak jobs|jobs miss)\b/i] },
  JPY:   { bullish_extra: [/\b(boj hike|boj raises|yield curve control end|japan tightening)\b/i],
           bearish_extra: [/\b(boj hold|yield curve control|boj easing|boj stimulus)\b/i] },
  CHF:   { bullish_extra: [/\b(safe haven|geopolitical risk|flight to safety|swiss franc)\b/i],
           bearish_extra: [/\b(snb cut|snb negative rate|risk.on)\b/i] },
  GOLD:  { bullish_extra: [/\b(war|geopolitical|safe haven|inflation hedge|dollar weakens|fed pivot)\b/i],
           bearish_extra: [/\b(rate hike|real yield rise|dollar rally|risk appetite)\b/i] },
  BTC:   { bullish_extra: [/\b(etf inflow|halving|institutional|blackrock|fidelity bitcoin|spot etf)\b/i],
           bearish_extra: [/\b(ban|crackdown|sec action|regulation tighten|exchange collapse)\b/i] },
  SP500: { bullish_extra: [/\b(rate cut|fed pivot|earnings beat|gdp beat|soft landing)\b/i],
           bearish_extra: [/\b(rate hike|recession fear|earnings miss|gdp miss|yield inversion)\b/i] },
}

function scoreSentiment(text) {
  let bull = 0
  let bear = 0
  for (const sig of BULLISH_SIGNALS) if (sig.re.test(text)) bull += sig.w
  for (const sig of BEARISH_SIGNALS) if (sig.re.test(text)) bear += sig.w
  return { bull, bear }
}

function detectAssets(title, excerpt) {
  const text = `${title} ${excerpt || ''}`.toLowerCase()
  const full  = `${title} ${excerpt || ''}`   // keep case for context overrides
  const found = []

  for (const asset of ASSETS) {
    if (!asset.keywords.some(kw => text.includes(kw))) continue

    let { bull, bear } = scoreSentiment(full)

    // Apply asset-specific context overrides
    const ctx = ASSET_CONTEXT[asset.key]
    if (ctx) {
      for (const re of (ctx.bullish_extra || [])) if (re.test(full)) bull += 2
      for (const re of (ctx.bearish_extra || [])) if (re.test(full)) bear += 2
    }

    const dir = bull > bear ? 'bullish' : bear > bull ? 'bearish' : 'neutral'
    const confidence = Math.abs(bull - bear)   // higher = more certain
    found.push({ ...asset, dir, bull, bear, confidence })
  }
  return found
}

// ─── Price formatting ─────────────────────────────────────────────────────────

function fmtPrice(price, key, decimals) {
  if (price == null) return '--'
  if (key === 'BTC') return `$${Math.round(price).toLocaleString('en-US')}`
  if (key === 'ETH') return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (key === 'SP500') return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (['EUR','GBP','JPY','CHF','CNY'].includes(key)) return price.toFixed(decimals ?? 4)
  if (['NATGAS','COPPER','SILVER'].includes(key)) return `$${price.toFixed(decimals ?? 3)}`
  return `$${price.toFixed(decimals ?? 2)}`
}

function fmtPct(pct) {
  if (pct == null) return null
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

// ─── Watchlist card ───────────────────────────────────────────────────────────

function WatchlistCard({ asset, priceData }) {
  const { key, label, icon, bullish = 0, bearish = 0, neutral = 0 } = asset
  const total  = bullish + bearish + neutral
  const net    = total === 0 ? 'no-data' : bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral'

  const price  = priceData?.price ?? null
  const pct    = priceData?.changePercent ?? null
  const change = priceData?.change ?? null

  const priceDirUp   = pct != null && pct > 0
  const priceDirDown = pct != null && pct < 0

  // Card border/bg driven by LIVE price direction (more reliable than news sentiment alone)
  const liveDir = priceDirUp ? 'up' : priceDirDown ? 'down' : 'flat'

  const cardStyle = {
    up:      'border-emerald-200 bg-emerald-50/70',
    down:    'border-red-200 bg-red-50/70',
    flat:    'border-g200 bg-g50',
    'no-data': 'border-g200 bg-g50',
  }

  const sentimentBadge = {
    bullish:   { cls: 'bg-emerald-500 text-white', label: '▲ BULL' },
    bearish:   { cls: 'bg-red-500 text-white',     label: '▼ BEAR' },
    neutral:   { cls: 'bg-amber-400 text-white',   label: '— NEU'  },
    'no-data': { cls: 'bg-g300 text-white',         label: '· N/A'  },
  }
  const badge = sentimentBadge[net]

  return (
    <div className={`flex-shrink-0 w-[130px] sm:w-[142px] border rounded-sm p-2.5 ${cardStyle[price != null ? liveDir : 'flat']}`}>
      {/* Top row: icon + sentiment badge */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[1rem] leading-none">{icon}</span>
        <span className={`text-[0.48rem] font-mono font-bold px-1 py-0.5 rounded-sm leading-tight ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Symbol */}
      <div className="text-[0.78rem] font-mono font-bold text-ink leading-none mb-0.5">{label}</div>

      {/* Live price */}
      <div className={`text-[0.85rem] font-mono font-bold leading-tight tabular-nums ${
        priceDirUp ? 'text-emerald-700' : priceDirDown ? 'text-red-600' : 'text-ink'
      }`}>
        {fmtPrice(price, key, priceData?.decimals)}
      </div>

      {/* % change */}
      {pct != null ? (
        <div className={`text-[0.6rem] font-mono font-medium leading-tight tabular-nums ${
          priceDirUp ? 'text-emerald-600' : priceDirDown ? 'text-red-500' : 'text-g400'
        }`}>
          {fmtPct(pct)} today
        </div>
      ) : (
        <div className="text-[0.58rem] font-mono text-g300 leading-tight">price unavailable</div>
      )}

      {/* News signal count */}
      {total > 0 && (
        <div className="mt-1 pt-1 border-t border-g200/60 text-[0.52rem] font-mono text-g400 flex gap-1">
          <span className="text-emerald-600">{bullish}↑</span>
          <span className="text-red-500">{bearish}↓</span>
          <span className="text-g400">{neutral}—</span>
          <span className="text-g300 ml-auto">news</span>
        </div>
      )}
    </div>
  )
}

// ─── Asset watchlist bar ──────────────────────────────────────────────────────

function AssetWatchlist({ posts, prices, lastUpdated, pricesUpdated }) {
  // Aggregate news sentiment per asset
  const tally = {}
  for (const a of ASSETS) tally[a.key] = { ...a, bullish: 0, bearish: 0, neutral: 0 }
  for (const post of posts) {
    for (const a of detectAssets(post.title, post.excerpt)) {
      if (tally[a.key]) tally[a.key][a.dir]++
    }
  }

  // Build price lookup keyed by asset key
  const priceMap = {}
  for (const p of (prices || [])) priceMap[p.key] = p

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-[0.58rem] font-mono uppercase tracking-[0.14em] text-g500">
          Live Prices &amp; News Sentiment
        </span>
        <div className="flex items-center gap-3 text-[0.52rem] font-mono text-g400">
          {pricesUpdated && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Prices {timeAgo(pricesUpdated)}
            </span>
          )}
          {lastUpdated && (
            <span>News {timeAgo(lastUpdated)}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {ASSETS.map(a => (
          <WatchlistCard key={a.key} asset={tally[a.key]} priceData={priceMap[a.key]} />
        ))}
      </div>
    </div>
  )
}

// ─── Inline asset badge on articles ──────────────────────────────────────────

function AssetBadge({ symbol, dir, confidence }) {
  const c = {
    bullish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bearish: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-g100 text-g500 border-g200',
  }
  const arrow = { bullish: '▲', bearish: '▼', neutral: '—' }
  // Show confidence dots: ● = strong, ◉ = medium, ○ = weak
  const dots = confidence >= 4 ? '●●' : confidence >= 2 ? '●○' : '○○'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.58rem] font-mono font-medium px-1.5 py-0.5 border rounded-sm ${c[dir]}`}
      title={`${arrow[dir]} ${dir} signal (strength: ${dots})`}>
      <span>{arrow[dir]}</span>
      <span>{symbol}</span>
      <span className="opacity-50 text-[0.45rem] ml-0.5">{dots}</span>
    </span>
  )
}

// ─── Market article row ────────────────────────────────────────────────────────

function MarketArticleRow({ post }) {
  const assets = detectAssets(post.title, post.excerpt)
  // Sort by confidence desc so strongest signals show first
  assets.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  return (
    <article className="group border-b border-g200 py-4 sm:py-5 hover:bg-g50 transition-colors duration-150">
      <div className="flex gap-3 sm:gap-4">
        {/* Thumbnail */}
        <Link to={`/post/${post.slug}`} className="shrink-0">
          <div className="w-[88px] h-[58px] sm:w-[120px] sm:h-[78px] bg-g100 overflow-hidden rounded-sm">
            <img
              src={post.cover_image || placeholderImage(post.category)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
              loading="lazy"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Asset impact badges */}
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {assets.slice(0, 5).map(a => (
                <AssetBadge key={a.key} symbol={a.key} dir={a.dir} confidence={a.confidence} />
              ))}
            </div>
          )}

          <Link to={`/post/${post.slug}`}>
            <h3 className="font-serif font-bold text-ink text-[0.9rem] sm:text-[1rem] leading-[1.28] line-clamp-2 group-hover:opacity-70 transition-opacity">
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="mt-1 text-[0.75rem] sm:text-[0.8rem] font-sans text-g500 line-clamp-1 leading-[1.5] hidden sm:block">
              {post.excerpt}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-1.5 sm:gap-2 text-[0.62rem] font-mono text-g400 flex-wrap">
            <span className="font-medium text-g500">{post.source_name || 'YUP'}</span>
            <span>·</span>
            <span>{timeAgo(post.published_at)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{readingTime(post.content || post.excerpt)}</span>
            {post.country_code && (
              <>
                <span>·</span>
                <span>{flagEmoji(post.country_code)} {post.country}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',     label: 'All Markets',           desc: 'All market-moving news' },
  { id: 'forex',   label: 'Forex',                 desc: 'Currency pairs & central banks' },
  { id: 'futures', label: 'Futures & Commodities', desc: 'Gold, Oil, Silver, Nat Gas & more' },
  { id: 'crypto',  label: 'Crypto',                desc: 'Bitcoin, Ethereum & digital assets' },
]

// ─── Main page ─────────────────────────────────────────────────────────────────

const NEWS_REFRESH_MS  = 5 * 60 * 1000   // articles refresh every 5 min
const PRICE_REFRESH_MS = 60 * 1000       // prices refresh every 60 s

export default function Market() {
  const [posts, setPosts]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [page, setPage]                   = useState(1)
  const [hasMore, setHasMore]             = useState(false)
  const [tab, setTab]                     = useState('all')
  const [lastUpdated, setLastUpdated]     = useState(null)
  const [prices, setPrices]               = useState([])
  const [pricesUpdated, setPricesUpdated] = useState(null)
  const [pricesLoading, setPricesLoading] = useState(true)
  const newsTimer  = useRef(null)
  const priceTimer = useRef(null)

  // ── News loader ─────────────────────────────────────────────────────────────
  const loadNews = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    const res = await getMarketPosts({ page: p, pageSize: 20 })
    setPosts(prev => append ? [...prev, ...(res.data || [])] : (res.data || []))
    setHasMore(p < (res.totalPages || 1))
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  // ── Price loader ────────────────────────────────────────────────────────────
  const loadPrices = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-market-prices`, {
        headers: { Authorization: `Bearer ${SUPABASE_ANON}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.prices?.length) {
        setPrices(data.prices)
        setPricesUpdated(new Date())
      }
    } catch { /* prices unavailable — fail silently */ }
    finally { setPricesLoading(false) }
  }, [])

  // Initial load
  useEffect(() => {
    loadNews(1)
    loadPrices()

    // Auto-refresh news every 5 min
    newsTimer.current = setInterval(() => {
      setPosts([])
      setPage(1)
      loadNews(1)
    }, NEWS_REFRESH_MS)

    // Auto-refresh prices every 60 s
    priceTimer.current = setInterval(loadPrices, PRICE_REFRESH_MS)

    return () => {
      clearInterval(newsTimer.current)
      clearInterval(priceTimer.current)
    }
  }, [loadNews, loadPrices])

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadNews(next, true)
  }

  // Tab filter
  const filtered = posts.filter(post => {
    const assets = detectAssets(post.title, post.excerpt)
    if (tab === 'all') return assets.length > 0
    return assets.some(a => a.tab === tab)
  })

  return (
    <>
      <SEO
        title="Markets — Live prices & news impact analysis"
        description="Real-time prices and market news with asset impact analysis for forex, futures and crypto traders. Gold, Oil, BTC, EUR, S&P 500 and more."
        url="/markets"
      />
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 md:py-10">

        {/* Page header */}
        <div className="mb-6 pb-5 border-b border-g200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-ink tracking-[-0.02em]">
                Markets
              </h1>
              <span className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-emerald-600 font-bold border border-emerald-200 bg-emerald-50 px-1.5 py-0.5">
                Live
              </span>
            </div>
            <p className="text-[0.78rem] sm:text-sm font-sans text-g500">
              Live prices · asset impact analysis · forex, futures &amp; crypto
            </p>
          </div>
          <button
            onClick={() => { setPage(1); loadNews(1); loadPrices() }}
            className="self-start sm:self-auto text-[0.62rem] font-mono text-g400 hover:text-emerald-600 transition-colors flex items-center gap-1.5 border border-g200 px-3 py-1.5 hover:border-emerald-300"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Asset Watchlist — always shows all assets with live price */}
        {(loading && pricesLoading) ? (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[130px] h-[90px] bg-g100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <AssetWatchlist
            posts={posts}
            prices={prices}
            lastUpdated={lastUpdated}
            pricesUpdated={pricesUpdated}
          />
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-g200 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.desc}
              className={`text-[0.68rem] sm:text-[0.72rem] font-mono uppercase tracking-[0.1em] sm:tracking-[0.12em] px-3 sm:px-5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-700 font-medium'
                  : 'border-transparent text-g500 hover:text-ink hover:bg-g50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          {/* Strength legend */}
          <div className="hidden lg:flex items-center gap-3 text-[0.55rem] font-mono text-g400 px-2 shrink-0 pb-0.5">
            <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">▲</span> Bullish</span>
            <span className="flex items-center gap-1"><span className="text-red-500 font-bold">▼</span> Bearish</span>
            <span className="flex items-center gap-1"><span className="opacity-60">●●</span> Strong</span>
            <span className="flex items-center gap-1"><span className="opacity-60">●○</span> Moderate</span>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 border-b border-g200 py-5">
                <div className="w-[88px] h-[58px] sm:w-[120px] sm:h-[78px] bg-g100 shrink-0 rounded-sm" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1">
                    <div className="h-4 bg-g100 w-12 rounded-sm" /><div className="h-4 bg-g100 w-10 rounded-sm" />
                  </div>
                  <div className="h-4 bg-g100 w-full rounded-sm" />
                  <div className="h-3 bg-g100 w-3/4 rounded-sm" />
                  <div className="h-3 bg-g100 w-1/4 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[1.4rem] font-serif text-g400 mb-2">No results</p>
            <p className="text-sm font-mono text-g400">
              {tab === 'all'
                ? 'No market-moving news detected yet. Check back in a few minutes.'
                : `No ${TABS.find(t => t.id === tab)?.label} stories in the current batch.`}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-[0.62rem] font-mono text-g400">
              {filtered.length} {filtered.length === 1 ? 'story' : 'stories'} with market impact
            </div>
            {filtered.map(post => (
              <MarketArticleRow key={post.id} post={post} />
            ))}
            {tab === 'all' && hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-2.5 border border-g200 text-[0.75rem] font-mono uppercase tracking-[0.1em] text-g500 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
