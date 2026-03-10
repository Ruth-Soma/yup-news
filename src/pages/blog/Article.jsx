import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ShareButtons from '@/components/blog/ShareButtons'
import ArticleCard from '@/components/blog/ArticleCard'
import SEO from '@/components/ui/SEO'
import { BreakingBadge } from '@/components/ui/Badge'
import { getPostBySlug, getRelatedPosts, getMoreFromCategory, incrementPostViews, getComments, addComment, getLikeCount, toggleLike, hasLiked } from '@/lib/queries'
import { formatDate, readingTime, placeholderImage, timeAgo, flagEmoji, countryInfoFromPost } from '@/lib/utils'
import { useBookmarks } from '@/hooks/useBookmarks'

// Allowed HTML tags and attributes for article body (whitelist only journalism markup)
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li',
                 'blockquote', 'br', 'figure', 'figcaption', 'img', 'span', 'div', 'iframe'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title', 'width', 'height',
                 'frameborder', 'allowfullscreen', 'allow', 'loading', 'referrerpolicy'],
  ALLOW_DATA_ATTR: false,
  FORCE_HTTPS: true,
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allowfullscreen', 'allow', 'frameborder', 'referrerpolicy', 'loading'],
}

const COMMENTER_KEY = 'yup_commenter'

function getSessionId() {
  let id = localStorage.getItem('yup_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('yup_session_id', id)
  }
  return id
}

function loadCommenter() {
  try { return JSON.parse(localStorage.getItem(COMMENTER_KEY)) } catch { return null }
}

