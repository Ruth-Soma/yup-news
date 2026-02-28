import { useState, useEffect, useMemo } from 'react'
import { Send, RefreshCw, Mail, Users, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Button from '@/components/ui/Button'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://yup.ng'
const BRAND = import.meta.env.VITE_SITE_NAME || 'yup'

function buildEmailPreview(posts) {
  if (!posts.length) return '<p style="font-family:sans-serif;padding:32px;color:#666;">No posts to preview.</p>'
  const lead = posts[0]
  const secondary = posts.slice(1, 3)
  const rest = posts.slice(3, 7)
  const catLabel = cat => (cat || 'News').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const dateStr = format(new Date(), 'EEEE, MMMM d')

  const hero = lead ? `
    <tr><td style="background:#fff;padding:0;">
      ${lead.cover_image ? `<img src="${lead.cover_image}" width="600" style="width:100%;display:block;border:0;" />` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:32px 36px 28px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;color:#999;margin:0 0 14px;font-family:Arial,sans-serif;">${catLabel(lead.category)}</p>
        <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#1a1a1a;margin:0 0 12px;line-height:1.18;letter-spacing:-0.02em;">${lead.title}</h2>
        ${lead.excerpt ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 20px;line-height:1.7;">${lead.excerpt}</p>` : ''}
        <span style="display:inline-block;background:#1a1a1a;color:#f0ede6;font-family:Arial,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;text-decoration:none;padding:11px 22px;">Read Full Story →</span>
      </td></tr></table>
    </td></tr>` : ''

  const sec = secondary.length ? `
    <tr><td style="height:1px;background:#e2dfd7;font-size:0;">&nbsp;</td></tr>
    <tr><td style="background:#fff;padding:0 36px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${secondary.map((p, i) => `
          <td width="50%" valign="top" style="padding:28px ${i === 0 ? '20px 20px 20px 0' : '0 0 20px 20px'};">
            ${p.cover_image ? `<img src="${p.cover_image}" width="248" style="width:100%;display:block;border:0;margin-bottom:14px;" />` : ''}
            <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#999;margin:0 0 8px;">${catLabel(p.category)}</p>
            <h3 style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;line-height:1.3;">${p.title}</h3>
            ${p.excerpt ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:0;line-height:1.6;">${p.excerpt.substring(0, 100)}${p.excerpt.length > 100 ? '…' : ''}</p>` : ''}
          </td>`).join('<td width="1" style="background:#e2dfd7;font-size:0;">&nbsp;</td>')}
      </tr></table>
    </td></tr>` : ''

  const restRows = rest.length ? `
    <tr><td style="height:1px;background:#e2dfd7;font-size:0;">&nbsp;</td></tr>
    <tr><td style="background:#f7f6f2;padding:8px 0;">
      ${rest.map(p => `
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding:20px 36px;border-bottom:1px solid #e2dfd7;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top" style="padding-right:16px;">
                <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#999;margin:0 0 6px;">${catLabel(p.category)}</p>
                <h4 style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#1a1a1a;margin:0 0 5px;line-height:1.35;">${p.title}</h4>
                ${p.source_name ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin:0;">${p.source_name}</p>` : ''}
              </td>
              ${p.cover_image ? `<td valign="top" width="88"><img src="${p.cover_image}" width="88" height="60" style="width:88px;height:60px;object-fit:cover;display:block;border:0;" /></td>` : ''}
            </tr></table>
          </td>
        </tr></table>`).join('')}
    </td></tr>` : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ede6;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#1a1a1a;padding:28px 36px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td><span style="font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#f0ede6;letter-spacing:-0.03em;">${BRAND}</span></td>
            <td align="right" valign="middle"><span style="font-family:Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:rgba(240,237,230,0.45);">${dateStr}</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#1a1a1a;padding:0 36px 28px;">
          <p style="font-family:Georgia,serif;font-size:15px;color:rgba(240,237,230,0.55);margin:0;font-style:italic;">Your daily briefing — the stories that matter, nothing that doesn't.</p>
        </td></tr>
        ${hero}${sec}${restRows}
        <tr><td style="height:1px;background:#e2dfd7;font-size:0;">&nbsp;</td></tr>
        <tr><td style="background:#fff;padding:28px 36px;" align="center">
          <span style="display:inline-block;border:1px solid #1a1a1a;color:#1a1a1a;font-family:Arial,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;padding:12px 28px;">Read More at ${SITE_URL.replace('https://', '')} →</span>
        </td></tr>
        <tr><td style="background:#1a1a1a;padding:24px 36px;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(240,237,230,0.35);margin:0 0 6px;line-height:1.6;">© ${new Date().getFullYear()} YUP Media Ltd. AI-assisted journalism.</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(240,237,230,0.25);margin:0;line-height:1.6;">You're receiving this because you subscribed at ${SITE_URL.replace('https://', '')}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Newsletter() {
  const [posts, setPosts] = useState([])
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const previewHtml = useMemo(() => buildEmailPreview(posts), [posts])

  useEffect(() => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    Promise.all([
      supabase
        .from('posts')
        .select('id, title, slug, excerpt, cover_image, category, published_at')
        .eq('status', 'published')
        .gte('published_at', since)
        .order('published_at', { ascending: false })
        .limit(7),
      supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ]).then(([postsRes, subsRes]) => {
      setPosts(postsRes.data || [])
      setSubscriberCount(subsRes.count || 0)
      setLoading(false)
    })
  }, [])

  async function handleSend() {
    if (!window.confirm(`Send the daily briefing to ${subscriberCount?.toLocaleString()} subscribers?`)) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ success: false, error: err.message })
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Newsletter</h1>
          <p className="mt-1 text-sm font-mono text-muted">Daily briefing to all subscribers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowPreview(v => !v)} disabled={posts.length === 0}>
            {showPreview ? <><EyeOff size={14} /> Hide Preview</> : <><Eye size={14} /> Preview Email</>}
          </Button>
          <Button onClick={handleSend} disabled={sending || posts.length === 0}>
            {sending ? (
              <><RefreshCw size={14} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={14} /> Send Daily Briefing</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-paper border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-muted" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Subscribers</span>
          </div>
          <p className="text-2xl font-serif font-bold text-ink">
            {subscriberCount === null ? '—' : subscriberCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-paper border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={14} className="text-muted" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Posts in briefing</span>
          </div>
          <p className="text-2xl font-serif font-bold text-ink">{loading ? '—' : posts.length}</p>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`border p-4 text-sm font-sans ${result.success ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
          {result.success ? (
            <p><strong>{result.sent}</strong> emails sent{result.failed > 0 ? `, ${result.failed} failed` : ''}. {result.posts} posts included.</p>
          ) : (
            <p>Send failed: {result.error}</p>
          )}
          {result.logs?.length > 0 && (
            <ul className="mt-2 text-xs font-mono space-y-0.5 text-green-700">
              {result.logs.map((log, i) => <li key={i}>· {log}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Email HTML preview */}
      {showPreview && (
        <div className="bg-paper border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Email Preview (rendered HTML)
            </span>
            <span className="text-[10px] font-mono text-muted">600px wide · exact email layout</span>
          </div>
          <div className="p-4 bg-surface">
            <iframe
              srcDoc={previewHtml}
              title="Email preview"
              className="w-full border-0 rounded"
              style={{ height: '700px', maxWidth: '640px', display: 'block', margin: '0 auto' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Post list preview */}
      <div className="bg-paper border border-border">
        <div className="px-5 py-3 border-b border-border">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Posts included (last 24 hours)
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse">
                <div className="h-3 bg-surface w-24 mb-2" />
                <div className="h-4 bg-surface w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-sans text-muted">No posts published in the last 24 hours.</p>
            <p className="text-xs font-mono text-border mt-1">The briefing will not send without posts.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post, i) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4">
                <span className="font-serif font-black text-[1.1rem] text-border w-5 shrink-0 pt-0.5">{i + 1}</span>
                {post.cover_image && (
                  <img src={post.cover_image} alt="" className="w-16 h-10 object-cover shrink-0 hidden sm:block" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-muted block mb-0.5">
                    {post.category?.replace(/-/g, ' ')}
                  </span>
                  <p className="text-sm font-sans font-medium text-ink line-clamp-1">{post.title}</p>
                  {post.excerpt && (
                    <p className="text-xs font-sans text-muted line-clamp-1 mt-0.5">{post.excerpt}</p>
                  )}
                </div>
                <span className="text-xs font-mono text-border shrink-0">
                  {format(new Date(post.published_at), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
