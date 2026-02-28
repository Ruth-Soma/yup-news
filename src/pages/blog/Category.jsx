import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ArticleCard from '@/components/blog/ArticleCard'
import SEO from '@/components/ui/SEO'
import { usePosts } from '@/hooks/usePosts'
import { timeAgo, placeholderImage, flagEmoji, countryInfoFromPost } from '@/lib/utils'

// Hero card for the first (featured) article in the category
function HeroCard({ post }) {
  return (
    <Link
      to={`/post/${post.slug}`}
      className="group block border border-g200 overflow-hidden hover:border-g400 transition-colors mb-6"
    >
      {/* Image */}
      <div className="aspect-[16/7] sm:aspect-[16/6] bg-g100 overflow-hidden">
        <img
          src={post.cover_image || placeholderImage(post.category)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
        />
      </div>
      {/* Content */}
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-g400">
            {post.category?.replace(/-/g, ' ')}
          </span>
          {(() => {
            const ci = countryInfoFromPost(post)
            return ci ? (
              <>
                <span className="text-g300">·</span>
                <span className="text-[0.6rem] font-mono text-g500 flex items-center gap-1">
                  {ci.code && flagEmoji(ci.code)} {ci.name}
                </span>
              </>
            ) : null
          })()}
          <span className="text-g300">·</span>
          <span className="text-[0.6rem] font-mono text-g400">{timeAgo(post.published_at)}</span>
        </div>
        <h2
          className="font-serif font-bold text-ink leading-[1.2] tracking-[-0.015em] group-hover:opacity-75 transition-opacity"
          style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}
        >
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-[0.85rem] sm:text-[0.9rem] font-sans text-g500 font-light leading-[1.55] line-clamp-2 max-w-[700px]">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function Category() {
  const { slug } = useParams()
  const [page, setPage] = useState(1)
  const { posts, loading, loadingMore, error, totalPages, count } = usePosts({ page, category: slug, append: true })
  const title = slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const hero = posts[0]
  const rest  = posts.slice(1)

  return (
    <>
      <SEO
        title={title}
        description={`Latest ${title} news from YUP — breaking stories updated every 30 minutes.`}
        url={`/category/${slug}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: title, url: `/category/${slug}` },
        ]}
        pagination={totalPages > 1 ? { page, totalPages, baseUrl: `/category/${slug}` } : undefined}
      />
      <Header />

      <main className="px-4 sm:px-6 md:px-10 lg:px-12 max-w-[1200px] mx-auto">

        {/* Page header */}
        <div className="py-8 sm:py-10 md:py-14 border-b border-g200 mb-6">
          <div className="text-[0.6rem] font-mono uppercase tracking-[0.16em] text-g500 mb-3 flex items-center gap-2">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            <span>·</span>
            <span>Section</span>
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
          >
            {title}
          </h1>
          {count > 0 && (
            <p className="mt-2 text-[0.7rem] font-mono text-g500">
              {count.toLocaleString()} stories
            </p>
          )}
        </div>

        {/* Post list */}
        {error ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-g500">Failed to load stories.</p>
            <p className="mt-2 text-[0.82rem] font-sans text-g500">Please check your connection and refresh the page.</p>
          </div>
        ) : loading ? (
          <div>
            {/* Hero skeleton */}
            <div className="animate-pulse border border-g200 mb-6">
              <div className="aspect-[16/7] bg-g100" />
              <div className="p-5 space-y-2">
                <div className="h-3 bg-g100 w-24" />
                <div className="h-6 bg-g100 w-full" />
                <div className="h-4 bg-g100 w-3/4" />
              </div>
            </div>
            {/* List skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 py-5 border-b border-g200">
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-g100 w-20" />
                  <div className="h-5 bg-g100 w-full" />
                  <div className="h-4 bg-g100 w-3/4" />
                  <div className="h-3 bg-g100 w-1/4" />
                </div>
                <div className="w-[130px] h-[87px] bg-g100 shrink-0" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-g500">No stories yet.</p>
            <p className="mt-2 text-[0.82rem] font-sans text-g500">Check back soon — we publish every 30 minutes.</p>
          </div>
        ) : (
          <div>
            {/* Featured first article with large image */}
            {hero && <HeroCard post={hero} />}
            {/* Remaining articles with thumbnails */}
            {rest.map(post => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {page < totalPages && !loading && (
          <div className="py-10 flex justify-center border-t border-g200 mt-4">
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
