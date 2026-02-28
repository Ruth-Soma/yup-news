import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = 'https://yup.ng'
const SITE_NAME = 'YUP News'
const SITE_DESC = 'Breaking news from the US, China, and the world — updated every 30 minutes.'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

serve(async (req: Request) => {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let query = supabase
    .from('posts')
    .select('title, slug, excerpt, content, cover_image, category, source_name, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (category) query = query.eq('category', category)

  const { data: posts } = await query

  const feedTitle = category
    ? `${SITE_NAME} — ${category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
    : SITE_NAME

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss${category ? `?category=${category}` : ''}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.svg</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${SITE_URL}</link>
    </image>
${(posts || []).map(post => {
  const postUrl = `${SITE_URL}/post/${post.slug}`
  const pubDate = new Date(post.published_at).toUTCString()
  const desc = post.excerpt || ''
  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category || 'news')}</category>
      ${post.source_name ? `<dc:creator>${escapeXml(post.source_name)}</dc:creator>` : ''}
      ${post.cover_image ? `<media:content url="${escapeXml(post.cover_image)}" medium="image" />` : ''}
    </item>`
}).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
})
