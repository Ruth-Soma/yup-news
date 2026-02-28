/**
 * fix-all-cover-images.mjs
 * Replaces all untrusted/bad cover images across all posts with Pexels images.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://clxwyydoeodozndyfkkv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHd5eWRvZW9kb3puZHlma2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyOTY5MiwiZXhwIjoyMDg3NzA1NjkyfQ.l9snWazlv_TX6UGmNsr4iga6VX6r368a_fQY-TGQGWc'
const PEXELS_KEY = 'fkOeRCCFnT2wJUKosgkQGd38RrwHCPmMT1ycImO7PyaedT1g2Dota5G3'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Domains that are reliable and hotlink-friendly — keep these as-is
const TRUSTED_HOSTS = [
  'images.pexels.com',
  'ichef.bbci.co.uk',
  'i.guim.co.uk',
  'media.guim.co.uk',
  'static.reuters.com',
  'cdn.cnn.com',
  'apnews.brightspotcdn.com',
  'dims.apnews.com',
  'gdb.voanews.com',
  'images.unsplash.com',
  'upload.wikimedia.org',
  'cdn.pixabay.com',
  'live-production.wcms.abc-cdn.net.au',
  'res.cloudinary.com',
  'cloudfront-us-east-2.images.arcpublishing.com',
  's.abcnews.com',
]

function isTrusted(url) {
  if (!url) return false
  if (url.includes('loremflickr') || url.includes('picsum')) return false
  try {
    const { hostname, search } = new URL(url)
    if (search.includes('width=140')) return false
    return TRUSTED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))
  } catch { return false }
}

const STOP = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','has','have','had','as','it','its','this','that','from','will','be',
  'been','can','could','would','should','says','said','new','amid','just','over','after','before',
  'about','into','how','why','what','when','where','who','which','during','than','us','uk'])

function buildQuery(post) {
  // Use seo_title or tags if available, otherwise derive from title
  if (post.tags?.length >= 2) return post.tags.slice(0, 3).join(' ')
  const words = (post.seo_title || post.title).replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
  return words.slice(0, 4).join(' ')
}

async function fetchPexels(query) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(7000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.photos?.[Math.floor(Math.random() * Math.min(data.photos?.length || 0, 5))]
    return photo?.src?.large2x || photo?.src?.large || null
  } catch { return null }
}

async function main() {
  // Fetch all published posts
  let all = [], from = 0
  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, seo_title, tags, cover_image')
      .eq('status', 'published')
      .range(from, from + 199)
    if (error) { console.error(error.message); break }
    if (!data?.length) break
    all = all.concat(data)
    if (data.length < 200) break
    from += 200
  }

  const bad = all.filter(p => !isTrusted(p.cover_image))
  console.log(`Total posts: ${all.length}  |  Need fixing: ${bad.length}\n`)

  let fixed = 0, failed = 0

  for (let i = 0; i < bad.length; i++) {
    const post = bad[i]
    const query = buildQuery(post)
    process.stdout.write(`[${i + 1}/${bad.length}] ${post.title.substring(0, 50).padEnd(52)} `)

    if (!query.trim()) {
      process.stdout.write('SKIP (no query)\n')
      failed++
      continue
    }

    const url = await fetchPexels(query)
    if (!url) {
      process.stdout.write('SKIP (Pexels no result)\n')
      failed++
      await new Promise(r => setTimeout(r, 300))
      continue
    }

    const { error } = await supabase.from('posts').update({ cover_image: url }).eq('id', post.id)
    if (error) {
      process.stdout.write(`FAIL: ${error.message}\n`)
      failed++
    } else {
      process.stdout.write(`OK\n`)
      fixed++
    }

    // ~3 posts/sec — stay well within Pexels rate limit
    await new Promise(r => setTimeout(r, 350))
  }

  console.log(`\nDone. Fixed: ${fixed}  Failed/skipped: ${failed}`)
}

main().catch(console.error)
