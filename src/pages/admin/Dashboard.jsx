import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Eye, TrendingUp, Users, Send } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import StatsCard from '@/components/admin/StatsCard'
import { getDashboardStats, getTopPostsByViews, getViewsOverTime } from '@/lib/queries'
import { format, subDays } from 'date-fns'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPosts: 0, viewsToday: 0, postsToday: 0, subscribers: 0 })
  const [topPosts, setTopPosts] = useState([])
  const [viewsData, setViewsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsletterStatus, setNewsletterStatus] = useState('idle') // idle | sending | done | error
  const [newsletterMsg, setNewsletterMsg] = useState('')

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getTopPostsByViews(),
      getViewsOverTime(),
    ]).then(([statsRes, topRes, viewsRes]) => {
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
    </div>
  )
}
