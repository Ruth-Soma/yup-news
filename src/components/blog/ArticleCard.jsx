import { Link } from 'react-router-dom'
import { timeAgo, readingTime, flagEmoji, placeholderImage } from '@/lib/utils'

export default function ArticleCard({ post, className = '' }) {
  const commentCount = parseInt(post.comments?.[0]?.count ?? 0)

  return (
    <Link
      to={`/post/${post.slug}`}
      className={`group flex items-start gap-4 py-5 border-b border-g200 hover:bg-g50 transition-colors duration-150 ${className}`}
    >
      {/* Text content */}
      <div className="flex-1 min-w-0">
        {/* Category + country */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-g400">
            {post.category?.replace(/-/g, ' ')}
          </span>
          {post.country && (
            <>
              <span className="text-g300 text-[0.55rem]">·</span>
              <span className="text-[0.6rem] font-mono text-g500 flex items-center gap-1">
                {flagEmoji(post.country_code)}
                {post.country}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-[1.05rem] leading-[1.28] tracking-[-0.01em] text-ink mb-1.5 group-hover:opacity-70 transition-opacity line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt — hidden on mobile to keep it tight */}
        {post.excerpt && (
          <p className="hidden sm:block text-[0.82rem] font-sans text-g500 font-light leading-[1.55] line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2 text-[0.65rem] font-mono text-g400 flex-wrap">
          <span>{timeAgo(post.published_at)}</span>
          <span>·</span>
          <span>{readingTime(post.content || post.excerpt || '')}</span>
          {commentCount > 0 && (
            <>
              <span>·</span>
              <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail */}
      <div className="shrink-0 w-[88px] h-[60px] sm:w-[110px] sm:h-[73px] md:w-[130px] md:h-[87px] bg-g100 overflow-hidden">
        <img
          src={post.cover_image || placeholderImage(post.category)}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = placeholderImage(post.category) }}
        />
      </div>
    </Link>
  )
}
