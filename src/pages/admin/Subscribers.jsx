import { useState, useEffect } from 'react'
import { Search, UserX, Users, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [count, setCount] = useState(0)
  const [unsubscribing, setUnsubscribing] = useState(null)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('subscribers')
      .select('id, email, created_at', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500)

    if (search) query = query.ilike('email', `%${search}%`)

    query.then(({ data, count }) => {
      setSubscribers(data || [])
      setCount(count || 0)
      setLoading(false)
    })
  }, [search])

  async function handleUnsubscribe(id) {
    if (!confirm('Mark this subscriber as inactive? They will no longer receive emails.')) return
    setUnsubscribing(id)
    await supabase.from('subscribers').update({ is_active: false }).eq('id', id)
    setSubscribers(prev => prev.filter(s => s.id !== id))
    setCount(c => c - 1)
    setUnsubscribing(null)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    setSearch(searchInput)
  }

  async function handleExportCSV() {
    // Fetch all active subscribers (no limit) for export
    const { data } = await supabase
      .from('subscribers')
      .select('email, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (!data?.length) return
    const header = 'email,subscribed_at'
    const rows = data.map(s => `${s.email},${new Date(s.created_at).toISOString()}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yup-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Subscribers</h1>
          <p className="mt-1 text-sm font-mono text-muted flex items-center gap-1.5">
            <Users size={12} />
            {count.toLocaleString()} active
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-mono text-muted hover:text-ink hover:border-ink transition-colors"
          title="Export as CSV"
        >
          <Download size={13} />
          Export CSV
        </button>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border border-border px-3 py-1.5">
          <Search size={14} className="text-muted shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search email..."
            className="text-sm font-sans bg-transparent outline-none w-44 placeholder-muted"
          />
        </form>
        </div>
      </div>

      <div className="bg-paper border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Email</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted hidden md:table-cell">Subscribed</th>
              <th className="px-4 py-3 w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3} className="px-4 py-3">
                    <div className="h-4 bg-surface animate-pulse rounded" />
                  </td>
                </tr>
              ))
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm font-sans text-muted">
                  {search ? 'No subscribers match your search.' : 'No active subscribers yet.'}
                </td>
              </tr>
            ) : (
              subscribers.map(sub => (
                <tr key={sub.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-sans text-ink">{sub.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-mono text-muted">
                      {format(new Date(sub.created_at), 'dd MMM yyyy')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleUnsubscribe(sub.id)}
                      disabled={unsubscribing === sub.id}
                      className="p-1.5 text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Unsubscribe"
                    >
                      <UserX size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
