import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { adminGetPost, adminUpdatePost } from '@/lib/queries'
import { generateSlug } from '@/lib/utils'
import { CATEGORIES } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Bold, Italic, Heading2, Quote, Upload } from 'lucide-react'

export default function EditPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [autoSavedAt, setAutoSavedAt] = useState(null)
  const [uploading, setUploading] = useState(false)
  const isFirstLoad = useRef(true)
  const isDirty = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: '',
    editorProps: {
      attributes: { class: 'article-body min-h-[300px] outline-none px-1' },
    },
  })

  useEffect(() => {
    adminGetPost(id).then(({ data }) => {
      if (data) {
        const localDt = data.published_at
          ? new Date(data.published_at).toISOString().slice(0, 16)
          : ''
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          cover_image: data.cover_image || '',
          category: data.category || 'breaking-news',
          region: data.region || 'global',
          tags: data.tags?.join(', ') || '',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          status: data.status || 'published',
          published_at: localDt,
        })
        editor?.commands.setContent(data.content || '')
      }
      setLoading(false)
    })
  }, [id, editor])

  // Auto-save to localStorage 5s after any form change (skip very first load)
  const autoSave = useCallback(() => {
    if (!form) return
    try {
      const content = editor?.getHTML() || ''
      localStorage.setItem(`yup_draft_${id}`, JSON.stringify({ form, content, savedAt: Date.now() }))
      setAutoSavedAt(new Date())
    } catch {}
  }, [form, editor, id])

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return }
    isDirty.current = true
    const timer = setTimeout(autoSave, 5000)
    return () => clearTimeout(timer)
  }, [form, autoSave])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = e => {
      if (!isDirty.current) return
      e.preventDefault(); e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: false })
    if (!error) {
      const { data } = supabase.storage.from('covers').getPublicUrl(path)
      setForm(f => ({ ...f, cover_image: data.publicUrl }))
    } else {
      alert('Upload failed: ' + error.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave() {
    if (!form?.title?.trim()) return alert('Title is required')
    setSaving(true)
    const content = editor?.getHTML() || ''
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { error } = await adminUpdatePost(id, {
      ...form,
      content,
      tags,
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      isDirty.current = false
      try { localStorage.removeItem(`yup_draft_${id}`) } catch {}
    }
  }

  if (loading || !form) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface w-1/3" />
        <div className="h-64 bg-surface" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">Edit Post</h1>
          {autoSavedAt && (
            <p className="text-[10px] font-mono text-muted mt-0.5">
              Draft auto-saved {autoSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/admin/posts')}>Cancel</Button>
          <Button variant="secondary" onClick={() => window.open(`/post/${form.slug}`, '_blank')}>
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="bg-paper border border-border p-5">
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full font-serif font-bold text-2xl text-ink bg-transparent outline-none placeholder-border"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Slug:</span>
              <input type="text" value={form.slug} onChange={set('slug')}
                className="text-xs font-mono text-muted bg-transparent outline-none border-b border-transparent hover:border-border focus:border-ink flex-1" />
            </div>
          </div>

          <div className="bg-paper border border-border">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
              {[
                { icon: Bold, action: () => editor?.chain().focus().toggleBold().run() },
                { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run() },
                { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
                { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run() },
              ].map(({ icon: Icon, action }, i) => (
                <button key={i} onClick={action} className="p-1.5 text-muted hover:text-ink hover:bg-surface">
                  <Icon size={15} />
                </button>
              ))}
            </div>
            <div className="p-5">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="bg-paper border border-border p-5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-2">Excerpt</label>
            <textarea value={form.excerpt} onChange={set('excerpt')} rows={3}
              className="w-full text-sm font-sans text-ink bg-transparent outline-none resize-none" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Status</h3>
            <select value={form.status} onChange={set('status')}
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">Publish Date</label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={set('published_at')}
                className="w-full border border-border px-2 py-1.5 text-xs font-mono bg-paper text-ink focus:outline-none focus:border-ink"
              />
              {form.published_at && new Date(form.published_at) > new Date() && (
                <p className="text-[10px] font-mono text-muted mt-1">Scheduled — not yet visible publicly</p>
              )}
            </div>
          </div>

          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Categorize</h3>
            <select value={form.category} onChange={set('category')}
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={form.region} onChange={set('region')}
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none">
              <option value="global">World</option>
              <option value="us">United States</option>
              <option value="china">China</option>
              <option value="africa">Africa</option>
              <option value="asia">Asia</option>
              <option value="europe">Europe</option>
              <option value="americas">Americas</option>
              <option value="oceania">Oceania</option>
            </select>
            <input type="text" value={form.tags} onChange={set('tags')} placeholder="tag1, tag2"
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none" />
          </div>

          <div className="bg-paper border border-border p-5 space-y-2">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Cover Image</h3>
            <input type="url" value={form.cover_image} onChange={set('cover_image')}
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none" />
            <label className={`flex items-center gap-2 w-full border border-dashed border-border px-3 py-2 text-xs font-mono text-muted cursor-pointer hover:border-ink hover:text-ink transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload from device'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover" className="w-full aspect-video object-cover mt-2" />
            )}
          </div>

          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">SEO</h3>
            <input type="text" value={form.seo_title} onChange={set('seo_title')} maxLength={60}
              placeholder="SEO title (max 60 chars)"
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none" />
            <textarea value={form.seo_description} onChange={set('seo_description')} rows={3} maxLength={155}
              placeholder="Meta description (max 155 chars)"
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none resize-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
