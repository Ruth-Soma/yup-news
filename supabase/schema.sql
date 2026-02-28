-- ═══════════════════════════════════════════════════════════════════════════════
-- YUP News — Complete Database Schema
-- Run this ONCE in your Supabase SQL Editor:
--   supabase.com/dashboard → your project → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. TABLES ────────────────────────────────────────────────────────────────

-- Posts (main content table)
CREATE TABLE IF NOT EXISTS posts (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  excerpt          text,
  content          text,
  cover_image      text,
  category         text        NOT NULL DEFAULT 'world',
  region           text        NOT NULL DEFAULT 'global',
  tags             text[]      DEFAULT '{}',
  source_url       text,
  source_name      text,
  seo_title        text,
  seo_description  text,
  views            integer     DEFAULT 0,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'published', 'archived')),
  is_auto_generated boolean    DEFAULT false,
  published_at     timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- Feed Sources (RSS crawl targets)
CREATE TABLE IF NOT EXISTS feed_sources (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL,
  url          text        NOT NULL,
  region       text        NOT NULL DEFAULT 'global',
  category     text        NOT NULL DEFAULT 'world',
  is_active    boolean     DEFAULT true,
  last_fetched timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Page Views (for analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id   uuid        REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

-- Categories (reference data)
CREATE TABLE IF NOT EXISTS categories (
  id         uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text  NOT NULL,
  slug       text  UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- ─── 2. INDEXES ───────────────────────────────────────────────────────────────

-- Full-text search on title
CREATE INDEX IF NOT EXISTS posts_title_fts
  ON posts USING gin(to_tsvector('english', title));

-- Common query patterns
CREATE INDEX IF NOT EXISTS posts_status_published_at
  ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category
  ON posts(category);
CREATE INDEX IF NOT EXISTS posts_region
  ON posts(region);
CREATE INDEX IF NOT EXISTS posts_slug
  ON posts(slug);
CREATE INDEX IF NOT EXISTS page_views_viewed_at
  ON page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS page_views_post_id
  ON page_views(post_id);


-- ─── 3. RPC FUNCTIONS ─────────────────────────────────────────────────────────

-- Called from the frontend when a user reads a post
CREATE OR REPLACE FUNCTION increment_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_id;
  INSERT INTO page_views (post_id) VALUES (post_id);
END;
$$;


-- ─── 4. ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (safe to re-run)
DROP POLICY IF EXISTS "Public read published posts"          ON posts;
DROP POLICY IF EXISTS "Authenticated full access posts"      ON posts;
DROP POLICY IF EXISTS "Public read categories"               ON categories;
DROP POLICY IF EXISTS "Authenticated full access categories" ON categories;
DROP POLICY IF EXISTS "Authenticated full access feeds"      ON feed_sources;
DROP POLICY IF EXISTS "Public insert page_views"             ON page_views;
DROP POLICY IF EXISTS "Authenticated read page_views"        ON page_views;

-- Anyone can read published posts
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (status = 'published');

-- Authenticated users (admin) have full access to posts
CREATE POLICY "Authenticated full access posts" ON posts
  FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can read categories
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

-- Authenticated users can manage categories
CREATE POLICY "Authenticated full access categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated users can manage feed sources
CREATE POLICY "Authenticated full access feeds" ON feed_sources
  FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can record a page view (called from frontend)
CREATE POLICY "Public insert page_views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read analytics
CREATE POLICY "Authenticated read page_views" ON page_views
  FOR SELECT USING (auth.role() = 'authenticated');


-- ─── 5. SEED: CATEGORIES ──────────────────────────────────────────────────────

INSERT INTO categories (name, slug) VALUES
  ('Breaking News',  'breaking-news'),
  ('Politics',       'politics'),
  ('Business',       'business'),
  ('Technology',     'technology'),
  ('Sports',         'sports'),
  ('Health',         'health'),
  ('World',          'world')
ON CONFLICT (slug) DO NOTHING;


-- ─── 6. SEED: FEED SOURCES ────────────────────────────────────────────────────
-- A starter list of RSS feeds. Add more via the admin panel → Feed Sources.

INSERT INTO feed_sources (name, url, region, category) VALUES

  -- Global / World
  ('BBC News World',     'https://feeds.bbci.co.uk/news/world/rss.xml',        'global', 'world'),
  ('Al Jazeera',         'https://www.aljazeera.com/xml/rss/all.xml',           'global', 'world'),
  ('Reuters World',      'https://feeds.reuters.com/reuters/topNews',            'global', 'world'),
  ('AP News',            'https://rsshub.app/apnews/topics/apf-topnews',        'global', 'world'),

  -- United States
  ('NPR News',           'https://feeds.npr.org/1001/rss.xml',                  'us',     'politics'),
  ('The Hill',           'https://thehill.com/rss/syndicator/19109',             'us',     'politics'),
  ('Bloomberg',          'https://feeds.bloomberg.com/politics/news.rss',        'us',     'business'),
  ('TechCrunch',         'https://techcrunch.com/feed/',                         'us',     'technology'),
  ('ESPN',               'https://www.espn.com/espn/rss/news',                   'us',     'sports'),

  -- Africa
  ('BBC Africa',         'https://feeds.bbci.co.uk/news/world/africa/rss.xml',  'africa', 'world'),
  ('AllAfrica',          'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', 'africa', 'world'),
  ('Premium Times',      'https://www.premiumtimesng.com/feed',                  'africa', 'politics'),
  ('The Punch Nigeria',  'https://punchng.com/feed/',                            'africa', 'politics'),
  ('BusinessDay NG',     'https://businessday.ng/feed/',                         'africa', 'business')

ON CONFLICT DO NOTHING;
