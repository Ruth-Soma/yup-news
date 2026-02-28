import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'
import { usePosts } from '@/hooks/usePosts'
import { useHotPosts } from '@/hooks/useHotPosts'
import { useGeoRegion } from '@/hooks/useGeoRegion'
import { useFeaturedPosts } from '@/hooks/useFeaturedPosts'
import { getMostReadPosts } from '@/lib/queries'
import { timeAgo, readingTime, placeholderImage } from '@/lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function callFn(name, body) {
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function SectionRow({ label, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-g200 mb-0">
      <span className="text-[0.65rem] font-mono font-medium uppercase tracking-[0.16em] text-g500">
        • {label}
      </span>
      {linkTo && (
        <Link to={linkTo} className="text-[0.65rem] font-mono text-g500 hover:text-ink transition-colors">
          {linkLabel || 'View all'} →
        </Link>
      )}
    </div>
  )
}

// ─── Featured Story (rotating carousel) ───────────────────────────────────
const HERO_LABELS = {
  breaking:  { text: 'Breaking News',        dot: 'bg-red-500' },
  'for-you': { text: 'For You',              dot: 'bg-blue-500' },
  world:     { text: 'Most Popular · World', dot: 'bg-ink' },
  latest:    { text: 'Featured Story',       dot: 'bg-ink' },
}

