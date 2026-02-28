import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ArticleCard from '@/components/blog/ArticleCard'
import SEO from '@/components/ui/SEO'
import { usePosts } from '@/hooks/usePosts'

const REGION_LABELS = {
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

export default function Region() {
  const { region } = useParams()
  const [page, setPage] = useState(1)
  const { posts, loading, loadingMore, totalPages, count } = usePosts({ page, region, append: true })
  const label = REGION_LABELS[region] || region

  return (
    <>
      <SEO
        title={`${label} News`}
        description={`Latest breaking news from ${label} — updated every 30 minutes on YUP.`}
        url={`/region/${region}`}
      />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        {/* Page header */}
        <div className="py-12 md:py-16 border-b border-g200">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            <span>·</span>
            <span>Region</span>
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
          >
            {label}
          </h1>
          {count > 0 && (
            <p className="mt-3 text-[0.72rem] font-mono text-g500">
              {count.toLocaleString()} stories
            </p>
          )}
        </div>

        {/* Post list */}
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse py-6 border-b border-g200">
                <div className="h-2 bg-g100 w-20 mb-3" />
                <div className="h-5 bg-g100 w-3/4 mb-2" />
                <div className="h-4 bg-g100 w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-g500">No stories yet.</p>
            <p className="mt-2 text-[0.82rem] font-sans text-g500">Check back soon.</p>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {page < totalPages && !loading && (
          <div className="py-10 flex justify-center border-t border-g200">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loadingMore}
              className="px-8 py-2.5 border border-ink text-xs font-mono uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
