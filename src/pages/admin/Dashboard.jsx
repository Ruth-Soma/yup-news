import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Eye, TrendingUp, Users, Send } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import StatsCard from '@/components/admin/StatsCard'
import { getDashboardStats, getTopPostsByViews, getViewsOverTime, getViewsByCountry, getVisitorIPs } from '@/lib/queries'
import { format, subDays } from 'date-fns'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPosts: 0, viewsToday: 0, postsToday: 0, subscribers: 0 })
  const [topPosts, setTopPosts] = useState([])
  const [viewsData, setViewsData] = useState([])
  const [locationData, setLocationData] = useState([])
  const [visitorIPs, setVisitorIPs] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsletterStatus, setNewsletterStatus] = useState('idle') // idle | sending | done | error
  const [newsletterMsg, setNewsletterMsg] = useState('')

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getTopPostsByViews(),
      getViewsOverTime(),
      getViewsByCountry(30),
      getVisitorIPs(100),
    ]).then(([statsRes, topRes, viewsRes, locRes, ipsRes]) => {
      setStats(statsRes)
      setTopPosts(topRes.data || [])

      // Group views by day
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i)
        return { date: format(d, 'MMM d'), count: 0, key: format(d, 'yyyy-MM-dd') }
      })
      ;(viewsRes.data || []).forEach(v => {
        const key = format(new Date(v.viewed_at), 'yyyy-MM-dd')
        const day = days.find(d => d.key === key)
        if (day) day.count++
      })
      setViewsData(days)
      setLocationData(locRes.data || [])
      setVisitorIPs(ipsRes.data || [])
      setLoading(false)
    })
  }, [])

  async function sendNewsletter() {
    if (newsletterStatus === 'sending') return
    setNewsletterStatus('sending')
    setNewsletterMsg('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success) {
        setNewsletterMsg(`Sent to ${data.sent} subscriber${data.sent !== 1 ? 's' : ''} · ${data.posts} stories included`)
        setNewsletterStatus('done')
      } else {
        setNewsletterMsg(data.error || 'Send failed.')
        setNewsletterStatus('error')
      }
    } catch {
      setNewsletterMsg('Network error.')
      setNewsletterStatus('error')
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Dashboard</h1>
          <p className="mt-1 text-sm font-mono text-muted">
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={sendNewsletter}
            disabled={newsletterStatus === 'sending'}
            className="flex items-center gap-2 bg-ink text-paper text-xs font-mono uppercase tracking-[0.1em] px-5 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <Send size={13} />
            {newsletterStatus === 'sending' ? 'Sending…' : 'Send Newsletter Now'}
          </button>
          {newsletterMsg && (
            <p className={`text-xs font-mono ${newsletterStatus === 'error' ? 'text-red-500' : 'text-muted'}`}>
              {newsletterMsg}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Posts" value={stats.totalPosts?.toLocaleString()} icon={FileText} />
        <StatsCard label="Views Today" value={stats.viewsToday?.toLocaleString()} icon={Eye} />
        <StatsCard label="Posted Today" value={stats.postsToday?.toLocaleString()} icon={TrendingUp} />
        <StatsCard label="Subscribers" value={stats.subscribers?.toLocaleString()} sub="Active" icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views over time */}
        <div className="bg-paper border border-border p-5">
          <h3 className="font-serif font-bold text-lg text-ink mb-4">Views — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <Tooltip
                contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 0, fontFamily: 'DM Sans' }}
              />
              <Line type="monotone" dataKey="count" stroke="#0A0A0A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top posts */}
        <div className="bg-paper border border-border p-5">
          <h3 className="font-serif font-bold text-lg text-ink mb-4">Top Posts by Views</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topPosts.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <YAxis
                type="category"
                dataKey="title"
                width={120}
                tick={{ fontSize: 10, fontFamily: 'DM Sans' }}
                tickFormatter={v => v?.substring(0, 18) + (v?.length > 18 ? '…' : '')}
              />
              <Tooltip contentStyle={{ border: '1px solid #E5E5E5', borderRadius: 0, fontFamily: 'DM Sans' }} />
              <Bar dataKey="views" fill="#0A0A0A" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Viewer Locations */}
      <div className="bg-paper border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-lg text-ink">Viewer Locations</h3>
          <span className="text-xs font-mono text-muted">Last 30 days</span>
        </div>
        {locationData.length === 0 ? (
          <p className="text-xs font-mono text-muted py-4 text-center">
            {loading ? 'Loading…' : 'No location data yet — views will appear here as readers visit from around the world.'}
          </p>
        ) : (
          <div className="space-y-2">
            {locationData.slice(0, 10).map((row, i) => {
              const max = locationData[0]?.view_count || 1
              const pct = Math.round((row.view_count / max) * 100)
              return (
                <div key={row.country_code + i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted w-5 text-right shrink-0">{i + 1}</span>
                  <span className="text-xs font-sans text-ink w-32 shrink-0 truncate">{row.country}</span>
                  <div className="flex-1 bg-g100 h-4 relative">
                    <div
                      className="h-4 bg-ink transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted w-10 text-right shrink-0">
                    {Number(row.view_count).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Top posts table */}
      <div className="bg-paper border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-ink">Most Read Stories</h3>
          <Link to="/admin/posts" className="text-xs font-mono text-muted hover:text-ink underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {topPosts.slice(0, 8).map((post, i) => (
            <div key={post.id} className="flex items-center gap-4 px-5 py-3">
              <span className="font-serif font-black text-xl text-border w-6 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <Link to={`/admin/posts/${post.id}`} className="text-sm font-sans font-medium text-ink hover:underline line-clamp-1">
                  {post.title}
                </Link>
                <p className="text-xs font-mono text-muted capitalize">{post.category?.replace(/-/g, ' ')}</p>
              </div>
              <span className="text-sm font-mono text-muted shrink-0">{post.views?.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visitor IPs */}
      <div className="bg-paper border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-ink">Visitor IPs</h3>
          <span className="text-xs font-mono text-muted">Recent 100 unique IPs · deduplicated</span>
        </div>
        {visitorIPs.length === 0 ? (
          <p className="text-xs font-mono text-muted py-6 text-center px-5">
            {loading ? 'Loading…' : 'No IP data yet — will populate as visitors arrive (new views only).'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-g100 text-left">
                  <th className="px-5 py-2 font-medium text-muted">#</th>
                  <th className="px-5 py-2 font-medium text-muted">IP Address</th>
                  <th className="px-5 py-2 font-medium text-muted">Country</th>
                  <th className="px-5 py-2 font-medium text-muted">Views</th>
                  <th className="px-5 py-2 font-medium text-muted">Last Seen</th>
                  <th className="px-5 py-2 font-medium text-muted hidden md:table-cell">Last Article</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visitorIPs.map((row, i) => (
                  <tr key={row.ip_address + i} className="hover:bg-g50 transition-colors">
                    <td className="px-5 py-2.5 text-muted">{i + 1}</td>
                    <td className="px-5 py-2.5 text-ink font-medium">{row.ip_address}</td>
                    <td className="px-5 py-2.5 text-muted">
                      {row.country_code && row.country_code !== 'XX' ? (
                        <span>{row.country || row.country_code}</span>
                      ) : (
                        <span className="text-g300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-ink">{Number(row.view_count).toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-muted">
                      {row.last_seen
                        ? new Date(row.last_seen).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-muted hidden md:table-cell max-w-[200px] truncate">
                      {row.sample_title || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
