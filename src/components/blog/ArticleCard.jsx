import { Link } from 'react-router-dom'
import { timeAgo, readingTime, flagEmoji } from '@/lib/utils'

export default function ArticleCard({ post, className = 'px-px' }) {
  return (
    <Link
      to={`/post/${post.slug}`}
      className={`group flex items-start justify-between py-6 border-b border-g200 hover:bg-g100 transition-colors gap-6 -mx-px ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[0.62rem] font-mono uppercase tracking-[0.14em] text-g400">
            {post.category?.replace(/-/g, ' ')}
          </span>
          {post.country && (
            <>
              <span className="text-g300 text-[0.55rem]">·</span>
              <span className="text-[0.62rem] font-mono text-g500 flex items-center gap-1">
                {flagEmoji(post.country_code)}
                {post.country}
              </span>
            </>
          )}
        </div>
        <h3 className="font-serif font-bold text-[1.1rem] leading-[1.28] tracking-[-0.01em] text-ink mb-1.5 group-hover:opacity-75 transition-opacity line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-[0.83rem] font-sans text-g500 font-light leading-[1.55] line-clamp-2">
            {post.excerpt}
          </p>
        )}
      </div>
      <div className="text-right text-[0.68rem] font-mono text-g400 flex-shrink-0 pt-0.5 space-y-1">
        <div>{timeAgo(post.published_at)}</div>
        <div>{readingTime(post.content || post.excerpt || '')}</div>
        {(() => { const n = parseInt(post.comments?.[0]?.count ?? 0); return n > 0 ? <div>{n} {n === 1 ? 'comment' : 'comments'}</div> : null })()}
      </div>
    </Link>
  )
}
