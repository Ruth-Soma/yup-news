/**
 * Market.jsx — Professional markets terminal for forex, futures & crypto traders.
 *
 * Features:
 * - Live market session indicator (Sydney / Tokyo / London / New York)
 * - Risk-on / Risk-off market pulse banner
 * - Live prices with intraday high/low range bar (refreshes every 60s)
 * - Economic calendar — next 14 days of high-impact events
 * - Asset watchlist with news sentiment signal (bullish / bearish tally)
 * - Articles: ALL posts in "All Markets" tab; keyword-filtered for specific tabs
 * - Default 10+ articles shown without needing to click Load More
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

const ASSETS = [
  { key: 'GOLD',   label: 'Gold',        tab: 'futures', icon: '🥇',
    keywords: ['gold','bullion','xau','spot gold','gold price','gold futures','precious metal',
               'gold reserve','gold demand','central bank gold','gold rally','gold slump',
               'yellow metal','gold output','gold mine','gold production'] },
  { key: 'SILVER', label: 'Silver',      tab: 'futures', icon: '🥈',
    keywords: ['silver','xag','spot silver','silver price','silver futures','silver demand',
               'industrial silver','silver mine','silver output'] },
  { key: 'OIL',    label: 'Crude Oil',   tab: 'futures', icon: '🛢️',
    keywords: ['crude oil','brent','wti','petroleum','opec','barrel','oil price','energy price',
               'oil market','oil supply','oil output','oil demand','oil inventory',
               'oil production cut','opec+','oil embargo','refinery','oil sanctions',
               'oil glut','oil shortage','energy crisis','oil export'] },
  { key: 'NATGAS', label: 'Natural Gas', tab: 'futures', icon: '🔥',
    keywords: ['natural gas','nat gas','lng','gas price','gas supply','gas market',
               'gas pipeline','gas shortage','gas storage','gas demand',
               'liquefied natural gas','gas export','gas import','gas crisis'] },
  { key: 'COPPER', label: 'Copper',      tab: 'futures', icon: '🪙',
    keywords: ['copper','copper price','base metal','copper demand','copper supply',
               'copper mine','copper futures','copper output','copper deficit',
               'industrial metal','copper import','copper export','dr congo copper',
               'chile copper','zambia copper'] },
  { key: 'SP500',  label: 'S&P 500',     tab: 'futures', icon: '📈',
    keywords: ["s&p 500","s&p500","sp500","wall street","stock market","equities",
               "nasdaq","dow jones","us stocks","us equities","us index",
               "stock sell-off","stock rally","equity market","fed rate decision",
               "earnings season","corporate earnings","market correction","market crash",
               "risk appetite","investor sentiment","us economy"] },
  { key: 'WHEAT',  label: 'Wheat',       tab: 'futures', icon: '🌾',
    keywords: ['wheat','grain price','food inflation','cereal','grain market',
               'wheat supply','wheat demand','wheat export','black sea grain',
               'ukraine grain','russia grain','food security','food crisis',
               'crop yield','harvest','drought crop','wheat futures'] },
  { key: 'EUR',    label: 'EUR/USD',     tab: 'forex',   icon: '💶',
    keywords: ['euro','eurozone','ecb','european central bank','lagarde',
               'eur/usd','eurusd','euro strengthens','euro weakens','euro falls',
               'eurozone gdp','eurozone inflation','eurozone economy','eu economy',
               'ecb rate','ecb hike','ecb cut','german economy','eu recession',
               'europe economy','european inflation','eu gdp','ecb meeting'] },
  { key: 'GBP',   label: 'GBP/USD',     tab: 'forex',   icon: '💷',
    keywords: ['sterling','pound','gbp','bank of england','boe rate',
               'gbp/usd','gbpusd','pound strengthens','pound weakens','pound falls',
               'uk inflation','uk gdp','uk economy','uk recession','bailey boe',
               'uk budget','uk interest rate','uk rate hike','uk rate cut',
               'britain economy','british pound','andrew bailey','uk growth'] },
  { key: 'JPY',   label: 'USD/JPY',     tab: 'forex',   icon: '💴',
    keywords: ['yen','jpy','bank of japan','boj','usdjpy','usd/jpy',
               'yen weakens','yen strengthens','yen intervention','japan rate',
               'boj policy','japan inflation','japan gdp','ueda boj',
               'yen carry trade','japan economy','tokyo stocks','nikkei',
               'japan trade','japan interest rate','boj decision'] },
  { key: 'CHF',   label: 'USD/CHF',     tab: 'forex',   icon: '🇨🇭',
    keywords: ['swiss franc','chf','snb','swiss national bank','jordan snb',
               'switzerland inflation','safe haven currency','chf strengthens',
               'switzerland gdp','snb rate','swiss economy','swiss interest rate',
               'geneva','zurich market','swiss bank'] },
  { key: 'CNY',   label: 'USD/CNY',     tab: 'forex',   icon: '🇨🇳',
    keywords: ['yuan','renminbi','cny','pboc','peoples bank of china',
               'china currency','yuan devaluation','yuan weakens','yuan strengthens',
               'china rate','pboc rate cut','china economy','china gdp',
               'china trade','china exports','offshore yuan','china growth',
               'beijing economy','china stimulus','china monetary policy'] },
  { key: 'BTC',   label: 'Bitcoin',     tab: 'crypto',  icon: '₿',
    keywords: ['bitcoin','btc','crypto','cryptocurrency','digital asset',
               'bitcoin price','btc rally','btc crash','bitcoin etf','spot btc etf',
               'bitcoin halving','satoshi','lightning network','bitcoin mining',
               'bitcoin adoption','institutional bitcoin','btc futures',
               'blackrock bitcoin','bitcoin regulation','crypto market',
               'crypto crackdown','crypto rally','crypto sell-off'] },
  { key: 'ETH',   label: 'Ethereum',    tab: 'crypto',  icon: '⟠',
    keywords: ['ethereum','eth','ether','defi','nft market','smart contract',
               'ethereum price','eth rally','ethereum network','layer 2',
               'ethereum staking','proof of stake','ethereum etf','vitalik',
               'crypto token','altcoin','ethereum upgrade'] },
]

// ─── Sentiment engine ──────────────────────────────────────────────────────────

const BULLISH_SIGNALS = [
  { re: /\b(surge|surged|surges|soar|soared|soars|rocket|rocketed|skyrocket|spike|spiked)\b/i,       w: 3 },
  { re: /\b(record high|all.time high|multi.year high|52.week high|historic high)\b/i,                 w: 3 },
  { re: /\b(short squeeze|massive rally|strong rally|explosive rally)\b/i,                             w: 3 },
  { re: /\b(rally|rallies|rallied|climb|climbed|climbs|advance|advances|advanced)\b/i,                 w: 2 },
  { re: /\b(rise|rises|rose|gain|gains|gained|rebound|rebounds|rebounded|bounce|bounced)\b/i,          w: 2 },
  { re: /\b(strengthen|strengthened|strengthens|appreciate|appreciated|recovery)\b/i,                  w: 2 },
  { re: /\b(rate cut|rate cuts|easing|monetary easing|quantitative easing|qe|stimulus)\b/i,            w: 2 },
  { re: /\b(strong gdp|gdp beat|growth beat|better.than.expected|beats forecast|beat estimates)\b/i,   w: 2 },
  { re: /\b(supply cut|production cut|opec cut|output cut|quota cut)\b/i,                              w: 2 },
  { re: /\b(safe haven|flight to safety|risk.off buying|demand surge)\b/i,                             w: 2 },
  { re: /\b(etf inflow|institutional buying|central bank buying|reserve accumulation)\b/i,             w: 2 },
  { re: /\b(halving|adoption surge|mainstream adoption|regulatory approval|spot etf approved)\b/i,    w: 2 },
  { re: /\b(jump|jumped|jumps|boost|boosted|lift|lifts|lifted|tick up|edge up|inch up)\b/i,            w: 1 },
  { re: /\b(stabilise|stabilize|stabilised|floor|bottomed|support level)\b/i,                          w: 1 },
  { re: /\b(positive outlook|bullish|upside|upbeat|optimistic)\b/i,                                    w: 1 },
  { re: /\b(lower inflation|inflation cools|inflation falls|disinflation)\b/i,                         w: 1 },
]

const BEARISH_SIGNALS = [
  { re: /\b(crash|crashed|crashes|collapse|collapsed|collapses|plunge|plunged|plunges)\b/i,            w: 3 },
  { re: /\b(record low|all.time low|multi.year low|52.week low|historic low)\b/i,                      w: 3 },
  { re: /\b(bank run|financial crisis|liquidity crisis|default|sovereign default)\b/i,                 w: 3 },
  { re: /\b(war|invasion|invaded|airstrike|nuclear|chemical attack|weapon of mass)\b/i,                w: 3 },
  { re: /\b(fall|falls|fell|drop|drops|dropped|decline|declines|declined|tumble|tumbled)\b/i,          w: 2 },
  { re: /\b(slide|slides|slid|sink|sinks|sank|slump|slumped|slumps|plummet|plummeted)\b/i,            w: 2 },
  { re: /\b(rate hike|rate hikes|tightening|hawkish|aggressive hike|supersized hike)\b/i,              w: 2 },
  { re: /\b(recession|stagflation|contraction|gdp miss|gdp shrinks|negative growth)\b/i,               w: 2 },
  { re: /\b(tariff|tariffs|sanction|sanctions|embargo|trade war|trade ban|export ban)\b/i,             w: 2 },
  { re: /\b(supply glut|oversupply|inventory build|demand slump|demand collapse)\b/i,                  w: 2 },
  { re: /\b(sell.?off|liquidation|margin call|forced selling|etf outflow|capital flight)\b/i,          w: 2 },
  { re: /\b(exchange hack|exchange collapse|fraud|rug pull|scam|ban crypto|crypto ban)\b/i,            w: 2 },
  { re: /\b(weak|weakens|weakened|soften|softens|ease lower|retreat|retreats|retreated)\b/i,           w: 1 },
  { re: /\b(concern|concerns|fear|fears|risk|uncertainty|warn|warning|caution)\b/i,                    w: 1 },
  { re: /\b(hawkish|tighten|tightening|higher for longer|elevated rates)\b/i,                          w: 1 },
  { re: /\b(bearish|downside|downbeat|pessimistic|negative outlook)\b/i,                               w: 1 },
  { re: /\b(inflation surge|inflation spike|inflation accelerates|inflation high)\b/i,                 w: 1 },
]

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
  let bull = 0, bear = 0
  for (const sig of BULLISH_SIGNALS) if (sig.re.test(text)) bull += sig.w
  for (const sig of BEARISH_SIGNALS) if (sig.re.test(text)) bear += sig.w
  return { bull, bear }
}

function detectAssets(title, excerpt) {
  const text = `${title} ${excerpt || ''}`.toLowerCase()
  const full  = `${title} ${excerpt || ''}`
  const found = []
  for (const asset of ASSETS) {
    if (!asset.keywords.some(kw => text.includes(kw))) continue
    let { bull, bear } = scoreSentiment(full)
    const ctx = ASSET_CONTEXT[asset.key]
    if (ctx) {
      for (const re of (ctx.bullish_extra || [])) if (re.test(full)) bull += 2
      for (const re of (ctx.bearish_extra || [])) if (re.test(full)) bear += 2
    }
    const dir = bull > bear ? 'bullish' : bear > bull ? 'bearish' : 'neutral'
    found.push({ ...asset, dir, bull, bear, confidence: Math.abs(bull - bear) })
  }
  return found
}

// ─── Market sessions ───────────────────────────────────────────────────────────

const SESSIONS = [
  { name: 'Sydney',   openUTC: 22, closeUTC: 7,  flag: '🇦🇺', color: 'violet', note: 'AUD/NZD active' },
  { name: 'Tokyo',    openUTC: 0,  closeUTC: 9,  flag: '🇯🇵', color: 'red',    note: 'JPY/AUD active' },
  { name: 'London',   openUTC: 7,  closeUTC: 16, flag: '🇬🇧', color: 'blue',   note: 'EUR/GBP/CHF active' },
  { name: 'New York', openUTC: 13, closeUTC: 22, flag: '🇺🇸', color: 'green',  note: 'USD/CAD active' },
]

function isSessionActive(s, utcH) {
  if (s.openUTC < s.closeUTC) return utcH >= s.openUTC && utcH < s.closeUTC
  return utcH >= s.openUTC || utcH < s.closeUTC  // wraps midnight
}

function minsUntil(targetH, nowH, nowM) {
  let diff = (targetH - nowH) * 60 - nowM
  if (diff < 0) diff += 24 * 60
  return diff
}

function SessionBar() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const h = now.getUTCHours()
  const m = now.getUTCMinutes()
  const londonNY = h >= 13 && h < 16   // peak liquidity overlap

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-sm mb-3 text-[0.6rem] font-mono">
      <span className="text-[#8b949e] uppercase tracking-[0.12em] shrink-0">Sessions</span>
      {SESSIONS.map(s => {
        const active = isSessionActive(s, h)
        const next   = active ? s.closeUTC : s.openUTC
        const mins   = minsUntil(next, h, m)
        const hh     = Math.floor(mins / 60)
        const mm     = mins % 60
        const eta    = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`
        return (
          <div key={s.name} title={s.note}
            className={`flex items-center gap-1.5 ${active ? 'text-emerald-400' : 'text-[#484f58]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-[#30363d]'}`} />
            <span>{s.flag} {s.name}</span>
            <span className={`${active ? 'text-emerald-300 font-semibold' : 'text-[#484f58]'}`}>
              {active ? `OPEN · closes ${eta}` : `CLOSED · opens ${eta}`}
            </span>
          </div>
        )
      })}
      {londonNY && (
        <span className="ml-auto text-amber-400 font-bold tracking-[0.08em] animate-pulse">
          ⚡ PEAK LIQUIDITY — London/NY Overlap
        </span>
      )}
      <span className="text-[#484f58] shrink-0 tabular-nums">
        {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')} UTC
      </span>
    </div>
  )
}

// ─── Market pulse (risk-on / risk-off) ────────────────────────────────────────

function MarketPulse({ prices }) {
  if (!prices || prices.length < 4) return null
  const get = key => prices.find(p => p.key === key)
  const sp  = get('SP500')
  const gld = get('GOLD')
  const btc = get('BTC')
  const oil = get('OIL')

  const up   = prices.filter(p => p.changePercent != null && p.changePercent > 0).length
  const down = prices.filter(p => p.changePercent != null && p.changePercent < 0).length
  const total = up + down

  // Classic risk-on: equities up + gold down; risk-off: gold up + equities down
  let mood = 'mixed'
  if (sp?.changePercent > 0.4 && gld?.changePercent < -0.2)   mood = 'risk-on'
  else if (gld?.changePercent > 0.4 && sp?.changePercent < -0.2) mood = 'risk-off'
  else if (sp?.changePercent > 0.2 && oil?.changePercent > 0.2)  mood = 'risk-on'
  else if (gld?.changePercent > 0.3 && btc?.changePercent < -1)  mood = 'risk-off'

  const cfg = {
    'risk-on':  { bg: 'bg-emerald-950/60 border-emerald-800', badge: 'bg-emerald-500 text-white', icon: '📈', label: 'RISK-ON'  },
    'risk-off': { bg: 'bg-red-950/60 border-red-800',          badge: 'bg-red-500 text-white',     icon: '🛡️', label: 'RISK-OFF' },
    mixed:      { bg: 'bg-amber-950/40 border-amber-800',      badge: 'bg-amber-500 text-white',   icon: '⚖️', label: 'MIXED'   },
  }
  const c = cfg[mood]

  const fmt = (p, key) => {
    if (!p || p.changePercent == null) return null
    const sign = p.changePercent >= 0 ? '+' : ''
    return `${key} ${sign}${p.changePercent.toFixed(2)}%`
  }

  const signals = [fmt(sp, 'S&P'), fmt(gld, 'Gold'), fmt(btc, 'BTC'), fmt(oil, 'Oil')].filter(Boolean)

  return (
    <div className={`flex flex-wrap items-center gap-3 px-3 py-2 border rounded-sm mb-3 text-[0.6rem] font-mono ${c.bg}`}>
      <span className={`text-[0.55rem] font-bold px-2 py-0.5 rounded-sm tracking-[0.14em] ${c.badge}`}>
        {c.icon} {c.label}
      </span>
      <span className="text-[#8b949e]">{up}/{total} assets positive</span>
      {signals.map((s, i) => (
        <span key={i} className={s.includes('+') ? 'text-emerald-400' : s.includes('-') ? 'text-red-400' : 'text-[#8b949e]'}>
          {s}
        </span>
      ))}
    </div>
  )
}

// ─── Economic calendar ────────────────────────────────────────────────────────
// High-impact events scheduled for 2025–2026.

const CALENDAR = [
  // FOMC 2025
  { d: '2025-03-19', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-05-07', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-06-18', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-07-30', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-09-17', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-10-29', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2025-12-10', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  // NFP 2025
  { d: '2025-03-07', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-04-04', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-05-02', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-06-06', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-07-03', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-08-01', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-09-05', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-10-03', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-11-07', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2025-12-05', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  // ECB 2025
  { d: '2025-03-06', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-04-17', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-06-05', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-07-24', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-09-11', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-10-30', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2025-12-18', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  // BOE 2025
  { d: '2025-03-20', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-05-08', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-06-19', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-08-07', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-09-18', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-11-06', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2025-12-18', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  // BOJ 2025
  { d: '2025-03-19', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-05-01', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-06-17', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-07-31', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-09-23', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-10-29', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2025-12-19', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  // US CPI 2025
  { d: '2025-03-12', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-04-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-05-13', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-06-11', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-07-15', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-08-13', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-09-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-10-15', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-11-12', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2025-12-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  // FOMC 2026
  { d: '2026-01-28', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-03-18', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-04-29', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-06-17', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-07-29', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-09-16', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-10-28', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  { d: '2026-12-09', label: 'FOMC Rate Decision',             currencies: ['USD'], impact: 'high' },
  // NFP 2026
  { d: '2026-02-06', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-03-06', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-04-03', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-05-01', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-06-05', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-07-02', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-08-07', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-09-04', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-10-02', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-11-06', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  { d: '2026-12-04', label: 'US Non-Farm Payrolls',           currencies: ['USD'], impact: 'high' },
  // ECB 2026
  { d: '2026-01-22', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-03-05', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-04-16', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-06-04', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-07-23', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-09-10', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-10-29', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  { d: '2026-12-17', label: 'ECB Rate Decision',              currencies: ['EUR'], impact: 'high' },
  // BOE 2026
  { d: '2026-02-05', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-03-19', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-05-07', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-06-18', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-08-06', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-09-17', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-11-05', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  { d: '2026-12-17', label: 'Bank of England Rate Decision',  currencies: ['GBP'], impact: 'high' },
  // BOJ 2026
  { d: '2026-01-24', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-03-19', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-05-01', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-06-18', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-07-30', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-09-17', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-10-29', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  { d: '2026-12-18', label: 'Bank of Japan Rate Decision',    currencies: ['JPY'], impact: 'high' },
  // US CPI 2026
  { d: '2026-02-11', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-03-11', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-04-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-05-13', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-06-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-07-15', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-08-12', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-09-10', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-10-14', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-11-11', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
  { d: '2026-12-09', label: 'US CPI Inflation',               currencies: ['USD'], impact: 'high' },
]

function EconomicCalendar() {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const in14     = new Date(today); in14.setDate(in14.getDate() + 14)
  const in14Str  = in14.toISOString().split('T')[0]

  const upcoming = CALENDAR
    .filter(e => e.d >= todayStr && e.d <= in14Str)
    .sort((a, b) => a.d.localeCompare(b.d))
    .slice(0, 8)

  if (!upcoming.length) return null

  const currencyFlag = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CNY: '🇨🇳', CHF: '🇨🇭' }

  const fmtDate = (str) => {
    const d = new Date(str + 'T12:00:00Z')
    return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const isToday = (str) => str === todayStr
  const isTomorrow = (str) => {
    const t = new Date(today); t.setDate(t.getDate() + 1)
    return str === t.toISOString().split('T')[0]
  }

  return (
    <div className="mb-4 border border-[#21262d] rounded-sm overflow-hidden">
      <div className="px-3 py-2 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between">
        <span className="text-[0.58rem] font-mono uppercase tracking-[0.14em] text-[#8b949e]">
          📅 Economic Calendar — Next 14 Days
        </span>
        <span className="text-[0.52rem] font-mono text-[#484f58]">High-impact events only</span>
      </div>
      <div className="divide-y divide-[#21262d]">
        {upcoming.map((ev, i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2 text-[0.62rem] font-mono
            ${isToday(ev.d) ? 'bg-amber-950/30' : 'bg-[#0d1117]/40'}`}>
            {/* Date */}
            <div className="w-[80px] shrink-0">
              <span className={`${isToday(ev.d) ? 'text-amber-400 font-bold' : isTomorrow(ev.d) ? 'text-sky-400' : 'text-[#8b949e]'}`}>
                {isToday(ev.d) ? 'TODAY' : isTomorrow(ev.d) ? 'TOMORROW' : fmtDate(ev.d)}
              </span>
            </div>
            {/* Currency flags */}
            <div className="flex gap-0.5 shrink-0 w-[36px]">
              {ev.currencies.map(c => (
                <span key={c} title={c}>{currencyFlag[c] || c}</span>
              ))}
            </div>
            {/* Event name */}
            <span className="flex-1 text-[#e6edf3] font-medium">{ev.label}</span>
            {/* Impact badge */}
            <span className="shrink-0 text-[0.5rem] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-red-900/60 text-red-400 border border-red-800/50">
              HIGH
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Price formatting ──────────────────────────────────────────────────────────

