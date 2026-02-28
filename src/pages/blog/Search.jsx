import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ArticleCard from '@/components/blog/ArticleCard'
import SEO from '@/components/ui/SEO'
import { searchPosts } from '@/lib/queries'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [page, setPage] = useState(1)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const prevQuery = useRef(query)

  useEffect(() => {
    if (!query) { setResults([]); setCount(0); return }
    const queryChanged = prevQuery.current !== query
    prevQuery.current = query
    const shouldReplace = queryChanged || page === 1

    if (shouldReplace) { setLoading(true); setResults([]) }
    else setLoadingMore(true)

    searchPosts(query, { page }).then(({ data, count, totalPages }) => {
      if (shouldReplace) setResults(data || [])
      else setResults(prev => [...prev, ...(data || [])])
      setCount(count || 0)
      setTotalPages(totalPages)
      setLoading(false)
      setLoadingMore(false)
    })
  }, [query, page])

  // Reset page when query changes
  useEffect(() => { setPage(1) }, [query])

  return (
    <>
      <SEO title={`Search: ${query}`} description={`Search results for "${query}" on YUP`} />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        {/* Page header */}
        <div className="py-12 md:py-16 border-b border-g200">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-4">
            Search Results
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
          >
            {query ? `"${query}"` : 'Search'}
          </h1>
          {query && !loading && (
            <p className="mt-3 text-[0.72rem] font-mono text-g500">
              {count.toLocaleString()} {count === 1 ? 'story' : 'stories'} found
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse py-6 border-b border-g200">
                <div className="h-2 bg-g100 w-20 mb-3" />
                <div className="h-5 bg-g100 w-3/4 mb-2" />
                <div className="h-4 bg-g100 w-full" />
              </div>
            ))}
          </div>
        ) : !query ? (
          <div className="py-24 text-center">
            <p className="font-serif text-xl text-g500">Enter a search term above.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-g500">No results for "{query}"</p>
            <p className="mt-2 text-[0.82rem] font-sans text-g500">Try a different search term.</p>
          </div>
        ) : (
          <div>
            {results.map(post => (
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
