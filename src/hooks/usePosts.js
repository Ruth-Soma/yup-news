import { useState, useEffect, useRef } from 'react'
import { getPosts } from '@/lib/queries'

export function usePosts({ page = 1, category, region, append = false } = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [count, setCount] = useState(0)
  const prevFilters = useRef({ category, region })

  useEffect(() => {
    const filtersChanged =
      prevFilters.current.category !== category ||
      prevFilters.current.region !== region
    prevFilters.current = { category, region }

    const shouldReplace = !append || page === 1 || filtersChanged

    if (shouldReplace) {
      setLoading(true)
      setPosts([])
    } else {
      setLoadingMore(true)
    }

    getPosts({ page, category, region }).then(({ data, error, totalPages, count }) => {
      if (error) {
        setError(error.message)
      } else {
        if (shouldReplace) {
          setPosts(data || [])
        } else {
          setPosts(prev => [...prev, ...(data || [])])
        }
        setTotalPages(totalPages)
        setCount(count || 0)
      }
      setLoading(false)
      setLoadingMore(false)
    })
  }, [page, category, region])

  return { posts, loading, loadingMore, error, totalPages, count }
}
