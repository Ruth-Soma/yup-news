import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = 'https://yup.ng'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch all published post slugs
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, published_at, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'hourly' },
    { url: '/category/world', priority: '0.9', changefreq: 'hourly' },
    { url: '/category/politics', priority: '0.9', changefreq: 'hourly' },
    { url: '/category/finance', priority: '0.9', changefreq: 'hourly' },
    { url: '/category/crypto', priority: '0.9', changefreq: 'hourly' },
    { url: '/category/technology', priority: '0.8', changefreq: 'daily' },
    { url: '/category/sports', priority: '0.8', changefreq: 'daily' },
    { url: '/category/business', priority: '0.8', changefreq: 'daily' },
    { url: '/region/global', priority: '0.7', changefreq: 'daily' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.4', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  ]

  const now = new Date().toISOString().split('T')[0]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${(posts || []).map(p => `  <url>
    <loc>${SITE_URL}/post/${p.slug}</loc>
    <lastmod>${p.published_at ? p.published_at.split('T')[0] : now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
