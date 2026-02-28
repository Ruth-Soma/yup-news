import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Eye, Copy } from 'lucide-react'
import { StatusBadge, AIBadge } from '@/components/ui/Badge'
import { adminGetPosts, adminDeletePost, adminBulkUpdateStatus, adminDuplicatePost } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
]

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selected, setSelected] = useState([])

  function fetchPosts() {
    setLoading(true)
    adminGetPosts({ page, status: filter, search }).then(({ data, count, totalPages }) => {
      setPosts(data || [])
      setCount(count || 0)
      setTotalPages(totalPages)
      setLoading(false)
    })
  }

  useEffect(() => { fetchPosts() }, [page, filter, search])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id])
  }

  function selectAll() {
    setSelected(selected.length === posts.length ? [] : posts.map(p => p.id))
  }

  async function bulkPublish() {
    if (!selected.length) return
    await adminBulkUpdateStatus(selected, 'published')
    setSelected([])
    fetchPosts()
  }

  async function bulkArchive() {
    if (!selected.length) return
    await adminBulkUpdateStatus(selected, 'archived')
    setSelected([])
    fetchPosts()
  }

  async function bulkDelete() {
    if (!selected.length) return
    if (!confirm(`Permanently delete ${selected.length} post${selected.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    await supabase.from('posts').delete().in('id', selected)
    setSelected([])
    fetchPosts()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await adminDeletePost(id)
    fetchPosts()
  }

  async function handleDuplicate(id) {
    const { data } = await adminDuplicatePost(id)
    if (data?.id) fetchPosts()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Posts</h1>
          <p className="mt-1 text-sm font-mono text-muted">{count?.toLocaleString()} total</p>
        </div>
        <Link to="/admin/posts/new">
          <Button>
            <Plus size={14} />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex gap-0 border border-border overflow-hidden">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors ${
                filter === f.value ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 border border-border px-3 py-1.5">
          <Search size={14} className="text-muted shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search posts..."
            className="text-sm font-sans bg-transparent outline-none w-48 placeholder-muted"
          />
        </form>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-surface border border-border">
          <span className="text-sm font-mono text-muted">{selected.length} selected</span>
          <Button variant="secondary" size="sm" onClick={bulkPublish}>Publish</Button>
          <Button variant="secondary" size="sm" onClick={bulkArchive}>Archive</Button>
          <button
            onClick={bulkDelete}
            className="text-xs font-mono text-red-500 hover:text-red-700 transition-colors border border-red-200 px-2 py-1 hover:bg-red-50"
          >
            Delete
          </button>
          <button onClick={() => setSelected([])} className="text-xs font-mono text-muted hover:text-ink ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-paper border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.length === posts.length && posts.length > 0}
                  onChange={selectAll}
                  className="accent-ink"
                />
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Title</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted">Status</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-muted hidden xl:table-cell">Views</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-surface animate-pulse rounded" />
                  </td>
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm font-sans text-muted">
                  No posts found.
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="accent-ink"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/posts/${post.id}`} className="font-sans font-medium text-ink hover:underline line-clamp-1 max-w-xs">
                        {post.title}
                      </Link>
                      {post.is_auto_generated && <AIBadge />}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-mono text-muted capitalize">{post.category?.replace(/-/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={
                      post.status === 'published' && new Date(post.published_at) > new Date()
                        ? 'scheduled'
                        : post.status
                    } />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-mono text-muted">{formatDate(post.published_at)}</span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-right">
                    <span className="text-xs font-mono text-muted">{(post.views || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a
                        href={`/post/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted hover:text-ink transition-colors"
                        title="View post"
                      >
                        <Eye size={14} />
                      </a>
                      <Link to={`/admin/posts/${post.id}`} className="p-1.5 text-muted hover:text-ink transition-colors" title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(post.id)}
                        className="p-1.5 text-muted hover:text-ink transition-colors"
                        title="Duplicate as draft"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-muted hover:text-breaking transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs font-mono text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs font-mono border border-border disabled:opacity-30 hover:bg-surface">
                Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs font-mono border border-border disabled:opacity-30 hover:bg-surface">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