function FeaturedStory({ posts, fallbackPost }) {
  const allPosts = posts.length > 0 ? posts : (fallbackPost ? [{ ...fallbackPost, _label: 'latest' }] : [])
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  // Reset when the candidate list first arrives
  useEffect(() => { setActive(0); setVisible(true) }, [posts.length])

  function goTo(i) {
    if (i === active || !visible) return
    setVisible(false)
    setTimeout(() => { setActive(i); setVisible(true) }, 200)
  }

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (allPosts.length <= 1) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setActive(prev => (prev + 1) % allPosts.length); setVisible(true) }, 200)
    }, 6000)
    return () => clearInterval(timer)
  }, [allPosts.length])

  const post = allPosts[active]
  if (!post) return null
  const label = HERO_LABELS[post._label] ?? HERO_LABELS.latest

  return (
    <div className="pt-12 pb-0 border-b border-g200">
      <div className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <Link to={`/post/${post.slug}`} className="group block">
          <div className="max-w-[860px] mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${label.dot}`} />
                {label.text}
              </div>
              {allPosts.length > 1 && (
                <div className="flex items-center gap-2">
                  {allPosts.map((_, i) => (
                    <button
                      key={i}
                      onClick={e => { e.preventDefault(); goTo(i) }}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? 'bg-ink' : 'bg-g300 hover:bg-g500'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <h1
              className="font-serif font-bold text-ink leading-[1.06] tracking-[-0.025em] mb-5 group-hover:opacity-80 transition-opacity"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)' }}
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-[1rem] md:text-[1.1rem] text-g500 font-light leading-[1.65] mb-6 max-w-[600px]">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-3 text-[0.72rem] font-sans text-g500">
              {post.source_name && <span>By {post.source_name}</span>}
              {post.source_name && <span>·</span>}
              <span>{readingTime(post.content || post.excerpt || '')}</span>
              <span>·</span>
              <time>{timeAgo(post.published_at)}</time>
            </div>
          </div>
          <div className="w-full aspect-[21/9] overflow-hidden">
            <img
              src={post.cover_image || placeholderImage(post.category)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              onError={e => { e.currentTarget.src = placeholderImage(post.category) }}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}

// ─── Article Card (3-col grid with thumbnail) ──────────────────────────────
function ArticleCard({ post, index }) {
  const num = String(index + 1).padStart(2, '0')
  return (
    <Link
      to={`/post/${post.slug}`}
      className="group flex flex-col border-b border-r-0 border-g200 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 px-0 md:px-8 first:pl-0 last:pr-0 hover:bg-g100 transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-full aspect-[16/9] overflow-hidden mb-5">
        <img
          src={post.cover_image || placeholderImage(post.category)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          onError={e => { e.currentTarget.src = placeholderImage(post.category) }}
        />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div className="text-[0.65rem] font-mono font-medium uppercase tracking-[0.12em] text-g400">
          {post.category?.replace(/-/g, ' ')}
        </div>
        <span className="text-[0.75rem] font-mono text-g300 leading-none flex-shrink-0 ml-4">{num}</span>
      </div>
      <h3
        className="font-serif font-bold text-ink leading-[1.22] tracking-[-0.015em] mb-3 group-hover:opacity-75 transition-opacity"
        style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.35rem)' }}
      >
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-[0.83rem] font-sans text-g500 leading-[1.6] line-clamp-2 mb-4 font-light">
          {post.excerpt}
        </p>
      )}
      <div className="mt-auto pb-7 flex items-center gap-2 text-[0.68rem] font-sans text-g500">
        {post.source_name && <span>{post.source_name}</span>}
        {post.source_name && <span>·</span>}
        <span>{readingTime(post.content || post.excerpt || '')}</span>
      </div>
    </Link>
  )
}

// ─── Long Read item ────────────────────────────────────────────────────────
function LongReadItem({ post }) {
  return (
    <Link
      to={`/post/${post.slug}`}
      className="group flex items-start gap-5 py-6 border-b border-g200 hover:bg-g100 transition-colors -mx-px px-px"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-g400 mb-2">
          {post.region && `${post.region} · `}{post.category?.replace(/-/g, ' ')}
        </div>
        <h3 className="font-serif font-bold text-[1.15rem] leading-[1.28] tracking-[-0.01em] text-ink mb-1.5 group-hover:opacity-75 transition-opacity">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-[0.82rem] font-sans text-g500 font-light leading-[1.55] line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="text-[0.68rem] font-mono text-g400 mt-2">
          {readingTime(post.content || post.excerpt || '')}
        </div>
      </div>
      <div className="w-28 h-20 flex-shrink-0 overflow-hidden">
        <img
          src={post.cover_image || placeholderImage(post.category)}
          alt=""
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
          onError={e => { e.currentTarget.src = placeholderImage(post.category) }}
        />
      </div>
    </Link>
  )
}

// ─── Newsletter ────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingId, setPendingId] = useState('')
  const [errMsg, setErrMsg] = useState('')
  // idle | sending | otp | verifying | done | error | otp_error
  const [status, setStatus] = useState('idle')

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrMsg('')
    const data = await callFn('send-subscribe-otp', { email })
    if (data.success) {
      setPendingId(data.pending_id)
      setStatus('otp')
    } else {
      setErrMsg(data.error || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    if (!otp.trim()) return
    setStatus('verifying')
    setErrMsg('')
    const data = await callFn('verify-subscribe', { pending_id: pendingId, otp })
    if (data.success) {
      setStatus('done')
    } else {
      setErrMsg(data.error || 'Incorrect code. Please try again.')
      setStatus('otp_error')
    }
  }

  return (
    <section id="newsletter" className="py-16 md:py-20 border-t border-g200">
      <div className="max-w-[500px]">
        <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
          Daily Briefing
        </div>
        <h2
          className="font-serif font-bold text-ink leading-[1.1] tracking-[-0.025em] mb-4"
          style={{ fontSize: 'clamp(1.9rem, 3vw, 2.8rem)' }}
        >
          News that <em>matters</em>,<br />delivered daily.
        </h2>
        <p className="text-[0.9rem] font-sans text-g500 font-light leading-[1.65] mb-8">
          Curated stories from the US, China, and the world — no noise, just clarity. Every morning at 7am.
        </p>

        {status === 'done' ? (
          <p className="text-sm font-sans text-g500">✓ You're subscribed. Welcome aboard.</p>
        ) : status === 'otp' || status === 'verifying' || status === 'otp_error' ? (
          <>
            <p className="text-[0.8rem] font-sans text-g500 mb-4">
              We sent a 6-digit code to <strong className="text-ink">{email}</strong>. Check your inbox.
            </p>
            <form onSubmit={handleOtpSubmit} className="flex gap-0">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); if (status === 'otp_error') setStatus('otp') }}
                placeholder="000000"
                required
                disabled={status === 'verifying'}
                className="flex-1 border border-g300 px-4 py-3 text-sm font-mono tracking-[0.25em] bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
                autoFocus
              />
              <button
                type="submit"
                disabled={status === 'verifying' || otp.length < 6}
                className="bg-ink text-paper text-[0.72rem] font-sans font-medium uppercase tracking-[0.1em] px-6 border border-ink hover:opacity-80 transition-opacity flex-shrink-0 disabled:opacity-50"
              >
                {status === 'verifying' ? '...' : 'Verify'}
              </button>
            </form>
            {status === 'otp_error' && (
              <p className="text-[0.75rem] font-sans text-red-500 mt-2">{errMsg}</p>
            )}
            <button
              onClick={() => { setStatus('idle'); setOtp(''); setErrMsg('') }}
              className="text-[0.72rem] font-mono text-g400 hover:text-ink transition-colors mt-3 underline"
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleEmailSubmit} className="flex gap-0">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={status === 'sending'}
                className="flex-1 border border-g300 px-4 py-3 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-ink text-paper text-[0.72rem] font-sans font-medium uppercase tracking-[0.1em] px-6 border border-ink hover:opacity-80 transition-opacity flex-shrink-0 disabled:opacity-50"
              >
                {status === 'sending' ? '...' : 'Subscribe'}
              </button>
            </form>
            {status === 'error' && (
              <p className="text-[0.75rem] font-sans text-red-500 mt-2">{errMsg}</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ─── Region filter pills ───────────────────────────────────────────────────
const REGION_OPTS = [
  { value: null, label: 'All' },
  { value: 'us', label: 'United States' },
  { value: 'china', label: 'China' },
  { value: 'global', label: 'World' },
]

// ─── Home Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [page, setPage] = useState(1)
  const [region, setRegion] = useState(null)
  const [userPickedRegion, setUserPickedRegion] = useState(false)
  const [mostRead, setMostRead] = useState([])
  const geo = useGeoRegion()

  useEffect(() => {
    getMostReadPosts().then(({ data }) => setMostRead(data || []))
  }, [])

  // Auto-select region based on visitor's location (only if user hasn't changed it)
  useEffect(() => {
    if (geo.detected && !userPickedRegion && geo.region) {
      setRegion(geo.region)
    }
  }, [geo.detected, geo.region, userPickedRegion])

  function handleRegionChange(value) {
    setRegion(value)
    setPage(1)
    setUserPickedRegion(true)
  }

  // "All" tab uses hot-score ranking; region/country tabs use date order
  const hotFeed  = useHotPosts({ page: region ? 1 : page })
  const filteredFeed = usePosts({ page, region, append: true })
  const activeFeed = region ? filteredFeed : hotFeed
  const { posts, loading, loadingMore, error, totalPages } = activeFeed
  const { candidates } = useFeaturedPosts()
  const sentinelRef = useRef(null)

  // Infinite scroll — trigger next page when sentinel comes into view
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && page < totalPages) {
          setPage(p => p + 1)
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadingMore, page, totalPages])

  // When smart candidates are ready the hero is independent of the main list,
  // so show posts starting from index 0 in the grid. Until then fall back to
  // posts[0] as the hero and start the grid from index 1.
  const smartHero = candidates.length > 0
  // "Latest Stories" always uses date-ordered feed so it shows the most
  // recently published articles regardless of hot-score ranking.
  const dateOrderedPosts = filteredFeed.posts
  const latestPosts = dateOrderedPosts.slice(smartHero ? 0 : 1, smartHero ? 6 : 7)
  const longReads = posts.slice(smartHero ? 6 : 7, smartHero ? 11 : 12)
  const extraPosts = posts.slice(smartHero ? 11 : 12)

  return (
    <>
      <SEO
        description="Breaking news from the US, China, and around the world — updated every 30 minutes."
        isHomepage
      />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">

        {/* Featured story — rotating smart hero */}
        {(candidates.length > 0 || posts[0]) && (
          <FeaturedStory posts={candidates} fallbackPost={posts[0] || null} />
        )}

        {/* Loading skeleton — only while nothing is ready yet */}
        {loading && candidates.length === 0 && (
          <div className="py-20 space-y-4 animate-pulse">
            <div className="h-3 bg-g100 w-32" />
            <div className="h-14 bg-g100 w-3/4" />
            <div className="h-14 bg-g100 w-1/2" />
            <div className="h-4 bg-g100 w-48 mt-4" />
          </div>
        )}

        {/* Most Read strip */}
        {mostRead.length > 0 && !region && (
          <div className="py-5 border-b border-g200">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
              <span className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-g500 whitespace-nowrap flex-shrink-0">Most Read</span>
              {mostRead.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/post/${p.slug}`}
                  className="flex items-center gap-2.5 min-w-0 flex-shrink-0 group"
                >
                  <span className="font-serif font-black text-[1.1rem] text-g300 leading-none w-5 flex-shrink-0">{i + 1}</span>
                  <span className="text-[0.78rem] font-sans text-g600 group-hover:text-ink transition-colors leading-[1.3] line-clamp-2 max-w-[160px]">
                    {p.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Region filters */}
        <div className="flex items-center gap-4 py-5 border-b border-g200 overflow-x-auto">
          {REGION_OPTS.map(r => (
            <button
              key={r.label}
              onClick={() => handleRegionChange(r.value)}
              className={`text-[0.68rem] font-sans font-medium uppercase tracking-[0.1em] whitespace-nowrap transition-colors pb-0.5 border-b-[1.5px] ${
                region === r.value
                  ? 'text-ink border-ink'
                  : 'text-g400 border-transparent hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
          {geo.detected && geo.label && !userPickedRegion && (
            <span className="ml-auto text-[0.6rem] font-mono text-g400 whitespace-nowrap flex-shrink-0">
              Showing stories for {geo.label} ·{' '}
              <button
                onClick={() => handleRegionChange(null)}
                className="underline hover:text-ink transition-colors"
              >
                Show all
              </button>
            </span>
          )}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="py-16 text-center border-t border-g200">
            <p className="font-serif text-xl text-g500">Couldn't load stories right now.</p>
            <p className="mt-2 text-[0.82rem] font-sans text-g500">Please check your connection and refresh the page.</p>
          </div>
        )}

        {/* Latest Stories */}
        {!loading && !error && (
          <>
            <SectionRow label="Latest Stories" linkTo="/" linkLabel="View all" />
            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-g200 mb-0">
              {latestPosts.map((post, i) => (
                <ArticleCard key={post.id} post={post} index={i} />
              ))}
              {!latestPosts.length && (
                <div className="col-span-3 py-16 text-center text-sm font-sans text-g500">
                  No stories yet. Stories will appear here automatically.
                </div>
              )}
            </div>

            {/* Extra posts (loaded via Load More) */}
            {extraPosts.length > 0 && (
              <div className="mt-8">
                <SectionRow label="More Stories" />
                <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-g200">
                  {extraPosts.map(post => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-6 flex justify-center border-t border-g200">
              {loadingMore && (
                <span className="text-xs font-mono text-g400 tracking-widest uppercase animate-pulse">Loading...</span>
              )}
            </div>
          </>
        )}

        {/* Long Reads */}
        {longReads.length > 0 && (
          <div className="mt-8">
            <SectionRow label="Long Reads" linkTo="/" linkLabel="Archive" />
            <div>
              {longReads.map((post, i) => (
                <LongReadItem key={post.id} post={post} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <Newsletter />

      </main>

      <Footer />
    </>
  )
}
