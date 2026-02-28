import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { getFeeds, updateFeedStatus, createFeed, deleteFeed } from '@/lib/queries'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function staleness(lastFetched) {
  if (!lastFetched) return 'never'
  const hrs = (Date.now() - new Date(lastFetched).getTime()) / 3600000
  if (hrs < 2) return 'ok'
  if (hrs < 12) return 'warn'
  return 'stale'
}

export default function Feeds() {
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newFeed, setNewFeed] = useState({ name: '', url: '', region: 'global', category: 'world' })
  const [saving, setSaving] = useState(false)
  const [crawling, setCrawling] = useState(false)
  const [crawlMsg, setCrawlMsg] = useState('')

  function fetchFeeds() {
    setLoading(true)
    getFeeds().then(({ data }) => {
      setFeeds(data || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchFeeds() }, [])

  async function toggleFeed(id, is_active) {
    await updateFeedStatus(id, !is_active)
    setFeeds(f => f.map(feed => feed.id === id ? { ...feed, is_active: !is_active } : feed))
  }

  async function handleDelete(id) {
    if (!confirm('Remove this feed source?')) return
    await deleteFeed(id)
    setFeeds(f => f.filter(feed => feed.id !== id))
  }

  async function runCrawl() {
    setCrawling(true)
    setCrawlMsg('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/crawl-news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.newPosts !== undefined) {
        setCrawlMsg(`Done — ${data.newPosts} new post${data.newPosts !== 1 ? 's' : ''} added`)
        fetchFeeds() // refresh last_fetched timestamps
      } else {
        setCrawlMsg(data.error || 'Crawl triggered')
      }
    } catch {
      setCrawlMsg('Network error')
    }
    setCrawling(false)
  }

  async function handleAddFeed(e) {
    e.preventDefault()
    if (!newFeed.name || !newFeed.url) return
    setSaving(true)
    const { data, error } = await createFeed(newFeed)
    setSaving(false)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setFeeds(f => [...f, data])
      setNewFeed({ name: '', url: '', region: 'global', category: 'world' })
      setShowAdd(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Feed Sources</h1>
          <p className="mt-1 text-sm font-mono text-muted">{feeds.filter(f => f.is_active).length} active feeds</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {crawlMsg && (
            <span className="text-xs font-mono text-muted">{crawlMsg}</span>
          )}
          <Button variant="secondary" onClick={runCrawl} disabled={crawling}>
            <RefreshCw size={14} className={crawling ? 'animate-spin' : ''} />
            {crawling ? 'Crawling...' : 'Run Now'}
          </Button>
          <Button onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} />
            Add Feed
          </Button>
        </div>
      </div>

      {/* Add feed form */}
      {showAdd && (
        <form onSubmit={handleAddFeed} className="bg-paper border border-border p-5 space-y-4">
          <h3 className="font-serif font-bold text-lg text-ink">Add New Feed Source</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">Name</label>
              <input type="text" value={newFeed.name} onChange={e => setNewFeed(f => ({ ...f, name: e.target.value }))}
                placeholder="BBC World News" required
                className="w-full border border-border px-3 py-2 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">RSS URL</label>
              <input type="url" value={newFeed.url} onChange={e => setNewFeed(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..." required
                className="w-full border border-border px-3 py-2 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">Region</label>
              <select value={newFeed.region} onChange={e => setNewFeed(f => ({ ...f, region: e.target.value }))}
                className="w-full border border-border px-3 py-2 text-sm font-sans bg-paper text-ink focus:outline-none">
                <option value="global">World</option>
                <option value="us">United States</option>
                <option value="china">China</option>
                <option value="africa">Africa</option>
                <option value="asia">Asia</option>
                <option value="europe">Europe</option>
                <option value="americas">Americas</option>
                <option value="oceania">Oceania</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">Category</label>
              <input type="text" value={newFeed.category} onChange={e => setNewFeed(f => ({ ...f, category: e.target.value }))}
                placeholder="breaking-news"
                className="w-full border border-border px-3 py-2 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Feed'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Feeds table */}
      <div className="bg-paper border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Name</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted hidden md:table-cell">URL</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Region</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted hidden lg:table-cell">Last Fetched</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Active</th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-surface animate-pulse" /></td></tr>
              ))
            ) : feeds.map(feed => (
              <tr key={feed.id} className="hover:bg-surface/50">
                <td className="px-4 py-3 font-sans font-medium text-ink">{feed.name}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <a href={feed.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-muted hover:text-ink truncate max-w-[200px] block">
                    {feed.url}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-muted capitalize">{feed.region}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    {staleness(feed.last_fetched) === 'ok' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    )}
                    {staleness(feed.last_fetched) === 'warn' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                    {(staleness(feed.last_fetched) === 'stale' || staleness(feed.last_fetched) === 'never') && (
                      <AlertCircle size={12} className="text-red-400 shrink-0" />
                    )}
                    <span className={`text-xs font-mono ${
                      staleness(feed.last_fetched) === 'ok' ? 'text-muted' :
                      staleness(feed.last_fetched) === 'warn' ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {feed.last_fetched ? formatDate(feed.last_fetched) : 'Never'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleFeed(feed.id, feed.is_active)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      feed.is_active ? 'bg-ink' : 'bg-border'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                      feed.is_active ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(feed.id)}
                    className="p-1.5 text-muted hover:text-breaking transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
