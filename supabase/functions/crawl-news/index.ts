import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const logs: string[] = []
  let newPostsCount = 0
  let skippedCount = 0
  let aiCallsThisRun = 0
  const MAX_AI_CALLS = 6
  const ITEMS_PER_FEED = 10

  try {
    // 1. Fetch active feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('feed_sources').select('*').eq('is_active', true)
    if (feedsError) throw feedsError

    // Shuffle feeds so every run covers different sources first
    const shuffled = [...(feeds || [])].sort(() => Math.random() - 0.5)
    logs.push(`Found ${shuffled.length} active feeds`)

    // 2. Load recent post titles for similarity dedup
    const { data: recent } = await supabase
      .from('posts').select('title, slug')
      .order('published_at', { ascending: false }).limit(400)
    const seenTitles: string[] = (recent || []).map((p: any) => p.title)
    const seenSlugs = new Set((recent || []).map((p: any) => p.slug))
    logs.push(`Loaded ${seenTitles.length} existing titles for dedup`)

    // 3. Fetch ALL RSS feeds in parallel (fast!)
    const feedResults = await Promise.allSettled(
      shuffled.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            headers: { 'User-Agent': 'YUP News Bot/1.0' },
            signal: AbortSignal.timeout(8000),
          })
          if (!res.ok) return { feed, items: [] }
          const xml = await res.text()
          const items = parseRSS(xml).slice(0, ITEMS_PER_FEED)
          return { feed, items }
        } catch {
          return { feed, items: [] }
        }
      })
    )

    // 4. Collect ALL candidates — dedup only against already-published posts (not within-run)
    //    Within-run similar stories are SIGNALS of trending topics, not duplicates.
    interface Candidate { feed: any; item: RSSItem; slug: string }
    const allCandidates: Candidate[] = []
    for (const result of feedResults) {
      if (result.status !== 'fulfilled') continue
      const { feed, items } = result.value
      for (const item of items) {
        if (!item.title || item.title.length < 10) continue
        const slug = generateSlug(item.title)
        if (seenSlugs.has(slug)) { skippedCount++; continue }
        // Skip only if we've already PUBLISHED something very similar
        if (isTooSimilar(item.title, seenTitles)) { skippedCount++; continue }
        if ((item.description?.length || 0) < 60) { skippedCount++; continue }
        allCandidates.push({ feed, item, slug })
      }
    }

    logs.push(`${allCandidates.length} raw candidates (${skippedCount} skipped as already-covered)`)

    // 5. Detect trending: count how many other candidates share similar keywords.
    //    If 3 sources all post about "Iran attack Israel", that's breaking news — boost it.
    const trendBonus: number[] = new Array(allCandidates.length).fill(0)
    for (let i = 0; i < allCandidates.length; i++) {
      const kwA = titleKeywords(allCandidates[i].item.title)
      if (kwA.size < 2) continue
      for (let j = i + 1; j < allCandidates.length; j++) {
        const kwB = titleKeywords(allCandidates[j].item.title)
        let overlap = 0
        for (const w of kwA) if (kwB.has(w)) overlap++
        if (overlap / Math.min(kwA.size, kwB.size) >= 0.4) {
          trendBonus[i] += 4   // each additional source covering same story = +4 pts
          trendBonus[j] += 4
        }
      }
    }

    // 6. Score every candidate
    const BREAKING_WORDS = /\b(breaking|urgent|alert|attack|attacked|killed|kills|bombing|bomb|explosion|exploded|war|invasion|invaded|crisis|emergency|crash|earthquake|hurricane|tsunami|coup|assassination|assassinated|hostage|missile|strike|airstrike|shooting|shooting|death toll|casualties|escalat)\b/i
    const TIER1_SOURCES = new Set(['BBC News World','Reuters','AP News','CNN','Al Jazeera','NPR News','Deutsche Welle','Sky News','France 24'])

    function qualityScore(item: RSSItem, feed: any, bonus: number): number {
      let score = bonus  // trending bonus from cross-source frequency

      // Recency: newer = more important for breaking news
      const ageMs = item.pubDate ? Date.now() - item.pubDate : null
      if (ageMs !== null) {
        if (ageMs < 60 * 60 * 1000)       score += 10  // < 1 hour
        else if (ageMs < 3 * 60 * 60 * 1000)  score += 7   // < 3 hours
        else if (ageMs < 6 * 60 * 60 * 1000)  score += 4   // < 6 hours
        else if (ageMs < 12 * 60 * 60 * 1000) score += 2   // < 12 hours
        else if (ageMs > 48 * 60 * 60 * 1000) score -= 4   // > 48 hours old
      }

      // Breaking news keyword signal
      if (BREAKING_WORDS.test(item.title)) score += 8

      // Tier-1 source bonus
      if (TIER1_SOURCES.has(feed.name)) score += 3

      // Content richness
      score += Math.min(item.description?.length || 0, 600) / 60  // 0–10 pts
      if (item.image) score += 3
      const titleWords = item.title.split(/\s+/).length
      if (titleWords >= 8) score += 2
      if (titleWords >= 12) score += 1

      // Penalties
      if ((item.description?.length || 0) < 80) score -= 5
      if (/^(watch|video|photos?|gallery|quiz|sponsored|advertisement)/i.test(item.title)) score -= 10
      return score
    }

    // 7. Sort all candidates by score, then dedup within run (keep best per topic cluster)
    const scored = allCandidates
      .map((c, i) => ({ ...c, score: qualityScore(c.item, c.feed, trendBonus[i]) }))
      .sort((a, b) => b.score - a.score)

    // Pick best candidate per topic cluster (avoid re-writing same story twice)
    const ranked: typeof scored = []
    const usedInRun: string[] = []
    for (const candidate of scored) {
      if (isTooSimilar(candidate.item.title, usedInRun)) continue
      ranked.push(candidate)
      usedInRun.push(candidate.item.title)
      seenSlugs.add(candidate.slug)
    }

    logs.push(`${ranked.length} ranked candidates — top: ${ranked[0]?.item.title.substring(0, 55) || 'none'}`)

    // 6. Pre-fetch full article content for top candidates in parallel
    const topCandidates = ranked.slice(0, MAX_AI_CALLS)
    const contentResults = await Promise.allSettled(
      topCandidates.map(({ item }) => fetchFullContent(item.link, logs))
    )

    // 7. Process top candidates sequentially with AI
    for (let i = 0; i < topCandidates.length; i++) {
      const { feed, item, slug } = topCandidates[i]

      // Short gap between AI calls to stay under rate limit
      if (aiCallsThisRun > 0) await new Promise(r => setTimeout(r, 1500))
      aiCallsThisRun++

      const fullContent = contentResults[i].status === 'fulfilled' ? contentResults[i].value : ''
      const sourceText = fullContent || item.description || item.title
      const aiResult = await rewriteWithAI(item.title, sourceText, logs)
      if (!aiResult) continue

      // Image: always prefer Pexels (reliable, high-quality) → RSS image fallback
      // Never use loremflickr — it returns black/blank images unpredictably
      const pexelsKey = Deno.env.get('PEXELS_API_KEY')
      let coverImage: string | null = null
      if (pexelsKey && aiResult.image_query) {
        coverImage = await fetchPexelsImage(aiResult.image_query, pexelsKey, logs)
      }
      // Only fall back to RSS image if Pexels failed and the URL is from a trusted image host
      if (!coverImage && item.image && isTrustedImageHost(item.image)) {
        coverImage = item.image
      }

      // Enrich article content: embed YouTube videos + inject inline Pexels images
      let enrichedContent = aiResult.content || `<p>${item.description || item.title}</p>`
      if (pexelsKey) {
        enrichedContent = await injectInlineImages(
          enrichedContent, aiResult.title || item.title,
          aiResult.image_query || '', feed.category || 'world', pexelsKey, logs
        )
      }
      // Search YouTube for a relevant news video on this topic
      const youtubeEmbed = await searchYouTube(aiResult.title || item.title, logs)
      if (youtubeEmbed) {
        enrichedContent = injectVideoEmbed(enrichedContent, youtubeEmbed)
      }

      const { error: insertError } = await supabase.from('posts').insert({
        title: aiResult.title || item.title,
        slug,
        excerpt: aiResult.excerpt || item.description?.substring(0, 200),
        content: enrichedContent,
        cover_image: coverImage,
        category: feed.category || 'world',
        region: feed.region || 'global',
        country: aiResult.country || null,
        country_code: aiResult.country_code || null,
        tags: aiResult.tags || [],
        source_url: item.link || null,
        source_name: feed.name,
        seo_title: aiResult.seo_title || item.title.substring(0, 60),
        seo_description: aiResult.seo_description || item.description?.substring(0, 155),
        is_auto_generated: true,
        status: 'published',
        published_at: new Date().toISOString(),
      })

      if (!insertError) {
        newPostsCount++
        seenTitles.push(aiResult.title || item.title)
        logs.push(`Published: ${(aiResult.title || item.title).substring(0, 60)}`)

        // Fire-and-forget social media post (non-blocking — don't let failures stop crawl)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')
        if (supabaseUrl && supabaseAnon) {
          fetch(`${supabaseUrl}/functions/v1/post-to-social`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnon}`,
            },
            body: JSON.stringify({
              title: aiResult.title || item.title,
              slug,
              excerpt: aiResult.excerpt || '',
              category: feed.category || 'world',
              cover_image: coverImage || '',
            }),
          }).catch(() => {}) // ignore errors — social posting is best-effort
        }
      } else {
        logs.push(`Insert error: ${insertError.message}`)
      }
    }

    // 6. Update last_fetched for all feeds
    await Promise.all(
      shuffled.map(feed =>
        supabase.from('feed_sources')
          .update({ last_fetched: new Date().toISOString() })
          .eq('id', feed.id)
      )
    )

    return new Response(
      JSON.stringify({ success: true, new_posts: newPostsCount, skipped: skippedCount, ai_calls: aiCallsThisRun, logs }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message, logs }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// ─── SIMILARITY CHECK ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'is','are','was','were','has','have','had','as','it','its','this','that',
  'from','will','be','been','can','could','would','should','may','might',
  'about','after','before','over','into','says','said','new','amid','just',
])

function titleKeywords(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)))
}

function isTooSimilar(newTitle: string, existingTitles: string[]): boolean {
  const newKw = titleKeywords(newTitle)
  if (newKw.size === 0) return false
  for (const existing of existingTitles) {
    const exKw = titleKeywords(existing)
    if (exKw.size === 0) continue
    let overlap = 0
    for (const w of newKw) if (exKw.has(w)) overlap++
    if (overlap / Math.min(newKw.size, exKw.size) >= 0.6) return true
  }
  return false
}

// ─── FULL ARTICLE FETCHER ─────────────────────────────────────────────────────

async function fetchFullContent(url: string, logs: string[]): Promise<string> {
  if (!url) return ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return ''
    const html = await res.text()

    // Strip noisy elements
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    // Try to isolate the article body
    const bodyMatch =
      stripped.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      stripped.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      stripped.match(/<div[^>]*class="[^"]*(?:article|story|post|content|entry)[^"]*"[^>]*>([\s\S]{500,}?)<\/div>/i)

    const body = bodyMatch ? bodyMatch[1] : stripped

    // Extract paragraph text
    const paragraphs: string[] = []
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let m
    while ((m = pRegex.exec(body)) !== null) {
      const t = cleanText(m[1])
      if (t.length > 40) paragraphs.push(t)
    }

    const text = paragraphs.join(' ').trim()
    if (text.length > 200) {
      logs.push(`Fetched ${text.length} chars from ${url.substring(0, 50)}`)
      return text.substring(0, 4000)
    }
    return ''
  } catch {
    return ''
  }
}

// ─── AI REWRITER ──────────────────────────────────────────────────────────────

async function rewriteWithAI(title: string, description: string, logs: string[]) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) { logs.push('GEMINI_API_KEY not set'); return null }

  const prompt = `You are a senior editor at a digital news publication. Using the source material below, write a complete, well-researched news article and return ONLY valid JSON with no extra text.

Title: ${title}
Source material: ${description.substring(0, 4000)}

Rules for the headline ("title"):
- Make it punchy, specific, and irresistible to click
- Include the most important keyword near the start
- Max 70 characters, no clickbait lies, no invented facts

Rules for "content":
- Write 550-750 words of clean, engaging journalism
- Use <p>, <h2>, and <h3> tags only — no lists, no divs
- Open with a strong lede paragraph that answers who/what/when/where/why
- Follow with 3-4 <h2> sections that develop the story with context, analysis, and quotes where available
- End with a forward-looking paragraph on implications or next steps
- Paraphrase the source material — do not copy sentences verbatim
- Stay strictly factual; do not invent quotes or statistics not present in the source

Return this exact JSON:
{
  "title": "Catchy keyword-rich headline (max 70 chars)",
  "excerpt": "2-sentence hook that makes readers want to continue (max 160 chars)",
  "content": "Full HTML article body 550-750 words using <p>, <h2>, <h3> tags",
  "seo_title": "Primary keyword + topic, max 60 chars",
  "seo_description": "Compelling meta description with keyword, max 155 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "image_query": "2-3 comma-separated keywords for a relevant news photo",
  "country": "Full country name this story is PRIMARILY about (null if global/unclear)",
  "country_code": "ISO 3166-1 alpha-2 code e.g. NG, US, GB, ZA (null if global/unclear)"
}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!response.ok) { logs.push(`Gemini ${response.status}: ${(await response.text()).substring(0, 150)}`); return null }
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) { logs.push('Gemini empty response'); return null }
    return JSON.parse(text)
  } catch (e: any) {
    logs.push(`Gemini error: ${e.message}`)
    return null
  }
}

