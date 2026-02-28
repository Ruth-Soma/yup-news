/**
 * backfill-images — one-time job that replaces loremflickr/null cover images
 * with real Pexels photos sourced from the article title + category.
 *
 * GET /functions/v1/backfill-images?limit=50
 * Processes up to `limit` articles per call (default 50).
 * Call repeatedly until { remaining: 0 }.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const pexelsKey = Deno.env.get('PEXELS_API_KEY')
  if (!pexelsKey) {
    return json({ error: 'PEXELS_API_KEY not configured' }, 400)
  }

  // Fetch articles that have null, loremflickr, or hotlink-blocked images
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, category, tags, country')
    .eq('status', 'published')
    .or('cover_image.is.null,cover_image.like.%loremflickr%,cover_image.like.%cdn.i-scmp.com%,cover_image.like.%ft.com/__origami%,cover_image.like.%wsj.com%,cover_image.like.%bloomberg.com%,cover_image.like.%thehill.com%,cover_image.like.%tbstat.com%,cover_image.like.%width=140%')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return json({ error: error.message }, 500)
  if (!posts || posts.length === 0) return json({ done: true, remaining: 0, updated: 0 }, 200)

  const logs: string[] = []
  let updated = 0
  let failed = 0

  for (const post of posts) {
    // Build a targeted search query: title keywords + category context
    const query = buildImageQuery(post.title, post.category, post.country)

    const imageUrl = await fetchPexelsImage(query, pexelsKey, logs)

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ cover_image: imageUrl })
        .eq('id', post.id)

      if (!updateError) {
        updated++
        logs.push(`✓ [${post.id}] ${post.title.substring(0, 50)}`)
      } else {
        failed++
        logs.push(`✗ update error [${post.id}]: ${updateError.message}`)
      }
    } else {
      failed++
      logs.push(`✗ no image found for: ${post.title.substring(0, 50)}`)
    }

    // Small pause to stay well within Pexels rate limit
    await new Promise(r => setTimeout(r, 120))
  }

  // Check how many remain
  const { count: remaining } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('cover_image.is.null,cover_image.like.%loremflickr%,cover_image.like.%cdn.i-scmp.com%,cover_image.like.%ft.com/__origami%,cover_image.like.%wsj.com%,cover_image.like.%bloomberg.com%,cover_image.like.%thehill.com%,cover_image.like.%tbstat.com%,cover_image.like.%width=140%')

  return json({ done: (remaining || 0) === 0, updated, failed, remaining: remaining || 0, logs }, 200)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildImageQuery(title: string, category: string | null, country: string | null): string {
  // Extract meaningful keywords from the title (skip stop words)
  const STOP = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'is','are','was','were','has','have','had','as','it','its','this','that',
    'from','will','be','been','can','could','would','should','may','might',
    'says','said','new','amid','just','over','after','before','about','into',
    'how','why','what','when','where','who','which','after','during','than',
  ])

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w))
    .slice(0, 4)

  // Category context word (helps Pexels find relevant imagery)
  const catKeyword: Record<string, string> = {
    'breaking-news': 'news',
    politics: 'politics government',
    finance: 'finance stock market',
    crypto: 'cryptocurrency bitcoin',
    technology: 'technology digital',
    sports: 'sports athlete',
    business: 'business corporate',
    health: 'health medical',
    entertainment: 'entertainment media',
    world: 'world',
  }

  const parts = [...words]
  const catCtx = catKeyword[category || '']
  if (catCtx && !parts.some(w => catCtx.includes(w))) parts.push(catCtx.split(' ')[0])
  if (country && parts.length < 5) parts.push(country.split(' ')[0].toLowerCase())

  return parts.slice(0, 4).join(' ')
}

async function fetchPexelsImage(query: string, apiKey: string, logs: string[]): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(6000),
      }
    )
    if (!res.ok) {
      logs.push(`Pexels ${res.status} for "${query}"`)
      return null
    }
    const data = await res.json()
    const photos: any[] = data.photos || []
    if (!photos.length) {
      // Retry with just the first two words if full query finds nothing
      const short = query.split(' ').slice(0, 2).join(' ')
      if (short !== query) return fetchPexelsImage(short, apiKey, logs)
      return null
    }
    // Pick randomly from top 5 to avoid all articles having the same photo
    const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 5))]
    return photo.src?.large2x || photo.src?.large || photo.src?.medium || null
  } catch (e: any) {
    logs.push(`Pexels error for "${query}": ${e.message}`)
    return null
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
