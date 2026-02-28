-- ─── Enhance page_views: add IP, country, session dedup ──────────────────────

-- 1. Add missing columns to page_views
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS country      text,
  ADD COLUMN IF NOT EXISTS country_code char(2),
  ADD COLUMN IF NOT EXISTS ip_address   text,
  ADD COLUMN IF NOT EXISTS user_agent   text,
  ADD COLUMN IF NOT EXISTS session_id   text;

-- Index for dedup lookups (same IP + post within 30 min)
CREATE INDEX IF NOT EXISTS idx_page_views_ip_post
  ON page_views (ip_address, post_id, viewed_at DESC);

-- Index for country analytics
CREATE INDEX IF NOT EXISTS idx_page_views_country
  ON page_views (country_code, viewed_at DESC);

-- 2. Fix increment_views: only UPDATE posts.views (no longer double-inserts into page_views)
CREATE OR REPLACE FUNCTION increment_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_id;
END;
$$;

-- 3. Create get_views_by_country RPC (used by admin Dashboard)
CREATE OR REPLACE FUNCTION get_views_by_country(days_back integer DEFAULT 30)
RETURNS TABLE(country text, country_code text, view_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(pv.country, 'Unknown')      AS country,
    COALESCE(pv.country_code, 'XX')      AS country_code,
    COUNT(*)                             AS view_count
  FROM page_views pv
  WHERE pv.viewed_at >= now() - (days_back || ' days')::interval
    AND pv.country IS NOT NULL
  GROUP BY pv.country, pv.country_code
  ORDER BY view_count DESC
  LIMIT 20;
$$;

-- 4. Create get_visitor_ips RPC (used by admin IP table)
CREATE OR REPLACE FUNCTION get_visitor_ips(limit_rows integer DEFAULT 100)
RETURNS TABLE(
  ip_address   text,
  country      text,
  country_code text,
  view_count   bigint,
  last_seen    timestamptz,
  sample_title text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pv.ip_address,
    MAX(pv.country)                   AS country,
    MAX(pv.country_code)              AS country_code,
    COUNT(*)                          AS view_count,
    MAX(pv.viewed_at)                 AS last_seen,
    MAX(p.title)                      AS sample_title
  FROM page_views pv
  LEFT JOIN posts p ON p.id = pv.post_id
  WHERE pv.ip_address IS NOT NULL
  GROUP BY pv.ip_address
  ORDER BY last_seen DESC
  LIMIT limit_rows;
$$;

-- 5. Grant execute to anon/authenticated (dashboard uses anon key)
GRANT EXECUTE ON FUNCTION get_views_by_country(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_visitor_ips(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO anon, authenticated;
