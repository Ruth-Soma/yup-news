import { useState, useCallback } from 'react'

const KEY = 'yup_bookmarks'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(load)

  const isBookmarked = useCallback(
    (id) => bookmarks.some(b => b.id === id),
    [bookmarks]
  )

  const toggle = useCallback((post) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === post.id)
      const next = exists
        ? prev.filter(b => b.id !== post.id)
        : [{ id: post.id, title: post.title, slug: post.slug, cover_image: post.cover_image, category: post.category, published_at: post.published_at }, ...prev]
      save(next)
      return next
    })
  }, [])

  const remove = useCallback((id) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.id !== id)
      save(next)
      return next
    })
  }, [])

  return { bookmarks, isBookmarked, toggle, remove }
}