// ─── RSS PARSER ───────────────────────────────────────────────────────────────

interface RSSItem { title: string; description: string; link: string; image: string | null; pubDate: number | null }

function parsePubDate(xml: string): number | null {
  const raw = extractTag(xml, 'pubDate') || extractTag(xml, 'published') || extractTag(xml, 'dc:date') || extractTag(xml, 'updated')
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d.getTime()
}

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  // Handle both <item> (RSS) and <entry> (Atom) feeds
  const itemRegex = /(<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>)/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    items.push({
      title: cleanText(extractTag(item, 'title')),
      description: cleanText(extractTag(item, 'description') || extractTag(item, 'summary') || extractTag(item, 'content')),
      link: extractTag(item, 'link') || extractTag(item, 'guid'),
      image: extractImage(item),
      pubDate: parsePubDate(item),
    })
  }
  return items.filter(i => i.title.length > 0)
}

function extractTag(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
  if (cdata) return cdata[1].trim()
  const normal = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return normal ? normal[1].trim() : ''
}

// Domains known to block hotlinking or require auth — images show as black/broken
const BLOCKED_IMAGE_DOMAINS = [
  'cdn.i-scmp.com',
  'www.ft.com',
  'ft.com',
  'www.wsj.com',
  'wsj.com',
  'bloomberg.com',
  'www.bloomberg.com',
  'thehill.com',
  'www.thehill.com',
  'www.tbstat.com',
]

