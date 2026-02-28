/**
 * Market.jsx — Dedicated Markets page for forex & futures traders.
 *
 * - Fetches business / finance / breaking-news articles
 * - Detects which assets (GOLD, OIL, USD, EUR, etc.) each story mentions
 * - Scores sentiment (bullish 🟢 / bearish 🔴 / neutral ⚪) from title + excerpt
 * - Tabs: All · Forex · Futures & Commodities
 * - Markets nav button is highlighted with a green accent colour
 */

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'
import { getMarketPosts } from '@/lib/queries'
import { timeAgo, readingTime, placeholderImage, flagEmoji } from '@/lib/utils'

// ─── Asset detection ──────────────────────────────────────────────────────────

const ASSETS = [
  // Forex majors
  { symbol: 'USD',    label: 'US Dollar',   tab: 'forex',   keywords: ['dollar','usd','federal reserve','fed ','fomc','powell','interest rate','treasury'] },
  { symbol: 'EUR',    label: 'Euro',         tab: 'forex',   keywords: ['euro','eur','ecb','european central bank','lagarde','eurozone'] },
  { symbol: 'GBP',    label: 'Pound',        tab: 'forex',   keywords: ['pound','sterling','gbp','bank of england','boe'] },
  { symbol: 'JPY',    label: 'Yen',          tab: 'forex',   keywords: ['yen','jpy','bank of japan','boj','nikkei'] },
  { symbol: 'CHF',    label: 'Swiss Franc',  tab: 'forex',   keywords: ['franc','chf','swiss national bank','snb'] },
  { symbol: 'CNY',    label: 'Yuan',         tab: 'forex',   keywords: ['yuan','renminbi','cny','pboc','peoples bank of china'] },
  // Commodities / Futures
  { symbol: 'GOLD',   label: 'Gold',         tab: 'futures', keywords: ['gold','bullion','xau','safe haven metal'] },
  { symbol: 'OIL',    label: 'Crude Oil',    tab: 'futures', keywords: ['oil','crude','brent','wti','petroleum','opec','barrel'] },
  { symbol: 'SILVER', label: 'Silver',       tab: 'futures', keywords: ['silver','xag'] },
  { symbol: 'NAT GAS',label: 'Natural Gas',  tab: 'futures', keywords: ['natural gas','lng','gas price','gas supply'] },
  { symbol: 'COPPER', label: 'Copper',       tab: 'futures', keywords: ['copper'] },
  { symbol: 'S&P 500',label: 'S&P 500',      tab: 'futures', keywords: ['s&p','sp500','wall street','stocks','equities','nasdaq','dow jones','stock market'] },
  { symbol: 'WHEAT',  label: 'Wheat',        tab: 'futures', keywords: ['wheat','grain','food price'] },
]

const BULLISH = /\b(surge|surged|soar|soared|rally|rallied|gain|gains|rise|rose|climb|climbed|jump|jumped|advance|advances|boost|boosted|record high|strengthen|stabilise|recover|rebounds|upswing|bullish|positive|eases|easing|cut rates|rate cut|stimulus|growth)\b/i
const BEARISH = /\b(fall|fell|drop|drops|plunge|plunged|crash|crashes|decline|declined|tumble|tumbled|slide|slides|sink|sank|weak|weakens|threat|crisis|war|attack|sanction|recession|fear|sell.?off|bearish|pressure|risk|concern|warns|warning|halt|ban|tariff|inflation|stagflation)\b/i

function detectAssets(title, excerpt) {
  const text = `${title} ${excerpt || ''}`.toLowerCase()
  const found = []
  for (const asset of ASSETS) {
    if (asset.keywords.some(kw => text.includes(kw))) {
      // Determine sentiment from title (most reliable signal)
      const titleL = title.toLowerCase()
      let dir = 'neutral'
      if (BULLISH.test(titleL)) dir = 'bullish'
      else if (BEARISH.test(titleL)) dir = 'bearish'
      found.push({ ...asset, dir })
    }
  }
  return found
}

// ─── Asset badge ─────────────────────────────────────────────────────────────

