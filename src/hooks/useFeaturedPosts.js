import { useState, useEffect } from 'react'
import { getFeaturedCandidates } from '@/lib/queries'

export function useFeaturedPosts() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read the user's most-visited category from the interest tracker
    const interests = JSON.parse(localStorage.getItem('yup_interests') || '{}')
    const topCategory = Object.entries(interests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    getFeaturedCandidates(topCategory).then(({ breaking, related, world }) => {
      const seen = new Set()
      const results = []

      for (const p of breaking) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push({ ...p, _label: 'breaking' }) }
      }
      for (const p of related) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push({ ...p, _label: 'for-you' }) }
      }
      for (const p of world) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push({ ...p, _label: 'world' }) }
      }

      setCandidates(results)
      setLoading(false)
    })
  }, [])

  return { candidates, loading }
}