function isBlockedImage(url: string): boolean {
  try {
    const domain = new URL(url).hostname
    return BLOCKED_IMAGE_DOMAINS.includes(domain)
  } catch { return false }
}

function extractImage(xml: string): string | null {
  const media = xml.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i)
  if (media && !isBlockedImage(media[1])) return media[1]
  const src = xml.match(/src="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i)
  if (src && !isBlockedImage(src[1])) return src[1]
  return null
}

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim()
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim().substring(0, 80)
}

function slugToLock(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h) % 9999 + 1
}

// ─── PEXELS IMAGE SEARCH ──────────────────────────────────────────────────────

async function fetchPexelsImage(query: string, apiKey: string, logs: string[], usedUrls?: Set<string>): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) { logs.push(`Pexels ${res.status}`); return null }
    const data = await res.json()
    const photos: any[] = data.photos || []
    if (!photos.length) return null
    // Pick from top results, skipping already-used URLs to avoid duplicates in same article
    const candidates = photos.slice(0, Math.min(photos.length, 10))
    for (const photo of candidates) {
      const url = photo.src?.large2x || photo.src?.large || photo.src?.medium || null
      if (!url) continue
      if (usedUrls && usedUrls.has(url)) continue
      if (url) logs.push(`Pexels image: ${url.substring(0, 60)}`)
      return url
    }
    // All top results used — just return the first one
    const fallback = candidates[0]?.src?.large2x || candidates[0]?.src?.large || null
    return fallback
  } catch (e: any) {
    logs.push(`Pexels error: ${e.message}`)
    return null
  }
}

