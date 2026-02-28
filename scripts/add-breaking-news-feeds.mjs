/**
 * add-breaking-news-feeds.mjs
 * Inserts top-tier breaking news RSS feeds into feed_sources.
 * Run: node scripts/add-breaking-news-feeds.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://clxwyydoeodozndyfkkv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHd5eWRvZW9kb3puZHlma2t2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyOTY5MiwiZXhwIjoyMDg3NzA1NjkyfQ.l9snWazlv_TX6UGmNsr4iga6VX6r368a_fQY-TGQGWc'
)

const feeds = [
  // ── Tier-1 Global Breaking News ──────────────────────────────────────────
  { name: 'Reuters',              url: 'https://feeds.reuters.com/reuters/topNews',                           category: 'breaking-news', region: 'global' },
  { name: 'Reuters World',        url: 'https://feeds.reuters.com/Reuters/worldNews',                         category: 'breaking-news', region: 'global' },
  { name: 'AP News',              url: 'https://apnews.com/hub/ap-top-news?format=rss',                       category: 'breaking-news', region: 'global' },
  { name: 'AP World News',        url: 'https://apnews.com/hub/world-news?format=rss',                        category: 'breaking-news', region: 'global' },
  { name: 'CNN World',            url: 'https://rss.cnn.com/rss/edition_world.rss',                           category: 'breaking-news', region: 'global' },
  { name: 'CNN Top Stories',      url: 'https://rss.cnn.com/rss/edition.rss',                                 category: 'breaking-news', region: 'global' },
  { name: 'Sky News Breaking',    url: 'https://feeds.skynews.com/feeds/rss/world.xml',                       category: 'breaking-news', region: 'global' },
  { name: 'France 24 English',    url: 'https://www.france24.com/en/rss',                                     category: 'breaking-news', region: 'global' },
  { name: 'NBC News',             url: 'https://feeds.nbcnews.com/nbcnews/public/news',                       category: 'breaking-news', region: 'us'     },
  { name: 'CBS News',             url: 'https://www.cbsnews.com/latest/rss/main',                             category: 'breaking-news', region: 'us'     },
  { name: 'ABC News US',          url: 'https://feeds.abcnews.com/abcnews/topstories',                        category: 'breaking-news', region: 'us'     },
  { name: 'BBC Breaking',         url: 'https://feeds.bbci.co.uk/news/rss.xml',                               category: 'breaking-news', region: 'global' },
  { name: 'The Guardian World',   url: 'https://www.theguardian.com/world/rss',                               category: 'breaking-news', region: 'global' },
  { name: 'Voice of America',     url: 'https://www.voanews.com/api/z-mqiemmy_p',                             category: 'breaking-news', region: 'global' },
  { name: 'Axios',                url: 'https://api.axios.com/feed/',                                         category: 'breaking-news', region: 'us'     },

  // ── Middle East / Conflict ────────────────────────────────────────────────
  { name: 'Al Jazeera Middle East', url: 'https://www.aljazeera.com/xml/rss/all.xml',                        category: 'breaking-news', region: 'global' },
  { name: 'Jerusalem Post',       url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',                   category: 'breaking-news', region: 'global' },
  { name: 'Times of Israel',      url: 'https://www.timesofisrael.com/feed/',                                 category: 'breaking-news', region: 'global' },
  { name: 'Middle East Eye',      url: 'https://www.middleeasteye.net/rss',                                   category: 'breaking-news', region: 'global' },

  // ── US Politics ───────────────────────────────────────────────────────────
  { name: 'Politico',             url: 'https://rss.politico.com/politics-news.xml',                          category: 'politics',      region: 'us'     },
  { name: 'The Atlantic',         url: 'https://www.theatlantic.com/feed/all/',                               category: 'politics',      region: 'us'     },

  // ── Business / Markets ────────────────────────────────────────────────────
  { name: 'CNBC Top News',        url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',               category: 'business',      region: 'global' },
  { name: 'Bloomberg Markets',    url: 'https://feeds.bloomberg.com/markets/news.rss',                        category: 'business',      region: 'global' },

  // ── Technology ────────────────────────────────────────────────────────────
  { name: 'The Verge',            url: 'https://www.theverge.com/rss/index.xml',                              category: 'technology',    region: 'global' },
  { name: 'Wired',                url: 'https://www.wired.com/feed/rss',                                      category: 'technology',    region: 'global' },
  { name: 'Ars Technica',         url: 'https://feeds.arstechnica.com/arstechnica/index',                     category: 'technology',    region: 'global' },
]

async function main() {
  console.log(`Adding ${feeds.length} breaking news feeds...`)
  let added = 0, skipped = 0

  for (const feed of feeds) {
    // Check if URL already exists
    const { data: existing } = await supabase
      .from('feed_sources')
      .select('id')
      .eq('url', feed.url)
      .maybeSingle()

    if (existing) {
      console.log(`  SKIP (exists): ${feed.name}`)
      skipped++
      continue
    }

    const { error } = await supabase.from('feed_sources').insert({
      ...feed,
      is_active: true,
      last_fetched: null,
    })

    if (error) {
      console.log(`  FAIL: ${feed.name} — ${error.message}`)
    } else {
      console.log(`  ADDED: ${feed.name}`)
      added++
    }
  }

  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}`)
}

main().catch(console.error)
