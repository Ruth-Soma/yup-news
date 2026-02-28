import { formatDistanceToNow, format } from 'date-fns'

export function timeAgo(dateString) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

export function formatDate(dateString) {
  return format(new Date(dateString), 'MMM d, yyyy')
}

export function formatDateTime(dateString) {
  return format(new Date(dateString), 'MMM d, yyyy · h:mm a')
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80)
}

export function readingTime(content) {
  const words = content?.replace(/<[^>]+>/g, '').split(/\s+/).length || 0
  const mins = Math.ceil(words / 200)
  return `${mins} min read`
}

export function truncate(str, length = 120) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

// Category-specific dark gradient SVG placeholder — always renders, never breaks
export function placeholderImage(category = '') {
  const cat = (category || '').toLowerCase().replace(/-/g, ' ')
  const schemes = {
    finance:       ['#0d1b2a', '#1b2f3e'],
    markets:       ['#0d1b2a', '#1b2f3e'],
    crypto:        ['#0d0d1a', '#1a1a2e'],
    technology:    ['#0a1628', '#162032'],
    tech:          ['#0a1628', '#162032'],
    politics:      ['#1a0e0e', '#2a1515'],
    sports:        ['#0a1a0a', '#122012'],
    business:      ['#1a1200', '#2a1e00'],
    world:         ['#0a0d1a', '#121828'],
    'breaking news': ['#1a0a0a', '#2a1010'],
    health:        ['#0a1a12', '#12201a'],
    entertainment: ['#1a0a1a', '#2a1228'],
  }
  const [c1, c2] = schemes[cat] || ['#111111', '#1e1e1e']
  const label = cat ? cat.toUpperCase() : 'NEWS'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="450" fill="url(#bg)"/><text x="400" y="208" text-anchor="middle" fill="rgba(255,255,255,0.1)" font-family="Georgia,serif" font-size="80" font-weight="bold">yup</text><text x="400" y="256" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-family="monospace" font-size="12" letter-spacing="6">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const REGIONS = [
  { value: 'all',           label: 'All' },
  { value: 'us',            label: 'United States' },
  { value: 'china',         label: 'China' },
  { value: 'africa',        label: 'Africa' },
  { value: 'antarctica',    label: 'Antarctica' },
  { value: 'asia',          label: 'Asia' },
  { value: 'oceania',       label: 'Australia / Oceania' },
  { value: 'europe',        label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'south-america', label: 'South America' },
  { value: 'global',        label: 'World' },
]

// Convert ISO 3166-1 alpha-2 code to flag emoji  e.g. "NG" → "🇳🇬"
export function flagEmoji(code) {
  if (!code || code.length !== 2) return ''
  return Array.from(code.toUpperCase())
    .map(c => String.fromCodePoint(c.charCodeAt(0) + 0x1F1A5))
    .join('')
}

// Infer country info from a post — returns { code, name } or null.
// Uses country_code/country fields first, then falls back to the region field
// so that older posts without explicit country data still show a flag.
const _REGION_COUNTRY = {
  'us':            { code: 'US', name: 'United States' },
  'united-states': { code: 'US', name: 'United States' },
  'china':         { code: 'CN', name: 'China' },
  'uk':            { code: 'GB', name: 'United Kingdom' },
  'europe':        { code: 'EU', name: 'Europe' },
  'russia':        { code: 'RU', name: 'Russia' },
}

export function countryInfoFromPost(post) {
  if (post?.country_code) return { code: post.country_code, name: post.country || '' }
  const r = (post?.region || '').toLowerCase()
  return _REGION_COUNTRY[r] || null
}

export const CATEGORIES = [
  { value: 'breaking-news', label: 'Breaking' },
  { value: 'politics', label: 'Politics' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Markets' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'technology', label: 'Tech' },
  { value: 'sports', label: 'Sports' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'world', label: 'World' },
]