function AssetBadge({ symbol, dir }) {
  const colors = {
    bullish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bearish: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-g100 text-g500 border-g200',
  }
  const arrow = { bullish: '▲', bearish: '▼', neutral: '—' }
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.58rem] font-mono px-1.5 py-0.5 border ${colors[dir]}`}>
      <span className={dir === 'bullish' ? 'text-emerald-600' : dir === 'bearish' ? 'text-red-500' : 'text-g400'}>
        {arrow[dir]}
      </span>
      {symbol}
    </span>
  )
}

// ─── Asset summary bar (top of page) ────────────────────────────────────────

function AssetSummaryBar({ posts }) {
  // Aggregate all detected assets across the latest 30 posts
  const tally = {}
  for (const post of posts.slice(0, 30)) {
    const detected = detectAssets(post.title, post.excerpt)
    for (const a of detected) {
      if (!tally[a.symbol]) tally[a.symbol] = { symbol: a.symbol, label: a.label, bullish: 0, bearish: 0, neutral: 0 }
      tally[a.symbol][a.dir]++
    }
  }
  const sorted = Object.values(tally)
    .filter(a => a.bullish + a.bearish + a.neutral >= 1)
    .sort((a, b) => (b.bullish + b.bearish + b.neutral) - (a.bullish + a.bearish + a.neutral))
    .slice(0, 10)

  if (sorted.length === 0) return null

  return (
    <div className="bg-paper border border-g200 px-5 py-3 mb-6 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        <span className="text-[0.6rem] font-mono uppercase tracking-[0.12em] text-g400 mr-2 shrink-0">
          In Focus
        </span>
        {sorted.map(a => {
          const total = a.bullish + a.bearish + a.neutral
          const sentiment = a.bullish > a.bearish ? 'bullish' : a.bearish > a.bullish ? 'bearish' : 'neutral'
          return (
            <div key={a.symbol} className="flex items-center gap-1">
              <AssetBadge symbol={a.symbol} dir={sentiment} />
              <span className="text-[0.58rem] font-mono text-g400">{total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Market article row ───────────────────────────────────────────────────────

function MarketArticleRow({ post }) {
  const assets = detectAssets(post.title, post.excerpt)

  return (
    <div className="border-b border-g200 py-5 hover:bg-g50 transition-colors -mx-4 px-4 md:-mx-0 md:px-0">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <Link to={`/post/${post.slug}`} className="shrink-0 hidden sm:block">
          <div className="w-[90px] h-[60px] bg-g100 overflow-hidden">
            <img
              src={post.cover_image || placeholderImage(post.category)}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Asset badges */}
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {assets.slice(0, 5).map(a => (
                <AssetBadge key={a.symbol} symbol={a.symbol} dir={a.dir} />
              ))}
            </div>
          )}

          <Link to={`/post/${post.slug}`}>
            <h3 className="font-serif font-bold text-ink text-[0.95rem] leading-[1.3] line-clamp-2 hover:opacity-70 transition-opacity">
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="mt-1 text-[0.78rem] font-sans text-g500 line-clamp-1 leading-[1.5]">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] font-mono text-g400 flex-wrap">
            <span>{post.source_name || 'YUP'}</span>
            <span>·</span>
            <span>{timeAgo(post.published_at)}</span>
            <span>·</span>
            <span>{readingTime(post.content || post.excerpt)}</span>
            {post.country_code && (
              <>
                <span>·</span>
                <span>{flagEmoji(post.country_code)} {post.country}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Market page ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',    label: 'All Markets' },
  { id: 'forex',  label: 'Forex' },
  { id: 'futures',label: 'Futures & Commodities' },
]

export default function Market() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(false)
  const [tab, setTab]           = useState('all')

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    const res = await getMarketPosts({ page: p })
    setPosts(prev => append ? [...prev, ...(res.data || [])] : (res.data || []))
    setHasMore(p < (res.totalPages || 1))
    setLoading(false)
  }, [])

  useEffect(() => {
    setPosts([])
    setPage(1)
    load(1)
  }, [load])

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next, true)
  }

  // Client-side tab filter
  const filtered = posts.filter(post => {
    if (tab === 'all') return true
    const assets = detectAssets(post.title, post.excerpt)
    return assets.some(a => a.tab === tab)
  })

  return (
    <>
      <SEO
        title="Markets — News that moves prices"
        description="Breaking market news with asset impact analysis for forex and futures traders. Track moves in gold, oil, USD, EUR, S&P 500 and more."
        url="/markets"
      />
      <Header />

      <div className="max-w-[1100px] mx-auto px-4 md:px-12 py-8 md:py-12">

        {/* Page header */}
        <div className="mb-6 pb-5 border-b border-g200">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif font-bold text-3xl md:text-4xl text-ink tracking-[-0.02em]">
              Markets
            </h1>
            <span className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-emerald-600 font-medium">
              Live Feed
            </span>
          </div>
          <p className="mt-1 text-sm font-sans text-g500">
            News that moves prices — asset impact highlighted for forex & futures traders
          </p>
        </div>

        {/* Asset summary bar */}
        {posts.length > 0 && <AssetSummaryBar posts={posts} />}

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-g200 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[0.7rem] font-mono uppercase tracking-[0.12em] px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-g500 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          {/* Sentiment legend */}
          <div className="hidden md:flex items-center gap-3 text-[0.58rem] font-mono text-g400 pr-1 shrink-0">
            <span className="text-emerald-600 font-medium">▲ Bullish</span>
            <span className="text-red-500 font-medium">▼ Bearish</span>
            <span>— Neutral</span>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 border-b border-g200 pb-5">
                <div className="hidden sm:block w-[90px] h-[60px] bg-g100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1">
                    <div className="h-4 bg-g100 w-12" />
                    <div className="h-4 bg-g100 w-10" />
                  </div>
                  <div className="h-4 bg-g100 w-full" />
                  <div className="h-3 bg-g100 w-3/4" />
                  <div className="h-3 bg-g100 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-mono text-g500">
              {tab === 'all'
                ? 'No market news available. Check back shortly.'
                : `No ${TABS.find(t => t.id === tab)?.label} news detected yet. Try "All Markets".`}
            </p>
          </div>
        ) : (
          <>
            <div>
              {filtered.map(post => (
                <MarketArticleRow key={post.id} post={post} />
              ))}
            </div>

            {/* Load more — only for "All" tab (tab filtering is client-side) */}
            {tab === 'all' && hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-2.5 border border-g200 text-[0.75rem] font-mono uppercase tracking-[0.1em] text-g500 hover:border-ink hover:text-ink transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  )
}
