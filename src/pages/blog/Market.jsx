/**
 * Market.jsx — Professional markets page for forex & futures traders.
 *
 * Features:
 * - Permanent asset watchlist (GOLD, OIL, SILVER, NAT GAS, EUR, USD, GBP, JPY, S&P 500, COPPER)
 *   showing bullish / bearish / neutral based on recent news, auto-refreshes every 5 min
 * - Only business + finance + breaking-news (no politics bleed-through)
 * - Articles must match at least one asset to appear in non-"All" tabs
 * - Tabs: All · Forex · Futures & Commodities
 * - Responsive at all breakpoints
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'
import { getMarketPosts } from '@/lib/queries'
import { timeAgo, readingTime, placeholderImage, flagEmoji } from '@/lib/utils'

// ─── Asset definitions ─────────────────────────────────────────────────────────

const ASSETS = [
  // Commodities — shown first in the watchlist
  { symbol: 'GOLD',    label: 'Gold',         tab: 'futures', icon: '🥇',
    keywords: ['gold','bullion','xau','spot gold','gold price','gold futures','precious metal','gold market','yellow metal'] },
  { symbol: 'SILVER',  label: 'Silver',       tab: 'futures', icon: '🥈',
    keywords: ['silver','xag','spot silver','silver price'] },
  { symbol: 'OIL',     label: 'Crude Oil',    tab: 'futures', icon: '🛢️',
    keywords: ['oil','crude','brent','wti','petroleum','opec','barrel price','oil price','energy price','oil market'] },
  { symbol: 'NAT GAS', label: 'Natural Gas',  tab: 'futures', icon: '🔥',
    keywords: ['natural gas','nat gas','lng','gas price','gas supply','gas market'] },
  { symbol: 'COPPER',  label: 'Copper',       tab: 'futures', icon: '🟤',
    keywords: ['copper','copper price','base metal'] },
  { symbol: 'S&P 500', label: 'S&P 500',      tab: 'futures', icon: '📈',
    keywords: ["s&p 500","s&p500","sp 500","wall street","stock market","equities","nasdaq","dow jones","us stocks","s&p index"] },
  { symbol: 'WHEAT',   label: 'Wheat',        tab: 'futures', icon: '🌾',
    keywords: ['wheat','grain price','food inflation','cereal price'] },
  // Forex majors
  { symbol: 'USD',     label: 'US Dollar',    tab: 'forex',   icon: '💵',
    keywords: ['dollar index','us dollar','usd strengthens','usd weakens','federal reserve','fed rate','fomc','powell','treasury yield','dollar rises','dollar falls'] },
  { symbol: 'EUR',     label: 'Euro',         tab: 'forex',   icon: '💶',
    keywords: ['euro zone','eurozone gdp','ecb rate','european central bank','euro strengthens','euro falls','eur/usd','eurusd','lagarde'] },
  { symbol: 'GBP',     label: 'Pound',        tab: 'forex',   icon: '💷',
    keywords: ['sterling','pound strengthens','pound falls','bank of england rate','gbp/usd','gbpusd','uk inflation','uk gdp'] },
  { symbol: 'JPY',     label: 'Yen',          tab: 'forex',   icon: '💴',
    keywords: ['japanese yen','yen weakens','yen strengthens','bank of japan','boj rate','usd/jpy','usdjpy','yen intervention'] },
  { symbol: 'CHF',     label: 'Swiss Franc',  tab: 'forex',   icon: '🇨🇭',
    keywords: ['swiss franc','chf','swiss national bank','snb rate'] },
  { symbol: 'CNY',     label: 'Yuan',         tab: 'forex',   icon: '🇨🇳',
    keywords: ['chinese yuan','renminbi','yuan rate','pboc','peoples bank of china','cny'] },
]

// Broader multi-word patterns to match in either title or excerpt
const BULLISH_RE = /\b(surge|surges|surged|soar|soars|soared|rally|rallies|rallied|gain|gains|gained|rise|rises|rose|climb|climbs|climbed|jump|jumps|jumped|advance|advances|boost|boosted|record high|all.time high|strengthen|strengthens|stabilise|recover|recovers|rebounds|rebound|upswing|bullish|rate cut|rate cuts|stimulus|eases|easing|growth beat|strong gdp|strong data)\b/i
const BEARISH_RE = /\b(fall|falls|fell|drop|drops|dropped|plunge|plunges|plunged|crash|crashes|crashed|decline|declines|declined|tumble|tumbles|tumbled|slide|slides|slid|sink|sinks|sank|weak|weakens|weakened|threat|crisis|war|attack|strike|sanction|sanctions|recession|fear|fears|sell.?off|bearish|pressure|risk|concern|warns|warning|halt|ban|tariff|tariffs|inflation surge|rate hike|rate hikes|stagflation|supply shock)\b/i

function detectAssets(title, excerpt) {
  const text = `${title} ${excerpt || ''}`.toLowerCase()
  const found = []
  for (const asset of ASSETS) {
    if (asset.keywords.some(kw => text.includes(kw))) {
      const combined = `${title} ${excerpt || ''}`.toLowerCase()
      let dir = 'neutral'
      if (BULLISH_RE.test(combined)) dir = 'bullish'
      else if (BEARISH_RE.test(combined)) dir = 'bearish'
      found.push({ ...asset, dir })
    }
  }
  return found
}

// ─── Asset watchlist card ──────────────────────────────────────────────────────

function WatchlistCard({ asset }) {
  const { symbol, label, icon, bullish = 0, bearish = 0, neutral = 0 } = asset
  const total = bullish + bearish + neutral
  const net = total === 0 ? 'no-data' : bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral'

  const styles = {
    bullish:  { card: 'border-emerald-200 bg-emerald-50',  text: 'text-emerald-700', badge: 'bg-emerald-500 text-white', arrow: '▲', label: 'Bullish' },
    bearish:  { card: 'border-red-200 bg-red-50',          text: 'text-red-700',     badge: 'bg-red-500 text-white',     arrow: '▼', label: 'Bearish' },
    neutral:  { card: 'border-amber-200 bg-amber-50',      text: 'text-amber-700',   badge: 'bg-amber-500 text-white',   arrow: '—', label: 'Neutral' },
    'no-data':{ card: 'border-g200 bg-g50',                text: 'text-g400',        badge: 'bg-g300 text-white',        arrow: '·', label: 'No data' },
  }
  const s = styles[net]

  return (
    <div className={`flex-shrink-0 w-[110px] sm:w-[120px] border rounded-sm p-2.5 ${s.card}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-base leading-none">{icon}</span>
        <span className={`text-[0.52rem] font-mono font-bold px-1 py-0.5 rounded-sm ${s.badge}`}>
          {s.arrow} {s.label.toUpperCase()}
        </span>
      </div>
      <div className={`text-[0.8rem] font-mono font-bold ${s.text}`}>{symbol}</div>
      <div className="text-[0.6rem] font-sans text-g500 leading-tight">{label}</div>
      {total > 0 && (
        <div className="mt-1.5 text-[0.55rem] font-mono text-g400">
          {bullish}↑ {bearish}↓ {neutral}—
        </div>
      )}
    </div>
  )
}

// ─── Asset watchlist bar ───────────────────────────────────────────────────────

function AssetWatchlist({ posts, lastUpdated }) {
  // Aggregate sentiment for every asset across all fetched posts
  const tally = {}
  for (const asset of ASSETS) {
    tally[asset.symbol] = { ...asset, bullish: 0, bearish: 0, neutral: 0 }
  }
  for (const post of posts) {
    const detected = detectAssets(post.title, post.excerpt)
    for (const a of detected) {
      if (tally[a.symbol]) tally[a.symbol][a.dir]++
    }
  }
  const ordered = ASSETS.map(a => tally[a.symbol])

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-g500">
          Asset Sentiment — based on latest news
        </span>
        {lastUpdated && (
          <span className="text-[0.55rem] font-mono text-g400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
      </div>
      {/* Horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {ordered.map(a => <WatchlistCard key={a.symbol} asset={a} />)}
      </div>
    </div>
  )
}

// ─── Inline asset badge ────────────────────────────────────────────────────────

function AssetBadge({ symbol, dir }) {
  const c = {
    bullish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bearish: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-g100 text-g500 border-g200',
  }
  const arrow = { bullish: '▲', bearish: '▼', neutral: '—' }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.6rem] font-mono font-medium px-1.5 py-0.5 border rounded-sm ${c[dir]}`}>
      <span>{arrow[dir]}</span>{symbol}
    </span>
  )
}

// ─── Market article row ────────────────────────────────────────────────────────

function MarketArticleRow({ post }) {
  const assets = detectAssets(post.title, post.excerpt)

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
          {/* Asset badges */}
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {assets.slice(0, 6).map(a => (
                <AssetBadge key={a.symbol} symbol={a.symbol} dir={a.dir} />
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

          {/* Meta */}
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
  { id: 'all',     label: 'All Markets',          desc: 'All market-moving news' },
  { id: 'forex',   label: 'Forex',                desc: 'Currency pairs & central banks' },
  { id: 'futures', label: 'Futures & Commodities', desc: 'Gold, Oil, Silver, Nat Gas & more' },
]

// ─── Main page ─────────────────────────────────────────────────────────────────

const REFRESH_MS = 5 * 60 * 1000  // auto-refresh every 5 minutes

export default function Market() {
  const [posts, setPosts]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(false)
  const [tab, setTab]                 = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    const res = await getMarketPosts({ page: p, pageSize: 20 })
    setPosts(prev => append ? [...prev, ...(res.data || [])] : (res.data || []))
    setHasMore(p < (res.totalPages || 1))
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  // Initial load + auto-refresh
  useEffect(() => {
    setPosts([])
    setPage(1)
    load(1)
    timerRef.current = setInterval(() => {
      setPosts([])
      setPage(1)
      load(1)
    }, REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [load])

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next, true)
  }

  // Tab filter: require at least one detected asset for non-"all" tabs
  const filtered = posts.filter(post => {
    const assets = detectAssets(post.title, post.excerpt)
    if (tab === 'all') {
      // In "All" view, only show articles that mention at least one asset
      return assets.length > 0
    }
    return assets.some(a => a.tab === tab)
  })

  return (
    <>
      <SEO
        title="Markets — News that moves prices"
        description="Real-time market news with asset impact analysis for forex and futures traders. Track gold, oil, silver, USD, EUR, S&P 500 and more."
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
              News that moves prices — asset impact for forex &amp; futures traders
            </p>
          </div>
          {/* Refresh indicator */}
          <button
            onClick={() => { setPage(1); load(1) }}
            className="self-start sm:self-auto text-[0.62rem] font-mono text-g400 hover:text-emerald-600 transition-colors flex items-center gap-1.5 border border-g200 px-3 py-1.5 hover:border-emerald-300"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Asset Watchlist */}
        {loading ? (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[110px] h-[72px] bg-g100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : (
          <AssetWatchlist posts={posts} lastUpdated={lastUpdated} />
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
          {/* Legend — desktop only */}
          <div className="hidden lg:flex items-center gap-3 text-[0.58rem] font-mono text-g400 px-2 shrink-0 pb-0.5">
            <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">▲</span> Bullish</span>
            <span className="flex items-center gap-1"><span className="text-red-500 font-bold">▼</span> Bearish</span>
            <span className="flex items-center gap-1"><span className="text-g400">—</span> Neutral</span>
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
                    <div className="h-4 bg-g100 w-12 rounded-sm" />
                    <div className="h-4 bg-g100 w-10 rounded-sm" />
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
                : `No ${TABS.find(t => t.id === tab)?.label} stories in the current batch. Try "All Markets".`}
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