export default function Article() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [progress, setProgress] = useState(0)

  const { isBookmarked, toggle: toggleBookmark } = useBookmarks()

  // Likes
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // Comments
  const [comments, setComments] = useState([])
  const [commentsReady, setCommentsReady] = useState(true)
  const [commenter, setCommenter] = useState(() => loadCommenter()) // verified identity from localStorage
  const [commentName, setCommentName] = useState(() => loadCommenter()?.name || '')
  const [commentEmail, setCommentEmail] = useState(() => loadCommenter()?.email || '')
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  // OTP verification
  const [commentStep, setCommentStep] = useState('form') // 'form' | 'otp' | 'done'
  const [pendingId, setPendingId] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const commentFormRef = useRef(null)

  // More from this category (loaded when user reaches bottom)
  const [morePosts, setMorePosts] = useState([])
  const moreRef = useRef(null)

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setNotFound(false)
    setProgress(0)
    setLikeCount(0)
    setLiked(false)
    setComments([])
    setCommentsReady(true)
    setSubmitSuccess(false)
    setSubmitError('')
    setCommentStep('form')
    setPendingId('')
    setOtpValue('')
    setMorePosts([])
    getPostBySlug(slug).then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true)
      } else {
        setPost(data)
        // Pass country from geo session cache so views are attributed to locations
        try {
          const geo = JSON.parse(sessionStorage.getItem('yup_geo') || '{}')
          incrementPostViews(data.id, geo.country || null, geo.countryCode || null)
        } catch {
          incrementPostViews(data.id)
        }
        // Track category interest
        try {
          const interests = JSON.parse(localStorage.getItem('yup_interests') || '{}')
          interests[data.category] = (interests[data.category] || 0) + 1
          localStorage.setItem('yup_interests', JSON.stringify(interests))
        } catch {}
        // Track country interest (for country-level recommendations)
        try {
          if (data.country_code) {
            const ci = JSON.parse(localStorage.getItem('yup_country_interests') || '{}')
            ci[data.country_code] = (ci[data.country_code] || 0) + 1
            localStorage.setItem('yup_country_interests', JSON.stringify(ci))
          }
        } catch {}
        getRelatedPosts(data.category, data.slug).then(({ data: rel }) => {
          setRelated(rel || [])
        })
        // Load likes and comments
        const sessionId = getSessionId()
        getLikeCount(data.id).then(({ count }) => setLikeCount(count))
        hasLiked(data.id, sessionId).then(result => setLiked(result))
        getComments(data.id).then(({ data: c, error: ce }) => {
          if (ce?.code === 'PGRST205') {
            setCommentsReady(false)
          } else {
            setComments(c || [])
          }
        })
      }
      setLoading(false)
    })
  }, [slug])

  // Load "more from category" when user scrolls to the bottom section
  useEffect(() => {
    if (!post || !moreRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && morePosts.length === 0) {
          const excludeSlugs = [post.slug, ...related.map(r => r.slug)]
          getMoreFromCategory(post.category, excludeSlugs, 8).then(({ data }) => {
            if (data && data.length > 0) setMorePosts(data)
          })
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(moreRef.current)
    return () => observer.disconnect()
  }, [post, related, morePosts.length])

  async function handleLike() {
    if (likeLoading || !post) return
    setLikeLoading(true)
    const sessionId = getSessionId()
    const { liked: newLiked } = await toggleLike(post.id, sessionId)
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1))
    setLikeLoading(false)
  }

  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-comment-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ post_id: post.id, name: commentName, email: commentEmail, content: commentText }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to send verification email. Please try again.')
      } else if (data.skip_otp) {
        // Subscriber — save token and post directly without OTP
        const saved = { name: commentName, email: commentEmail, token: data.commenter_token }
        localStorage.setItem(COMMENTER_KEY, JSON.stringify(saved))
        setCommenter(saved)
        // Post comment immediately using the token
        await postCommentWithToken(saved, commentText)
      } else {
        setPendingId(data.pending_id)
        setCommentStep('otp')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  async function postCommentWithToken(commenterData, text) {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-comment-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          commenter_token: commenterData.token,
          post_id: post.id,
          name: commenterData.name,
          content: text,
        }),
      })
      const data = await res.json()
      if (data.token_expired) {
        localStorage.removeItem(COMMENTER_KEY)
        setCommenter(null)
        setCommentName('')
        setCommentEmail('')
        setCommentStep('form')
        setSubmitError('Your session expired. Please verify your email again.')
      } else if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to post comment. Please try again.')
      } else {
        setComments(prev => [...prev, data.comment])
        setCommentStep('done')
        setCommentText('')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otpValue.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-comment-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ pending_id: pendingId, otp: otpValue }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Incorrect code. Please try again.')
      } else {
        setComments(prev => [...prev, data.comment])
        // Save verified identity so they never need OTP again
        if (data.commenter_token) {
          const saved = { name: commentName, email: commentEmail, token: data.commenter_token }
          localStorage.setItem(COMMENTER_KEY, JSON.stringify(saved))
          setCommenter(saved)
        }
        setCommentStep('done')
        setCommentText('')
        setOtpValue('')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  // Quick submit for previously-verified commenters (no OTP needed)
  async function handleQuickSubmit(e) {
    e.preventDefault()
    if (!commentText.trim() || !commenter) return
    setSubmitting(true)
    setSubmitError('')
    await postCommentWithToken(commenter, commentText)
    setSubmitting(false)
  }

  function forgetCommenter() {
    localStorage.removeItem(COMMENTER_KEY)
    setCommenter(null)
    setCommentName('')
    setCommentEmail('')
    setCommentStep('form')
    setSubmitError('')
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-article mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-surface w-1/4" />
            <div className="h-10 bg-surface w-full" />
            <div className="h-10 bg-surface w-3/4" />
            <div className="h-64 bg-surface w-full mt-6" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (notFound || !post) {
    return (
      <>
        <Header />
        <div className="max-w-article mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-4xl font-bold text-ink">Article not found</h1>
          <Link to="/" className="mt-6 inline-block text-sm font-mono underline text-muted">
            ← Back to home
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        image={post.cover_image}
        url={`/post/${post.slug}`}
        type="article"
        article={post}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: post.category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'News', url: `/category/${post.category}` },
          { name: post.title, url: `/post/${post.slug}` },
        ]}
      />
      <Header />

      <div className="px-6 md:px-12 max-w-[1200px] mx-auto py-10 md:py-14">
        <div className="max-w-[720px] mx-auto">
          <article>
            {/* Back + category */}
            <div className="flex items-center gap-3 mb-8">
              <Link to="/" className="text-[0.65rem] font-mono text-g500 hover:text-ink transition-colors uppercase tracking-[0.1em]">
                ← Home
              </Link>
              <span className="text-g300">·</span>
              <Link
                to={`/category/${post.category}`}
                className="text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 hover:text-ink transition-colors"
              >
                {post.category?.replace(/-/g, ' ')}
              </Link>
              {post.category === 'breaking-news' && <BreakingBadge />}
            </div>

            {/* Headline */}
            <h1
              className="font-serif font-bold text-ink leading-[1.1] tracking-[-0.02em] mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
            >
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-[1.05rem] text-g500 font-light leading-[1.65] mb-6 max-w-[600px]">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] font-sans text-g500 pb-6 border-b border-g200 mb-8">
              <span>By {post.source_name || 'YUP Staff'}</span>
              <span>·</span>
              <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              <span>·</span>
              <span>{readingTime(post.content)}</span>
              {(() => {
                const ci = countryInfoFromPost(post)
                return ci ? (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      {ci.code && <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{flagEmoji(ci.code)}</span>}
                      {ci.name && <span>{ci.name}</span>}
                    </span>
                  </>
                ) : null
              })()}
            </div>

            {/* Cover image */}
            <figure className="mb-10 bg-g100 overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '480px' }}>
              <img
                src={post.cover_image || placeholderImage(post.category)}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={e => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = placeholderImage(post.category)
                }}
              />
            </figure>

            {/* Body */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, PURIFY_CONFIG) }}
            />

            {/* Source attribution — text credit only, no outbound link */}
            {post.source_name && (
              <div className="mt-10 pt-6 border-t border-g200">
                <span className="text-[0.72rem] font-sans text-g500">
                  Originally reported by{' '}
                  <strong className="text-g600 font-medium">{post.source_name}</strong>
                </span>
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="mt-10 pt-6 border-t border-g200 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/tag/${encodeURIComponent(tag)}`}
                    className="text-[0.62rem] font-mono px-3 py-1 border border-g200 text-g500 uppercase tracking-[0.1em] hover:border-ink hover:text-ink transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share + Like + Bookmark */}
            <div className="mt-6 pt-6 border-t border-g200 flex items-center justify-between gap-4 flex-wrap">
              <ShareButtons title={post.title} url={`/post/${post.slug}`} />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(post)}
                  title={isBookmarked(post.id) ? 'Remove bookmark' : 'Bookmark this story'}
                  className={`flex items-center gap-1.5 px-3 py-2 border text-[0.75rem] font-mono transition-all ${
                    isBookmarked(post.id)
                      ? 'bg-ink text-white border-ink'
                      : 'border-g200 text-g500 hover:border-ink hover:text-ink'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {isBookmarked(post.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center gap-2 px-4 py-2 border text-[0.75rem] font-mono transition-all ${
                    liked
                      ? 'bg-ink text-white border-ink'
                      : 'border-g200 text-g500 hover:border-ink hover:text-ink'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {likeCount > 0 ? likeCount : ''} {likeCount === 1 ? 'Like' : 'Likes'}
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Comments */}
        <section className="mt-16 max-w-[720px] mx-auto" ref={commentFormRef}>
          <div className="py-4 border-b border-g200 mb-6">
            <span className="text-[0.65rem] font-mono font-medium uppercase tracking-[0.16em] text-g500">
              • {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
            </span>
          </div>

          {!commentsReady ? (
            <div className="border border-g200 p-6 text-center">
              <p className="text-[0.82rem] font-sans text-g500">
                Comments are being set up — check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Comment list */}
              {comments.length > 0 && (
                <div className="divide-y divide-g200 mb-10">
                  {comments.map(c => (
                    <div key={c.id} className="py-5">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-[0.82rem] font-sans font-medium text-ink">{c.name}</span>
                        <span className="text-[0.65rem] font-mono text-g400">
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[0.88rem] font-sans text-g600 leading-[1.6]">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              <div className="border border-g200 p-6">
                {commentStep === 'done' ? (
                  <div className="py-4 text-center">
                    <p className="text-[0.88rem] font-sans text-ink font-medium mb-1">Comment posted!</p>
                    <p className="text-[0.78rem] font-sans text-g500">Thanks for sharing your thoughts.</p>
                    <button
                      onClick={() => { setCommentStep('form'); setSubmitError('') }}
                      className="mt-4 text-[0.72rem] font-mono uppercase tracking-[0.1em] text-g500 hover:text-ink transition-colors"
                    >
                      Write another →
                    </button>
                  </div>
                ) : commentStep === 'otp' ? (
                  <>
                    <div className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-1">Verify your email</div>
                    <p className="text-[0.78rem] font-sans text-g500 mb-5">
                      We sent a 6-digit code to <strong className="text-ink">{commentEmail}</strong>. Enter it below.
                    </p>
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="_ _ _ _ _ _"
                        value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        required
                        maxLength={6}
                        autoFocus
                        className="w-full border border-g200 px-4 py-3 text-[1.4rem] font-mono text-ink tracking-[0.4em] text-center placeholder:text-g300 placeholder:tracking-[0.3em] focus:outline-none focus:border-g400 bg-white"
                      />
                      {submitError && (
                        <p className="text-[0.75rem] font-sans text-red-500">{submitError}</p>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => { setCommentStep('form'); setSubmitError(''); setOtpValue('') }}
                          className="text-[0.72rem] font-mono uppercase tracking-[0.1em] text-g400 hover:text-ink transition-colors"
                        >
                          ← Change email
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || otpValue.length !== 6}
                          className="px-6 py-2.5 bg-ink text-white text-[0.78rem] font-mono uppercase tracking-[0.1em] hover:bg-g600 transition-colors disabled:opacity-40"
                        >
                          {submitting ? 'Verifying...' : 'Post Comment'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : commenter ? (
                  /* Quick form — verified user, no OTP needed */
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500">Leave a comment</div>
                      <div className="text-[0.7rem] font-sans text-g400">
                        Posting as <strong className="text-ink">{commenter.name}</strong>
                        <button
                          onClick={forgetCommenter}
                          className="ml-2 underline hover:text-ink transition-colors"
                        >
                          Not you?
                        </button>
                      </div>
                    </div>
                    <form onSubmit={handleQuickSubmit} className="space-y-4">
                      <textarea
                        placeholder="Share your thoughts..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        required
                        maxLength={1000}
                        rows={4}
                        className="w-full border border-g200 px-4 py-2.5 text-[0.85rem] font-sans text-ink placeholder:text-g300 focus:outline-none focus:border-g400 bg-white resize-none"
                      />
                      {submitError && (
                        <p className="text-[0.75rem] font-sans text-red-500">{submitError}</p>
                      )}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submitting || !commentText.trim()}
                          className="px-6 py-2.5 bg-ink text-white text-[0.78rem] font-mono uppercase tracking-[0.1em] hover:bg-g600 transition-colors disabled:opacity-40"
                        >
                          {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Full form — first-time commenter, OTP required */
                  <>
                    <div className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-5">Leave a comment</div>
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Your name"
                          value={commentName}
                          onChange={e => setCommentName(e.target.value)}
                          required
                          maxLength={80}
                          className="w-full border border-g200 px-4 py-2.5 text-[0.85rem] font-sans text-ink placeholder:text-g300 focus:outline-none focus:border-g400 bg-white"
                        />
                        <input
                          type="email"
                          placeholder="Email (for verification, not published)"
                          value={commentEmail}
                          onChange={e => setCommentEmail(e.target.value)}
                          required
                          className="w-full border border-g200 px-4 py-2.5 text-[0.85rem] font-sans text-ink placeholder:text-g300 focus:outline-none focus:border-g400 bg-white"
                        />
                      </div>
                      <textarea
                        placeholder="Share your thoughts..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        required
                        maxLength={1000}
                        rows={4}
                        className="w-full border border-g200 px-4 py-2.5 text-[0.85rem] font-sans text-ink placeholder:text-g300 focus:outline-none focus:border-g400 bg-white resize-none"
                      />
                      {submitError && (
                        <p className="text-[0.75rem] font-sans text-red-500">{submitError}</p>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[0.7rem] font-sans text-g400">Your email won't be published. One-time verification.</p>
                        <button
                          type="submit"
                          disabled={submitting || !commentName.trim() || !commentEmail.trim() || !commentText.trim()}
                          className="px-6 py-2.5 bg-ink text-white text-[0.78rem] font-mono uppercase tracking-[0.1em] hover:bg-g600 transition-colors disabled:opacity-40"
                        >
                          {submitting ? 'Sending code...' : 'Continue'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 pt-0 max-w-[720px] mx-auto">
            <div className="flex items-center justify-between py-4 border-b border-g200 mb-0">
              <span className="text-[0.65rem] font-mono font-medium uppercase tracking-[0.16em] text-g500">
                • Related Stories
              </span>
            </div>
            <div className="divide-y divide-g200">
              {related.map(p => (
                <ArticleCard key={p.id} post={p} className="px-5 md:px-6" />
              ))}
            </div>
          </section>
        )}

        {/* More from this category — triggered once user reaches this point */}
        <div ref={moreRef}>
          {morePosts.length > 0 && (
            <section className="mt-12 max-w-[720px] mx-auto pb-6">
              <div className="flex items-center justify-between py-4 border-b border-g200 mb-6">
                <span className="text-[0.65rem] font-mono font-medium uppercase tracking-[0.16em] text-g500">
                  • More in {post?.category?.replace(/-/g, ' ')}
                </span>
                <Link
                  to={`/category/${post?.category}`}
                  className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-g500 hover:text-ink transition-colors"
                >
                  All stories →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {morePosts.map(p => (
                  <Link key={p.id} to={`/post/${p.slug}`} className="group block">
                    <div className="aspect-video overflow-hidden mb-2.5 bg-g100">
                      <img
                        src={p.cover_image || placeholderImage(p.category)}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(p.category) }}
                      />
                    </div>
                    <h4 className="font-serif font-bold text-[0.82rem] leading-[1.3] text-ink group-hover:opacity-65 transition-opacity line-clamp-3">
                      {p.title}
                    </h4>
                    <p className="mt-1 text-[0.62rem] font-mono text-g400">{timeAgo(p.published_at)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />

      {/* Back to top */}
      {progress > 20 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-ink text-paper flex items-center justify-center hover:opacity-75 transition-opacity shadow-lg"
          aria-label="Back to top"
          title="Back to top"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  )
}
