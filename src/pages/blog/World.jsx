import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'
import { getPosts, getPopularPosts } from '@/lib/queries'
import { timeAgo, placeholderImage, flagEmoji } from '@/lib/utils'

const REGION_LABEL = {
  us:            'United States',
  china:         'China',
  africa:        'Africa',
  antarctica:    'Antarctica',
  asia:          'Asia',
  europe:        'Europe',
  oceania:       'Australia / Oceania',
  americas:      'Americas',
  'north-america': 'North America',
  'south-america': 'South America',
  global:        'World',
}

const CONTINENTS = [
  { value: 'africa',        label: 'Africa' },
  { value: 'antarctica',    label: 'Antarctica' },
  { value: 'asia',          label: 'Asia' },
  { value: 'oceania',       label: 'Australia / Oceania' },
  { value: 'europe',        label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'south-america', label: 'South America' },
]

// ─── Popular card ────────────────────────────────────────────────────────────

function PopularCard({ post, rank }) {
  return (
    <Link to={`/post/${post.slug}`} className="group block">
      <div className="aspect-video overflow-hidden mb-3 bg-g100 relative">
        <img
          src={post.cover_image || placeholderImage(post.category)}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
        />
        {rank <= 3 && (
          <span className="absolute top-2 left-2 bg-ink text-white text-[0.55rem] font-mono px-1.5 py-0.5 uppercase tracking-[0.1em]">
            #{rank}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-[0.58rem] font-mono uppercase tracking-[0.12em] text-g400">
          {post.category?.replace(/-/g, ' ')}
        </span>
        {post.country && (
          <>
            <span className="text-g300">·</span>
            <span className="text-[0.58rem] font-mono text-g500 flex items-center gap-1">
              {flagEmoji(post.country_code)}
              {post.country}
            </span>
          </>
        )}
        {!post.country && post.region && post.region !== 'global' && (
          <>
            <span className="text-g300">·</span>
            <span className="text-[0.58rem] font-mono uppercase tracking-[0.08em] text-g400">
              {REGION_LABEL[post.region] || post.region}
            </span>
          </>
        )}
      </div>
      <h3 className="font-serif font-bold text-[0.95rem] leading-[1.32] tracking-[-0.01em] text-ink group-hover:opacity-70 transition-opacity line-clamp-2">
        {post.title}
      </h3>
      <p className="mt-1.5 text-[0.65rem] font-mono text-g400 flex items-center gap-2">
        <span>{timeAgo(post.published_at)}</span>
        {post.views > 0 && (
          <>
            <span className="text-g200">·</span>
            <span>{post.views.toLocaleString()} views</span>
          </>
        )}
      </p>
    </Link>
  )
}

// ─── Continent section ────────────────────────────────────────────────────────

function ContinentSection({ continent, posts }) {
  if (!posts || posts.length === 0) {
    return (
      <section className="border border-g200 p-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-g200">
          <h2 className="font-serif font-bold text-[1.05rem] tracking-[-0.01em] text-ink">
            {continent.label}
          </h2>
          <Link
            to={`/region/${continent.value}`}
            className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-g500 hover:text-ink transition-colors"
          >
            All stories →
          </Link>
        </div>
        <p className="text-[0.78rem] font-sans text-g400 py-6 text-center">No stories yet — check back soon.</p>
      </section>
    )
  }
  const [lead, ...rest] = posts

  return (
    <section className="border border-g200 p-6">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-g200">
        <h2 className="font-serif font-bold text-[1.05rem] tracking-[-0.01em] text-ink">
          {continent.label}
        </h2>
        <Link
          to={`/region/${continent.value}`}
          className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-g500 hover:text-ink transition-colors flex items-center gap-1"
        >
          All stories →
        </Link>
      </div>

      <Link to={`/post/${lead.slug}`} className="group block mb-4">
        <div className="aspect-video overflow-hidden mb-3 bg-g100">
          <img
            src={lead.cover_image || placeholderImage(lead.category)}
            alt={lead.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(lead.category) }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[0.6rem] font-mono uppercase tracking-[0.12em] text-g400">
            {lead.category?.replace(/-/g, ' ')}
          </span>
          {lead.country && (
            <>
              <span className="text-g300 text-[0.55rem]">·</span>
              <span className="text-[0.6rem] font-mono text-g500 flex items-center gap-1">
                {flagEmoji(lead.country_code)}
                {lead.country}
              </span>
            </>
          )}
        </div>
        <h3 className="font-serif font-bold text-[0.98rem] leading-[1.3] tracking-[-0.01em] text-ink group-hover:opacity-70 transition-opacity line-clamp-2">
          {lead.title}
        </h3>
        <p className="mt-1 text-[0.65rem] font-mono text-g400">{timeAgo(lead.published_at)}</p>
      </Link>

      {rest.length > 0 && (
        <ul className="divide-y divide-g200 border-t border-g200">
          {rest.map(post => (
            <li key={post.id}>
              <Link to={`/post/${post.slug}`} className="group flex items-start gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[0.55rem] font-mono uppercase tracking-[0.1em] text-g400">
                      {post.category?.replace(/-/g, ' ')}
                    </span>
                    {post.country && (
                      <>
                        <span className="text-g300 text-[0.5rem]">·</span>
                        <span className="text-[0.55rem] font-mono text-g500 flex items-center gap-0.5">
                          {flagEmoji(post.country_code)}
                          {post.country}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="font-sans font-medium text-[0.83rem] leading-[1.35] text-ink group-hover:opacity-70 transition-opacity line-clamp-2">
                    {post.title}
                  </p>
                </div>
                <span className="text-[0.6rem] font-mono text-g400 flex-shrink-0 pt-0.5 whitespace-nowrap">
                  {timeAgo(post.published_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function PopularSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-g100 mb-3" />
      <div className="h-2.5 bg-g100 w-20 mb-2" />
      <div className="h-4 bg-g100 w-full mb-1" />
      <div className="h-4 bg-g100 w-3/4" />
    </div>
  )
}

function ContinentSkeleton() {
  return (
    <div className="border border-g200 p-6 animate-pulse">
      <div className="h-3 bg-g100 w-32 mb-5" />
      <div className="aspect-video bg-g100 mb-3" />
      <div className="h-4 bg-g100 w-3/4 mb-2" />
      <div className="h-3 bg-g100 w-1/2 mb-4" />
      {[1, 2].map(i => (
        <div key={i} className="py-3 border-t border-g200">
          <div className="h-3 bg-g100 w-full mb-1" />
          <div className="h-3 bg-g100 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function World() {
  const [popular, setPopular] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      // Most popular from EVERY region (no filter)
      getPopularPosts(9),
      // Latest 4 from each continent for regional sections
      ...CONTINENTS.map(c =>
        getPosts({ region: c.value, page: 1 }).then(res => ({
          continent: c,
          posts: (res.data || []).slice(0, 4),
        }))
      ),
    ]).then(([popularRes, ...continentResults]) => {
      setPopular(popularRes.data || [])
      setSections(continentResults.filter(s => s.posts.length > 0 || s.continent.value === 'china'))
      setLoading(false)
    })
  }, [])

  return (
    <>
      <SEO
        title="World News"
        description="The most popular and trending news from every corner of the globe — United States, China, Africa, Asia, Europe and beyond. Updated every 30 minutes on YUP."
        url="/region/global"
      />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">

        {/* Page header */}
        <div className="py-12 md:py-16 border-b border-g200">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            <span>·</span>
            <span>World</span>
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
          >
            World News
          </h1>
          <p className="mt-3 text-[0.82rem] font-sans text-g500 font-light">
            The latest stories from around the globe, right now.
          </p>
        </div>

        {/* ── Most Read ── */}
        <div className="py-10 border-b border-g200">
          <div className="flex items-center justify-between mb-7">
            <span className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-g500">
              • Latest
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => <PopularSkeleton key={i} />)}
            </div>
          ) : popular.length === 0 ? (
            <p className="text-[0.82rem] font-sans text-g500 py-8 text-center">No stories yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
              {popular.map((post, i) => (
                <PopularCard key={post.id} post={post} rank={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* ── Browse by Region ── */}
        {(loading || sections.length > 0) && (
          <div className="py-10">
            <div className="flex items-center justify-between mb-7">
              <span className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-g500">
                • Browse by Region
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <ContinentSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(({ continent, posts }) => (
                  <ContinentSection key={continent.value} continent={continent} posts={posts} />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </>
  )
}