// Domains that reliably serve hotlink-friendly, good-quality images
const TRUSTED_IMAGE_HOSTS = [
  'images.pexels.com',
  'i.guim.co.uk',           // Guardian (full-size only — width=140 filtered below)
  'media.guim.co.uk',
  'ichef.bbci.co.uk',       // BBC
  'static.reuters.com',
  'cloudfront-us-east-2.images.arcpublishing.com',
  'res.cloudinary.com',
  'upload.wikimedia.org',
  'cdn.pixabay.com',
  'images.unsplash.com',
  'live-production.wcms.abc-cdn.net.au',
  'foreignpolicy.com',
  'gdb.voanews.com',
  'apnews.brightspotcdn.com',
  'dims.apnews.com',
  'cdn.cnn.com',
  's.abcnews.com',
]

function isTrustedImageHost(url: string): boolean {
  try {
    const { hostname, search } = new URL(url)
    // Reject tiny Guardian thumbnails (width=140 = 3KB stub)
    if (search.includes('width=140')) return false
    return TRUSTED_IMAGE_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))
  } catch { return false }
}

// ─── YOUTUBE SEARCH ───────────────────────────────────────────────────────────

// Invidious public instances — tried in order until one responds
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
]

// Preferred news channel IDs — results from these channels are prioritised
const NEWS_CHANNEL_IDS = new Set([
  'UCupvZG-5ko_eiXAupbDfxWw', // CNN
  'UCBi2mrWuNuyYy4gbM6fU18Q', // ABC News
  'UCeY0bbntWzzVIaj2z3QigXg', // NBC News
  'UC16niRr50-MSBwiO3YDb3RA', // BBC News
  'UCNye-wNBqNL5ZzHSJj3l8Bg', // Al Jazeera English
  'UCIALMKvObZNtJ6AmdCLP_xQ', // Reuters
  'UC4uzUSCsBlfY9WUQZ78ws0g', // France 24
  'UCWX3yGbODI3RREZdRCZMnpg', // DW News
  'UCknLrEdhRCp1aegoMqRaCZg', // Sky News
  'UCvJJ_dzjViJCoLf5uKUTwoA', // CGTN
])

