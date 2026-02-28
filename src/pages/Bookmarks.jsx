import { Link } from 'react-router-dom'
import { Bookmark, Trash2 } from 'lucide-react'
import { useBookmarks } from '@/hooks/useBookmarks'
import { format } from 'date-fns'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function Bookmarks() {
  const { bookmarks, remove } = useBookmarks()

  return (
    <>
      <SEO title="Reading List" description="Your saved articles" />
      <Header />
      <main className="px-6 md:px-12 max-w-[1200px] mx-auto min-h-[60vh]">
        <div className="py-10 border-b border-g200 max-w-[720px]">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif font-bold text-3xl text-ink">Reading List</h1>
            {bookmarks.length > 0 && (
              <span className="text-xs font-mono text-muted">{bookmarks.length} saved</span>
            )}
          </div>
        </div>

        <div className="max-w-[720px] py-8">
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Bookmark size={36} className="text-border mb-4" />
              <p className="text-sm font-sans text-muted mb-1">No saved articles yet.</p>
              <p className="text-xs font-mono text-border">
                Tap the bookmark icon on any article to save it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border bg-paper">
              {bookmarks.map(post => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-surface transition-colors group"
                >
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt=""
                      className="w-16 h-12 object-cover shrink-0 hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {post.category && (
                      <span className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-muted block mb-1">
                        {post.category.replace(/-/g, ' ')}
                      </span>
                    )}
                    <Link
                      to={`/post/${post.slug}`}
                      className="text-sm font-serif font-bold text-ink hover:text-muted transition-colors line-clamp-2 leading-snug"
                    >
                      {post.title}
                    </Link>
                    {post.published_at && (
                      <p className="text-xs font-mono text-border mt-1">
                        {format(new Date(post.published_at), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(post.id)}
                    className="shrink-0 p-1.5 text-border hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from reading list"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
