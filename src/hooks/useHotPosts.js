import { useState, useEffect } from 'react'
import { getHotPosts } from '@/lib/queries'

// Like usePosts but ordered by hot score (recency × popularity blend).
// Used on the home feed. Category/region pages keep pure date order.
export function useHotPosts({ page = 1 } = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (page === 1) {
      setLoading(true)
      setPosts([])
    } else {
      setLoadingMore(true)
    }

    getHotPosts({ page }).then(({ data, error, totalPages }) => {
      if (error) {
        setError(error.message)
      } else {
        if (page === 1) {
          setPosts(data || [])
        } else {
          setPosts(prev => [...prev, ...(data || [])])
        }
        setTotalPages(totalPages)
      }
      setLoading(false)
      setLoadingMore(false)
    })
  }, [page])

  return { posts, loading, loadingMore, error, totalPages }
}
