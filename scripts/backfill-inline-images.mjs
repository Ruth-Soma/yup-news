/**
 * backfill-inline-images.mjs
 * Injects inline Pexels images into existing article bodies that don't have them.
 * Run: node scripts/backfill-inline-images.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://clxwyydoeodozndyfkkv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHd5eWRvZW9kb3puZHlma2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyOTY5MiwiZXhwIjoyMDg3NzA1NjkyfQ.l9snWazlv_TX6UGmNsr4iga6VX6r368a_fQY-TGQGWc'
const PEXELS_API_KEY = 'fkOeRCCFnT2wJUKosgkQGd38RrwHCPmMT1ycImO7PyaedT1g2Dota5G3'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','has','have','had','as','it','its','this','that','from','will','be',
  'been','can','could','would','should','says','said','new','amid','just','over','after','before',
  'about','into','how','why','what','when','where','who','which','during','than','us','uk'
])

async function fetchPexelsImage(query, usedUrls = new Set()) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photos = data.photos || []
    if (!photos.length) return null
    for (const photo of photos.slice(0, 10)) {
      const url = photo.src?.large2x || photo.src?.large || photo.src?.medium
      if (url && !usedUrls.has(url)) return url
    }
    return photos[0]?.src?.large2x || photos[0]?.src?.large || null
  } catch { return null }
}

function buildSecondaryQuery(title, imageQuery, index) {
  const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 4 && !STOP.has(w))
  if (index === 0) return imageQuery || titleWords.slice(0, 3).join(' ')
  return titleWords.slice(2, 5).join(' ') || imageQuery
}

async function injectInlineImages(html, title, imageQuery) {
  // Split content at <h2> boundaries
  const sections = html.split(/(?=<h2[\s>])/i)
  if (sections.length < 2) return null  // Too short, nothing to inject

  const injectPoints = [1, 3].filter(i => i < sections.length)
  const usedUrls = new Set()
  let injected = 0

  for (let j = 0; j < injectPoints.length; j++) {
    const idx = injectPoints[j]
    const query = buildSecondaryQuery(title, imageQuery, j)
    if (!query.trim()) continue

    const imgUrl = await fetchPexelsImage(query, usedUrls)
    if (!imgUrl) continue
    usedUrls.add(imgUrl)
    injected++

    const caption = query.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const figure = `\n<figure class="article-figure"><img src="${imgUrl}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>\n`
    sections[idx] = sections[idx] + figure

    await new Promise(r => setTimeout(r, 300))
  }

  if (injected === 0) return null
  return sections.join('')
}

// Extract image_query from post: use tags or derive from title
function deriveImageQuery(post) {
  if (post.tags && post.tags.length > 0) {
    return post.tags.slice(0, 3).join(', ')
  }
  // Derive from title
  const words = post.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 4 && !STOP.has(w))
  return words.slice(0, 3).join(' ')
}

async function main() {
  console.log('Fetching posts that need inline image injection...')

  // Fetch all published posts that don't already have article-figure in content
  let allPosts = []
  let from = 0
  const batchSize = 200

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, content, tags, seo_title')
      .eq('status', 'published')
      .not('content', 'is', null)
      .range(from, from + batchSize - 1)
      .order('published_at', { ascending: false })

    if (error) { console.error('Fetch error:', error.message); break }
    if (!data || data.length === 0) break

    allPosts = allPosts.concat(data)
    console.log(`Fetched ${allPosts.length} posts so far...`)
    if (data.length < batchSize) break
    from += batchSize
  }

  console.log(`Total posts: ${allPosts.length}`)

  // Filter to those that don't already have inline images
  const needsImages = allPosts.filter(p =>
    p.content &&
    !p.content.includes('article-figure') &&
    p.content.includes('<h2')
  )

  console.log(`Posts needing inline images: ${needsImages.length}`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < needsImages.length; i++) {
    const post = needsImages[i]
    const imageQuery = deriveImageQuery(post)

    if (!imageQuery.trim()) { skipped++; continue }

    process.stdout.write(`[${i + 1}/${needsImages.length}] ${post.title.substring(0, 50)}... `)

    const newContent = await injectInlineImages(post.content, post.title, imageQuery)
    if (!newContent) {
      process.stdout.write('skipped (too short)\n')
      skipped++
      continue
    }

    const { error } = await supabase
      .from('posts')
      .update({ content: newContent })
      .eq('id', post.id)

    if (error) {
      process.stdout.write(`FAILED: ${error.message}\n`)
      failed++
    } else {
      process.stdout.write('OK\n')
      updated++
    }

    // Throttle: 2 posts per second to avoid Pexels rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`)
}

main().catch(console.error)