function fmtPrice(price, key, decimals) {
  if (price == null) return '--'
  if (key === 'BTC')  return `$${Math.round(price).toLocaleString('en-US')}`
  if (key === 'ETH')  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

// ─── Watchlist card ────────────────────────────────────────────────────────────

function WatchlistCard({ asset, priceData }) {
  const { key, label, icon, bullish = 0, bearish = 0, neutral = 0 } = asset
  const total = bullish + bearish + neutral
  const net   = total === 0 ? 'no-data' : bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral'

  const price  = priceData?.price ?? null
  const pct    = priceData?.changePercent ?? null
  const high   = priceData?.high  ?? null
  const low    = priceData?.low   ?? null
  const dec    = priceData?.decimals

  const pctUp   = pct != null && pct > 0
  const pctDown = pct != null && pct < 0

  // Intraday range bar position (0–100%)
  const rangePct = (high != null && low != null && price != null && high !== low)
    ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
    : null

  const sentimentBadge = {
    bullish:   { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-700', label: '▲ BULL' },
    bearish:   { cls: 'bg-red-500/20 text-red-400 border-red-700',             label: '▼ BEAR' },
    neutral:   { cls: 'bg-amber-500/20 text-amber-400 border-amber-700',       label: '— NEU'  },
    'no-data': { cls: 'bg-[#21262d] text-[#484f58] border-[#30363d]',          label: '· N/A'  },
  }
  const badge = sentimentBadge[net]

  return (
    <div className={`flex-shrink-0 w-[138px] border rounded-sm p-2.5 font-mono
      bg-[#0d1117] transition-colors
      ${pctUp ? 'border-emerald-800/70' : pctDown ? 'border-red-800/70' : 'border-[#21262d]'}`}>

      {/* Top: icon + sentiment */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[1rem] leading-none">{icon}</span>
        <span className={`text-[0.46rem] font-bold px-1 py-0.5 border rounded-sm leading-tight tracking-[0.1em] ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Label */}
      <div className="text-[0.72rem] font-bold text-[#e6edf3] leading-none mb-1">{label}</div>

      {/* Price */}
      <div className={`text-[0.88rem] font-bold leading-tight tabular-nums
        ${pctUp ? 'text-emerald-400' : pctDown ? 'text-red-400' : 'text-[#e6edf3]'}`}>
        {fmtPrice(price, key, dec)}
      </div>

      {/* % change */}
      {pct != null ? (
        <div className={`text-[0.58rem] font-medium leading-tight tabular-nums mt-0.5
          ${pctUp ? 'text-emerald-500' : pctDown ? 'text-red-500' : 'text-[#8b949e]'}`}>
          {fmtPct(pct)}
          <span className="text-[#484f58] ml-1">{priceData?.source === 'stooq' ? 'vs open' : 'vs prev'}</span>
        </div>
      ) : (
        <div className="text-[0.55rem] text-[#484f58] mt-0.5">price unavailable</div>
      )}

      {/* Intraday high/low range bar */}
      {rangePct !== null && (
        <div className="mt-2">
          <div className="flex justify-between text-[0.44rem] text-[#484f58] mb-0.5 tabular-nums">
            <span>{fmtPrice(low, key, dec)}</span>
            <span>{fmtPrice(high, key, dec)}</span>
          </div>
          <div className="h-1 bg-[#21262d] rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full absolute left-0 top-0
                ${pctUp ? 'bg-emerald-500' : pctDown ? 'bg-red-500' : 'bg-[#8b949e]'}`}
              style={{ width: `${rangePct}%` }}
            />
            {/* Price marker */}
            <div
              className="w-0.5 h-full bg-white absolute top-0 opacity-80"
              style={{ left: `${rangePct}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="text-[0.42rem] text-[#484f58] text-center mt-0.5">Day range</div>
        </div>
      )}

      {/* News signal tally */}
      {total > 0 && (
        <div className="mt-1.5 pt-1 border-t border-[#21262d] text-[0.5rem] flex gap-1">
          <span className="text-emerald-500">{bullish}↑</span>
          <span className="text-red-500">{bearish}↓</span>
          <span className="text-[#484f58]">{neutral}—</span>
          <span className="text-[#484f58] ml-auto">news</span>
        </div>
      )}
    </div>
  )
}

// ─── Watchlist bar ─────────────────────────────────────────────────────────────

function AssetWatchlist({ posts, prices, lastUpdated, pricesUpdated }) {
  const tally = {}
  for (const a of ASSETS) tally[a.key] = { ...a, bullish: 0, bearish: 0, neutral: 0 }
  for (const post of posts) {
    for (const a of detectAssets(post.title, post.excerpt)) {
      if (tally[a.key]) tally[a.key][a.dir]++
    }
  }

  const priceMap = {}
  for (const p of (prices || [])) priceMap[p.key] = p

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className="text-[0.55rem] font-mono uppercase tracking-[0.14em] text-[#8b949e]">
          Live Prices &amp; News Sentiment
        </span>
        <div className="flex items-center gap-3 text-[0.5rem] font-mono text-[#484f58]">
          {pricesUpdated && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Prices {timeAgo(pricesUpdated)}
            </span>
          )}
          {lastUpdated && <span>News {timeAgo(lastUpdated)}</span>}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {ASSETS.map(a => (
          <WatchlistCard key={a.key} asset={tally[a.key]} priceData={priceMap[a.key]} />
        ))}
      </div>
    </div>
  )
}

// ─── Asset badge on articles ───────────────────────────────────────────────────

function AssetBadge({ symbol, dir, confidence }) {
  const c = {
    bullish: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
    bearish: 'bg-red-950/60 text-red-400 border-red-800',
    neutral: 'bg-[#161b22] text-[#8b949e] border-[#30363d]',
  }
  const arrow = { bullish: '▲', bearish: '▼', neutral: '—' }
  const dots  = confidence >= 4 ? '●●' : confidence >= 2 ? '●○' : '○○'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.56rem] font-mono font-medium px-1.5 py-0.5 border rounded-sm ${c[dir]}`}
      title={`${arrow[dir]} ${dir} signal (strength: ${dots})`}>
      {arrow[dir]} {symbol}
      <span className="opacity-40 text-[0.43rem] ml-0.5">{dots}</span>
    </span>
  )
}

// ─── Market article row ────────────────────────────────────────────────────────

function MarketArticleRow({ post }) {
  const assets = detectAssets(post.title, post.excerpt)
  assets.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  const isBreaking = post.category === 'breaking-news'
  const minsAgo    = Math.floor((Date.now() - new Date(post.published_at)) / 60000)
  const isFresh    = minsAgo <= 30

  return (
    <article className="group border-b border-[#21262d] py-3.5 hover:bg-[#161b22]/60 transition-colors duration-150">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <Link to={`/post/${post.slug}`} className="shrink-0">
          <div className="w-[82px] h-[54px] sm:w-[112px] sm:h-[74px] bg-[#161b22] overflow-hidden rounded-sm">
            <img
              src={post.cover_image || placeholderImage(post.category)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
              loading="lazy"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap gap-1 mb-1.5 items-center">
            {isFresh && (
              <span className="text-[0.46rem] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-700/60 uppercase tracking-[0.1em]">
                {minsAgo < 5 ? '🔴 JUST NOW' : `${minsAgo}m ago`}
              </span>
            )}
            {isBreaking && (
              <span className="text-[0.46rem] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-700/60 uppercase tracking-[0.1em]">
                BREAKING
              </span>
            )}
            {assets.slice(0, 4).map(a => (
              <AssetBadge key={a.key} symbol={a.key} dir={a.dir} confidence={a.confidence} />
            ))}
          </div>

          <Link to={`/post/${post.slug}`}>
            <h3 className="font-serif font-bold text-[#e6edf3] text-[0.88rem] sm:text-[0.97rem] leading-[1.28] line-clamp-2 group-hover:text-[#c9d1d9] transition-colors">
              {post.title}
            </h3>
          </Link>

          {post.excerpt && (
            <p className="mt-0.5 text-[0.72rem] font-sans text-[#8b949e] line-clamp-1 leading-[1.5] hidden sm:block">
              {post.excerpt}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-1.5 text-[0.6rem] font-mono text-[#484f58] flex-wrap">
            {post.source_name && <span className="text-[#8b949e]">{post.source_name}</span>}
            {post.source_name && <span>·</span>}
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
  { id: 'all',     label: 'All Markets',           desc: 'All recent market news' },
  { id: 'forex',   label: 'Forex',                 desc: 'Currency pairs & central banks' },
  { id: 'futures', label: 'Futures & Commodities', desc: 'Gold, Oil, Silver, Nat Gas & more' },
  { id: 'crypto',  label: 'Crypto',                desc: 'Bitcoin, Ethereum & digital assets' },
]

// ─── Main page ─────────────────────────────────────────────────────────────────

const NEWS_REFRESH_MS  = 5 * 60 * 1000
const PRICE_REFRESH_MS = 60 * 1000
const PAGE_SIZE = 50   // larger initial fetch → more results per tab filter

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

  const loadNews = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    const res = await getMarketPosts({ page: p, pageSize: PAGE_SIZE })
    setPosts(prev => append ? [...prev, ...(res.data || [])] : (res.data || []))
    setHasMore(p < (res.totalPages || 1))
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

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
    } catch { /* fail silently */ }
    finally { setPricesLoading(false) }
  }, [])

  useEffect(() => {
    loadNews(1)
    loadPrices()
    newsTimer.current  = setInterval(() => { setPosts([]); setPage(1); loadNews(1) }, NEWS_REFRESH_MS)
    priceTimer.current = setInterval(loadPrices, PRICE_REFRESH_MS)
    return () => { clearInterval(newsTimer.current); clearInterval(priceTimer.current) }
  }, [loadNews, loadPrices])

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadNews(next, true)
  }

  // ── Tab filter ─────────────────────────────────────────────────────────────
  // "All Markets" shows every post — no keyword gate.
  // Specific tabs filter by asset tab category.
  const filtered = tab === 'all'
    ? posts
    : posts.filter(post => detectAssets(post.title, post.excerpt).some(a => a.tab === tab))

  return (
    <>
      <SEO
        title="Markets — Live prices & analysis"
        description="Real-time market prices, session hours, economic calendar and news impact analysis for forex, futures and crypto traders."
        url="/markets"
      />
      <Header />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-6 md:py-8">

        {/* Page header */}
        <div className="mb-5 pb-4 border-b border-[#21262d] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#e6edf3] tracking-[-0.02em]">
                Markets
              </h1>
              <span className="text-[0.55rem] font-mono uppercase tracking-[0.14em] text-emerald-400 font-bold border border-emerald-700/60 bg-emerald-900/30 px-1.5 py-0.5 rounded-sm">
                Live
              </span>
            </div>
            <p className="text-[0.72rem] font-sans text-[#8b949e]">
              Live prices · sessions · economic calendar · asset impact analysis
            </p>
          </div>
          <button
            onClick={() => { setPage(1); loadNews(1); loadPrices() }}
            className="self-start sm:self-auto text-[0.6rem] font-mono text-[#8b949e] hover:text-emerald-400 transition-colors flex items-center gap-1.5 border border-[#30363d] hover:border-emerald-700 px-3 py-1.5 rounded-sm"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Session indicator */}
        <SessionBar />

        {/* Market pulse */}
        {prices.length > 0 && <MarketPulse prices={prices} />}

        {/* Asset watchlist */}
        {(loading && pricesLoading) ? (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[138px] h-[100px] bg-[#161b22] animate-pulse rounded-sm border border-[#21262d]" />
            ))}
          </div>
        ) : (
          <AssetWatchlist posts={posts} prices={prices} lastUpdated={lastUpdated} pricesUpdated={pricesUpdated} />
        )}

        {/* Economic calendar */}
        <EconomicCalendar />

        {/* Tabs */}
        <div className="flex items-center border-b border-[#21262d] mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.desc}
              className={`text-[0.66rem] sm:text-[0.7rem] font-mono uppercase tracking-[0.1em] px-3 sm:px-5 py-3 border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-400 font-medium'
                  : 'border-transparent text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="hidden lg:flex items-center gap-3 text-[0.52rem] font-mono text-[#484f58] px-2 pb-0.5 shrink-0">
            <span className="flex items-center gap-1"><span className="text-emerald-400">▲</span> Bullish signal</span>
            <span className="flex items-center gap-1"><span className="text-red-400">▼</span> Bearish signal</span>
            <span className="flex items-center gap-1"><span className="opacity-60">●●</span> High confidence</span>
          </div>
        </div>

        {/* Article list */}
        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3 border-b border-[#21262d] py-3.5">
                <div className="w-[82px] h-[54px] sm:w-[112px] sm:h-[74px] bg-[#161b22] shrink-0 rounded-sm" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="flex gap-1">
                    <div className="h-3.5 bg-[#161b22] w-12 rounded-sm" />
                    <div className="h-3.5 bg-[#161b22] w-10 rounded-sm" />
                  </div>
                  <div className="h-4 bg-[#161b22] w-full rounded-sm" />
                  <div className="h-3 bg-[#161b22] w-3/4 rounded-sm" />
                  <div className="h-3 bg-[#161b22] w-1/4 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[1.3rem] font-serif text-[#8b949e] mb-2">No results</p>
            <p className="text-sm font-mono text-[#484f58]">
              {tab === 'all'
                ? 'No articles loaded yet. Check back in a few minutes.'
                : `No ${TABS.find(t => t.id === tab)?.label} stories in the current batch.`}
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-[0.58rem] font-mono text-[#484f58]">
              {filtered.length} {filtered.length === 1 ? 'story' : 'stories'}
              {tab !== 'all' && ' with market impact'}
            </div>
            {filtered.map(post => (
              <MarketArticleRow key={post.id} post={post} />
            ))}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-2.5 border border-[#30363d] text-[0.72rem] font-mono uppercase tracking-[0.1em] text-[#8b949e] hover:border-emerald-700 hover:text-emerald-400 transition-colors rounded-sm"
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
