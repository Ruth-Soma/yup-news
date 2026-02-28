import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { readingTime } from '@/lib/utils'

export default function Preview() {
  const [post, setPost] = useState(null)

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('yup_preview'))
      if (data) setPost(data)
    } catch {}
  }, [])

  if (!post) {
    return (
      <>
        <Header />
        <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
          <p className="font-serif text-2xl text-g500">No preview available.</p>
          <p className="mt-2 text-sm font-sans text-g500">Click "Preview" from the post editor to see a preview here.</p>
          <Link to="/admin/posts/new" className="mt-6 inline-block text-sm font-mono underline text-muted">← Back to editor</Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      {/* Preview banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <span className="text-xs font-mono text-amber-700 uppercase tracking-widest">
          Preview — not published · Close this tab when done
        </span>
      </div>

      <Header />

      <div className="px-6 md:px-12 max-w-[1200px] mx-auto py-10 md:py-14">
        <div className="max-w-[720px] mx-auto">
          <article>
            {/* Back + category */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[0.65rem] font-mono text-g500 uppercase tracking-[0.1em]">← Home</span>
              <span className="text-g300">·</span>
              <span className="text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500">
                {post.category?.replace(/-/g, ' ')}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-serif font-bold text-ink leading-[1.1] tracking-[-0.02em] mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
            >
              {post.title || 'Untitled'}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-[1.05rem] text-g500 font-light leading-[1.65] mb-6 max-w-[600px]">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] font-sans text-g500 pb-6 border-b border-g200 mb-8">
              <span>By YUP Staff</span>
              <span>·</span>
              <time>{new Date(post.published_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              <span>·</span>
              <span>{readingTime(post.content || '')}</span>
            </div>

            {/* Cover image */}
            {post.cover_image && (
              <figure className="mb-10 bg-g100 overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '480px' }}>
                <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
              </figure>
            )}

            {/* Body */}
            <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Tags */}
            {post.tags && (
              <div className="mt-10 pt-6 border-t border-g200 flex flex-wrap gap-2">
                {(typeof post.tags === 'string' ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : post.tags).map(tag => (
                  <span key={tag} className="text-[0.62rem] font-mono px-3 py-1 border border-g200 text-g500 uppercase tracking-[0.1em]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>

      <Footer />
    </>
  )
}
