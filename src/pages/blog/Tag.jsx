import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ArticleCard from '@/components/blog/ArticleCard'
import SEO from '@/components/ui/SEO'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 12

export default function Tag() {
  const { tag } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const prevTag = useRef(tag)

  const label = tag?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const totalPages = Math.ceil(count / PAGE_SIZE)

  useEffect(() => {
    if (!tag) return
    const tagChanged = prevTag.current !== tag
    prevTag.current = tag
    const shouldReplace = tagChanged || page === 1

    if (shouldReplace) { setLoading(true); setPosts([]) }
    else setLoadingMore(true)

    const from = (page - 1) * PAGE_SIZE
    supabase
      .from('posts')
      .select('id, title, slug, excerpt, cover_image, category, region, source_name, views, published_at, comments(count)', { count: 'exact' })
      .eq('status', 'published')
      .contains('tags', [tag])
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
      .then(({ data, count: c }) => {
        if (shouldReplace) setPosts(data || [])
        else setPosts(prev => [...prev, ...(data || [])])
        setCount(c || 0)
        setLoading(false)
        setLoadingMore(false)
      })
  }, [tag, page])

  return (
    <>
      <SEO
        title={`#${label}`}
        description={`All YUP stories tagged with "${label}".`}
        url={`/tag/${tag}`}
      />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-12 md:py-16 border-b border-g200">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-4 flex items-center gap-2">
            <Link to="/" className="hover:text-ink transition-colors">Home</Link>
            <span>·</span>
            <span>Tag</span>
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
          >
            #{label}
          </h1>
          {count > 0 && (
            <p className="mt-3 text-[0.72rem] font-mono text-g500">
              {count.toLocaleString()} {count === 1 ? 'story' : 'stories'}
            </p>
          )}
        </div>

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
            <p className="font-serif text-2xl text-g500">No stories for this tag.</p>
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
