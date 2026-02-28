import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, ExternalLink, MessageSquare, ShieldX, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { adminMarkCommentSpam } from '@/lib/queries'
import { format } from 'date-fns'

const TABS = ['approved', 'spam', 'all']

export default function Comments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const [tab, setTab] = useState('approved')

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('comments')
      .select('id, name, content, created_at, status, post_id, posts(title, slug)')
      .order('created_at', { ascending: false })
      .limit(300)

    if (tab !== 'all') query = query.eq('status', tab)

    query.then(({ data }) => {
      setComments(data || [])
      setLoading(false)
    })
  }, [tab])

  // Count how many times each commenter name appears in current view
  const nameCounts = useMemo(() => {
    const counts = {}
    comments.forEach(c => {
      const key = c.name?.toLowerCase().trim()
      if (key) counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [comments])

  const spamCount = comments.filter(c => c.status === 'spam').length

  async function handleMarkSpam(id) {
    setActing(id)
    const { error } = await adminMarkCommentSpam(id)
    if (!error) {
      setComments(prev =>
        tab === 'approved'
          ? prev.filter(c => c.id !== id)
          : prev.map(c => c.id === id ? { ...c, status: 'spam' } : c)
      )
    }
    setActing(null)
  }

  async function handleRestore(id) {
    setActing(id)
    const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id)
    if (!error) {
      setComments(prev =>
        tab === 'spam'
          ? prev.filter(c => c.id !== id)
          : prev.map(c => c.id === id ? { ...c, status: 'approved' } : c)
      )
    }
    setActing(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this comment permanently?')) return
    setActing(id)
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) setComments(prev => prev.filter(c => c.id !== id))
    setActing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Comments</h1>
          <p className="mt-1 text-sm font-mono text-muted">{comments.length} shown</p>
        </div>
        {/* Status tabs */}
        <div className="flex border border-border">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-[0.08em] transition-colors capitalize ${
                tab === t ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {t}
              {t === 'spam' && tab !== 'spam' && spamCount > 0 && (
                <span className="ml-1.5 bg-breaking text-white text-[0.55rem] px-1 py-0.5 rounded-sm">
                  {spamCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'approved' && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-3 text-xs font-mono text-blue-700 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">ℹ</span>
          <span>
            Comments are auto-approved after OTP email verification. Use <strong>Mark Spam</strong> to hide suspicious ones — you can restore them anytime.
          </span>
        </div>
      )}

      <div className="bg-paper border border-border">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-3 bg-surface w-32 mb-2" />
                <div className="h-4 bg-surface w-3/4" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare size={32} className="text-border mb-3" />
            <p className="text-sm font-sans text-muted">
              {tab === 'spam' ? 'No spam comments.' : 'No comments yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {comments.map(c => {
              const nameKey = c.name?.toLowerCase().trim()
              const freq = nameCounts[nameKey] || 1
              const isFrequent = freq >= 3

              return (
                <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface transition-colors group">
                  <div className="flex-1 min-w-0">
                    {/* Status badge (all tab) */}
                    {tab === 'all' && (
                      <span className={`inline-block text-[0.55rem] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 mb-1.5 ${
                        c.status === 'spam'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {c.status}
                      </span>
                    )}
                    {/* Post link */}
                    {c.posts && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Link
                          to={`/post/${c.posts.slug}`}
                          target="_blank"
                          className="text-xs font-mono text-muted hover:text-ink transition-colors flex items-center gap-1 truncate"
                        >
                          {c.posts.title}
                          <ExternalLink size={10} className="shrink-0" />
                        </Link>
                      </div>
                    )}
                    {/* Author + date + frequency */}
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-sans font-medium text-ink">{c.name}</span>
                      <span className="text-xs font-mono text-muted">
                        {format(new Date(c.created_at), 'dd MMM yyyy · HH:mm')}
                      </span>
                      {isFrequent && (
                        <span className="text-[0.55rem] font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200">
                          {freq}× frequent
                        </span>
                      )}
                    </div>
                    {/* Content */}
                    <p className="text-sm font-sans text-muted leading-relaxed line-clamp-3">{c.content}</p>
                  </div>
                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === 'approved' && (
                      <button
                        onClick={() => handleMarkSpam(c.id)}
                        disabled={acting === c.id}
                        className="p-1.5 text-border hover:text-amber-600 transition-colors disabled:opacity-50"
                        title="Mark as spam"
                      >
                        <ShieldX size={15} />
                      </button>
                    )}
                    {c.status === 'spam' && (
                      <button
                        onClick={() => handleRestore(c.id)}
                        disabled={acting === c.id}
                        className="p-1.5 text-border hover:text-green-600 transition-colors disabled:opacity-50"
                        title="Restore comment"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={acting === c.id}
                      className="p-1.5 text-border hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete permanently"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