function buildYouTubeQuery(title: string): string {
  const STOP = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'is','are','was','were','has','have','had','as','it','its','this','that','from','will','be',
    'been','can','could','would','should','says','said','new','amid','just','over','after','before',
    'about','into','how','why','what','when','where','who','which','during','than','us','uk'])
  const words = title.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
  // Keep top 6 keywords for a focused search
  return words.slice(0, 6).join(' ')
}

async function searchYouTube(title: string, logs: string[]): Promise<string | null> {
  const query = buildYouTubeQuery(title)
  if (!query) return null

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance&page=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'YUP News Bot/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue

      const results: any[] = await res.json()
      if (!Array.isArray(results) || results.length === 0) continue

      // Prefer results from known news channels
      const newsVideo = results.find(v => v.videoId && NEWS_CHANNEL_IDS.has(v.authorId))
      const video = newsVideo || results.find(v => v.videoId)
      if (!video?.videoId) continue

      const videoId = video.videoId
      const channelName = video.author || 'News'
      const videoTitle = video.title || title
      logs.push(`YouTube: ${videoTitle.substring(0, 60)} [${channelName}]`)

      return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="${videoTitle.replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
    } catch {
      // Try next instance
    }
  }

  logs.push(`YouTube search failed for: ${query.substring(0, 50)}`)
  return null
}

function injectVideoEmbed(html: string, embedHtml: string): string {
  // Insert video after the first h2 section, or after the second paragraph
  const h2Idx = html.indexOf('</h2>')
  if (h2Idx !== -1) {
    // Find end of first paragraph after first h2
    const pEnd = html.indexOf('</p>', h2Idx)
    if (pEnd !== -1) {
      return html.slice(0, pEnd + 4) + '\n' + embedHtml + html.slice(pEnd + 4)
    }
  }
  // Fallback: after second </p>
  let count = 0
  let pos = 0
  while (count < 2) {
    const idx = html.indexOf('</p>', pos)
    if (idx === -1) break
    pos = idx + 4
    count++
  }
  return html.slice(0, pos) + '\n' + embedHtml + html.slice(pos)
}

// ─── INLINE IMAGE INJECTION ───────────────────────────────────────────────────

// Derive varied secondary queries from the primary image_query + title
function buildSecondaryQuery(title: string, imageQuery: string, index: number): string {
  const STOP = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'is','are','was','were','has','have','had','as','it','its','this','that','from','will','be',
    'been','can','could','would','should','says','said','new','amid','just','over','after','before',
    'about','into','how','why','what','when','where','who','which','during','than','us','uk'])

  const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w => w.length > 4 && !STOP.has(w))

  // First inline image: use the primary image_query
  if (index === 0) return imageQuery

  // Second inline image: use different title keywords (offset by 2)
  return titleWords.slice(2, 5).join(' ') || imageQuery
}

async function injectInlineImages(
  html: string,
  title: string,
  imageQuery: string,
  category: string,
  pexelsKey: string,
  logs: string[]
): Promise<string> {
  // Split content at <h2> boundaries
  const sections = html.split(/(?=<h2[\s>])/i)
  if (sections.length < 2) return html  // Too short to inject

  // Inject one image after section 1 (after first h2 content), one after section 3 if it exists
  const injectPoints = [1, 3].filter(i => i < sections.length)
  const usedUrls = new Set<string>()

  for (let j = 0; j < injectPoints.length; j++) {
    const idx = injectPoints[j]
    const query = buildSecondaryQuery(title, imageQuery, j)
    const imgUrl = await fetchPexelsImage(query, pexelsKey, logs, usedUrls)
    if (!imgUrl) continue
    usedUrls.add(imgUrl)

    const caption = query.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const figure = `\n<figure class="article-figure"><img src="${imgUrl}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>\n`

    // Insert figure at the END of this section (before the next <h2>)
    sections[idx] = sections[idx] + figure
    await new Promise(r => setTimeout(r, 200))
  }

  return sections.join('')
}
