import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { adminCreatePost } from '@/lib/queries'
import { generateSlug } from '@/lib/utils'
import { CATEGORIES, REGIONS } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Bold, Italic, Heading2, Quote, Upload } from 'lucide-react'

const DRAFT_KEY = 'yup_draft_new'

export default function NewPost() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [autoSavedAt, setAutoSavedAt] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    cover_image: '',
    category: 'breaking-news',
    region: 'global',
    tags: '',
    seo_title: '',
    seo_description: '',
    status: 'published',
    scheduled_at: '',
  })

  const editor = useEditor({
    extensions: [StarterKit, Image, Link],
    content: '<p>Start writing your article here...</p>',
    editorProps: {
      attributes: {
        class: 'article-body min-h-[300px] outline-none px-1',
      },
    },
  })

  // Restore draft on mount (only if there's a title saved)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
      if (saved?.form?.title && !draftRestored) {
        if (window.confirm('A draft was found. Restore it?')) {
          setForm(saved.form)
          if (editor && saved.content) editor.commands.setContent(saved.content)
          setDraftRestored(true)
        } else {
          localStorage.removeItem(DRAFT_KEY)
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = e => { e.preventDefault(); e.returnValue = '' }
    if (form.title.trim()) window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.title])

  // Auto-save every 5 seconds when form changes
  const autoSave = useCallback(() => {
    try {
      const content = editor?.getHTML() || ''
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, content, savedAt: Date.now() }))
      setAutoSavedAt(new Date())
    } catch {}
  }, [form, editor])

  useEffect(() => {
    if (!form.title.trim()) return
    const timer = setTimeout(autoSave, 5000)
    return () => clearTimeout(timer)
  }, [form, autoSave])

  const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')

    if (!ALLOWED_MIME.has(file.type)) {
      setUploadError('Only JPEG, PNG, WebP and GIF images are allowed.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be under 5 MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type]
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: false, contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from('covers').getPublicUrl(path)
      setForm(f => ({ ...f, cover_image: data.publicUrl }))
    } else {
      setUploadError('Upload failed: ' + error.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  function handleTitleChange(e) {
    const title = e.target.value
    setForm(f => ({
      ...f,
      title,
      slug: generateSlug(title),
      seo_title: title.substring(0, 60),
    }))
  }

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave(status) {
    setSaveError('')
    if (!form.title.trim()) { setSaveError('Title is required.'); return }
    setSaving(true)
    const content = editor?.getHTML() || ''
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []

    const { data, error } = await adminCreatePost({
      ...form,
      content,
      tags,
      is_auto_generated: false,
      status,
      published_at: form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : new Date().toISOString(),
    })

    setSaving(false)
    if (error) {
      setSaveError('Error saving post: ' + error.message)
    } else {
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/admin/posts/${data.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-ink">New Post</h1>
          {autoSavedAt && (
            <p className="text-[10px] font-mono text-muted mt-0.5">
              Draft auto-saved {autoSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveError && (
            <p className="text-xs font-mono text-red-600">{saveError}</p>
          )}
          <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving}>
            Save Draft
          </Button>
          <Button variant="secondary" onClick={() => {
            const content = editor?.getHTML() || ''
            localStorage.setItem('yup_preview', JSON.stringify({ ...form, content, published_at: new Date().toISOString() }))
            window.open('/preview', '_blank')
          }}>
            Preview
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {/* Title */}
          <div className="bg-paper border border-border p-5">
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Post headline..."
              className="w-full font-serif font-bold text-2xl text-ink bg-transparent outline-none placeholder-border"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Slug:</span>
              <input
                type="text"
                value={form.slug}
                onChange={set('slug')}
                className="text-xs font-mono text-muted bg-transparent outline-none border-b border-transparent hover:border-border focus:border-ink flex-1"
              />
            </div>
          </div>

          {/* Tiptap toolbar + editor */}
          <div className="bg-paper border border-border">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
              {[
                { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), label: 'Bold' },
                { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), label: 'Italic' },
                { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), label: 'H2' },
                { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), label: 'Quote' },
              ].map(({ icon: Icon, action, label }) => (
                <button
                  key={label}
                  onClick={action}
                  title={label}
                  className="p-1.5 text-muted hover:text-ink hover:bg-surface transition-colors"
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
            {/* Editor */}
            <div className="p-5">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-paper border border-border p-5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-2">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={set('excerpt')}
              rows={3}
              placeholder="Short summary (2-3 sentences)..."
              className="w-full text-sm font-sans text-ink bg-transparent outline-none resize-none placeholder-border"
            />
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Publish</h3>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">Status</label>
              <select value={form.status} onChange={set('status')}
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">
                Schedule (leave blank = now)
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={set('scheduled_at')}
                className="w-full border border-border px-2 py-1.5 text-xs font-mono bg-paper text-ink focus:outline-none focus:border-ink"
              />
              {form.scheduled_at && (
                <p className="text-[10px] font-mono text-muted mt-1">
                  Publishes {new Date(form.scheduled_at) > new Date() ? 'in the future' : 'immediately'}
                </p>
              )}
            </div>
          </div>

          {/* Category & Region */}
          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Categorize</h3>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">Category</label>
              <select value={form.category} onChange={set('category')}
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">Region</label>
              <select value={form.region} onChange={set('region')}
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink">
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
              <label className="text-xs font-mono text-muted block mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={set('tags')} placeholder="politics, us, senate"
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            </div>
          </div>

          {/* Cover image */}
          <div className="bg-paper border border-border p-5 space-y-2">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">Cover Image</h3>
            <input type="url" value={form.cover_image} onChange={set('cover_image')} placeholder="https://..."
              className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            <label className={`flex items-center gap-2 w-full border border-dashed border-border px-3 py-2 text-xs font-mono text-muted cursor-pointer hover:border-ink hover:text-ink transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : 'Upload from device'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {uploadError && (
              <p className="text-xs font-mono text-red-600">{uploadError}</p>
            )}
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover preview" className="w-full aspect-video object-cover mt-2" />
            )}
          </div>

          {/* SEO */}
          <div className="bg-paper border border-border p-5 space-y-3">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted">SEO</h3>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">SEO Title ({form.seo_title.length}/60)</label>
              <input type="text" value={form.seo_title} onChange={set('seo_title')} maxLength={60}
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted block mb-1">Meta Description ({form.seo_description.length}/155)</label>
              <textarea value={form.seo_description} onChange={set('seo_description')} rows={3} maxLength={155}
                className="w-full border border-border px-2 py-1.5 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink resize-none" />
            </div>
            {/* Preview */}
            <div className="border border-border p-3 bg-surface">
              <p className="text-xs text-blue-600 truncate">{form.slug || 'your-article-slug'}</p>
              <p className="text-sm font-medium text-blue-800 truncate">{form.seo_title || form.title || 'Article Title'}</p>
              <p className="text-xs text-muted line-clamp-2">{form.seo_description || 'Meta description will appear here...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
