import { useState, useEffect } from 'react'
import { getFeaturedCandidates } from '@/lib/queries'

// Search keyword → YUP category mapping (seeds For You before any browsing history exists)
const KEYWORD_CATEGORY = {
  stock: 'finance', stocks: 'finance', market: 'finance', markets: 'finance',
  trading: 'finance', invest: 'finance', investment: 'finance', forex: 'finance',
  gold: 'finance', oil: 'finance', economy: 'finance', inflation: 'finance',
  dow: 'finance', nasdaq: 'finance', interest: 'finance',
  bitcoin: 'crypto', ethereum: 'crypto', crypto: 'crypto', cryptocurrency: 'crypto',
  blockchain: 'crypto', nft: 'crypto', defi: 'crypto', btc: 'crypto',
  ai: 'technology', tech: 'technology', technology: 'technology',
  apple: 'technology', google: 'technology', microsoft: 'technology', elon: 'technology',
  tesla: 'technology', openai: 'technology', chatgpt: 'technology',
  election: 'politics', president: 'politics', government: 'politics', congress: 'politics',
  senate: 'politics', trump: 'politics', democrat: 'politics', republican: 'politics',
  vote: 'politics', policy: 'politics', minister: 'politics',
  nba: 'sports', nfl: 'sports', soccer: 'sports', football: 'sports', basketball: 'sports',
  tennis: 'sports', golf: 'sports', olympics: 'sports', fifa: 'sports', cricket: 'sports',
  business: 'business', startup: 'business', ceo: 'business', merger: 'business',
  ipo: 'business', earnings: 'business', acquisition: 'business',
  health: 'health', medical: 'health', hospital: 'health', vaccine: 'health',
  disease: 'health', cancer: 'health', nutrition: 'health',
  movie: 'entertainment', film: 'entertainment', music: 'entertainment', celebrity: 'entertainment',
  netflix: 'entertainment', oscar: 'entertainment', grammy: 'entertainment',
  breaking: 'breaking-news', explosion: 'breaking-news', attack: 'breaking-news',
  war: 'world', conflict: 'world', crisis: 'world',
}

// On first session load: read Google/Bing/DDG referrer and seed interests
function seedFromReferrer() {
  try {
    if (sessionStorage.getItem('yup_entry_seeded')) return
    sessionStorage.setItem('yup_entry_seeded', '1')
    const ref = document.referrer
    if (!ref) return
    const isSearch = ref.includes('google.') || ref.includes('bing.') || ref.includes('duckduckgo.') || ref.includes('yahoo.')
    if (!isSearch) return
    const q = new URL(ref).searchParams.get('q') || ''
    if (!q) return
    const interests = JSON.parse(localStorage.getItem('yup_interests') || '{}')
    for (const word of q.toLowerCase().split(/\W+/)) {
      const cat = KEYWORD_CATEGORY[word]
      if (cat) interests[cat] = (interests[cat] || 0) + 3
    }
    localStorage.setItem('yup_interests', JSON.stringify(interests))
  } catch {}
}

// Randomly pick n items from an array — different result every call
function pickRandom(arr, n = 1) {
  if (!arr.length) return []
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

export function useFeaturedPosts() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedFromReferrer()

    const interests = JSON.parse(localStorage.getItem('yup_interests') || '{}')
    const topCategory = Object.entries(interests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // Top country from click history (ISO 3166-1 alpha-2 code)
    const countryInterests = JSON.parse(localStorage.getItem('yup_country_interests') || '{}')
    const topCountry = Object.entries(countryInterests).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // Read continent from geo detection (set by useGeoRegion via sessionStorage)
    let geoRegion = null
    try {
      const geo = JSON.parse(sessionStorage.getItem('yup_geo') || '{}')
      geoRegion = geo.continent || null
    } catch {}

    getFeaturedCandidates(topCategory, geoRegion, topCountry).then(({ breaking, related, fresh, world, geo, countryPosts }) => {
      const seen = new Set()
      const results = []
      const add = (pool, n, label) => {
        for (const p of pickRandom(pool, n)) {
          if (!seen.has(p.id)) { seen.add(p.id); results.push({ ...p, _label: label }) }
        }
      }

      add(breaking,      2, 'breaking') // up to 2 breaking news
      add(countryPosts,  2, 'for-you')  // up to 2 from user's most-read country (highest signal)
      add(related,       2, 'for-you')  // up to 2 from user's top interest category
      add(geo,           1, 'for-you')  // up to 1 from user's home continent
      add(fresh,         2, 'latest')   // up to 2 freshly published posts
      add(world,         1, 'world')    // 1 popular world post

      setCandidates(results)
      setLoading(false)
    })
  }, [])

  return { candidates, loading }
}
