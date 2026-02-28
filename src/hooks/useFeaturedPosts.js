import { useState, useEffect } from 'react'
import { getFeaturedCandidates } from '@/lib/queries'

// Randomly pick n items from an array — different result every call
function pickRandom(arr, n = 1) {
  if (!arr.length) return []
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export function useFeaturedPosts() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interests = JSON.parse(localStorage.getItem('yup_interests') || '{}')
    const topCategory = Object.entries(interests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    getFeaturedCandidates(topCategory).then(({ breaking, related, fresh, world }) => {
      const seen = new Set()
      const results = []

      const add = (pool, n, label) => {
        for (const p of pickRandom(pool, n)) {
          if (!seen.has(p.id)) { seen.add(p.id); results.push({ ...p, _label: label }) }
        }
      }

      add(breaking, 2, 'breaking') // up to 2 random breaking news items
      add(related,  2, 'for-you')  // up to 2 random from user's interest category
      add(fresh,    2, 'latest')   // up to 2 random freshly published posts
      add(world,    1, 'world')    // 1 random popular world post

      setCandidates(results)
      setLoading(false)
    })
  }, [])

  return { candidates, loading }
}
