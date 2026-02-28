import { supabase } from './supabase'

const PAGE_SIZE = 12

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function getPosts({ page = 1, category, region, status = 'published' } = {}) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, category, region, country, country_code, tags, source_name, views, published_at, comments(count)', { count: 'exact' })
    .eq('status', status)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(from, to)

  if (category) query = query.eq('category', category)
  if (region) query = query.eq('region', region)

  const { data, error, count } = await query
  return { data, error, count, totalPages: Math.ceil((count || 0) / PAGE_SIZE) }
}

export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return { data, error }
}

export async function getRelatedPosts(category, excludeSlug) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, category, published_at')
    .eq('status', 'published')
    .eq('category', category)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(3)
  return { data, error }
}

export async function getMoreFromCategory(category, excludeSlugs = [], limit = 8) {
  let query = supabase
    .from('posts')
    .select('id, title, slug, cover_image, category, views, published_at')
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(limit + excludeSlugs.length)
  const { data, error } = await query
  const filtered = (data || []).filter(p => !excludeSlugs.includes(p.slug)).slice(0, limit)
  return { data: filtered, error }
}

export async function getPopularPosts(limit = 9) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, category, region, country, country_code, views, published_at')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

export async function getMostReadPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category, views, published_at')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(5)
  return { data, error }
}

export async function getFeaturedCandidates(topCategory, geoRegion = null, topCountry = null) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  const SELECT = 'id, title, slug, excerpt, cover_image, category, region, country, country_code, source_name, views, published_at'

  const [breakingRes, relatedRes, freshRes, worldRes, geoRes, countryRes] = await Promise.all([
    // 1. Breaking news in the last 6 hours — up to 4 candidates
    supabase.from('posts').select(SELECT)
      .eq('status', 'published').eq('category', 'breaking-news')
      .gte('published_at', sixHoursAgo).order('published_at', { ascending: false }).limit(4),
    // 2. Top posts from user's interest category — up to 5 candidates
    topCategory
      ? supabase.from('posts').select(SELECT)
          .eq('status', 'published').eq('category', topCategory)
          .order('views', { ascending: false }).order('published_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    // 3. Fresh recent posts (any non-breaking category) — up to 8 candidates
    supabase.from('posts').select(SELECT)
      .eq('status', 'published')
      .neq('category', 'breaking-news')
      .order('published_at', { ascending: false }).limit(8),
    // 4. Most popular world posts — up to 4 candidates
    supabase.from('posts').select(SELECT)
      .eq('status', 'published').eq('region', 'global')
      .order('views', { ascending: false }).limit(4),
    // 5. Posts from user's detected geographic continent — up to 5 candidates
    geoRegion
      ? supabase.from('posts').select(SELECT)
          .eq('status', 'published').eq('region', geoRegion)
          .order('published_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    // 6. Posts from user's most-read country — up to 5 candidates
    topCountry
      ? supabase.from('posts').select(SELECT)
          .eq('status', 'published').eq('country_code', topCountry)
          .order('views', { ascending: false }).order('published_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ])

  return {
    breaking: breakingRes.data || [],
    related: relatedRes.data || [],
    fresh: freshRes.data || [],
    world: worldRes.data || [],
    geo: geoRes.data || [],
    countryPosts: countryRes.data || [],
  }
}

// Hot-score ranking: (views + 2) / (age_hours + 2)^1.3
// Recent popular posts rise; stale zero-view posts sink.
export async function getHotPosts({ page = 1, category, region } = {}) {
  const { data, error } = await supabase.rpc('get_hot_posts', {
    p_region: region || null,
    p_category: category || null,
    p_page: page,
    p_page_size: PAGE_SIZE,
  })
  const totalCount = Number(data?.[0]?.total_count || 0)
  const posts = (data || []).map(({ total_count, ...post }) => post)
  return { data: posts, error, count: totalCount, totalPages: Math.ceil(totalCount / PAGE_SIZE) }
}

export async function getBreakingNewsTicker() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, category')
    .eq('status', 'published')
    .eq('category', 'breaking-news')
    .order('published_at', { ascending: false })
    .limit(8)
  return { data, error }
}

export async function searchPosts(query, { category, region, page = 1 } = {}) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const term = query.trim().replace(/[%_]/g, '\\$&') // escape SQL wildcards

  let q = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, category, region, published_at, comments(count)', { count: 'exact' })
    .eq('status', 'published')
    .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,category.ilike.%${term}%,source_name.ilike.%${term}%`)
    .order('published_at', { ascending: false })
    .range(from, to)

  if (category) q = q.eq('category', category)
  if (region) q = q.eq('region', region)

  const { data, error, count } = await q
  return { data, error, count, totalPages: Math.ceil((count || 0) / PAGE_SIZE) }
}

export async function incrementPostViews(postId, country = null, countryCode = null) {
  await supabase.from('page_views').insert({
    post_id: postId,
    country: country || null,
    country_code: countryCode || null,
  })
  await supabase.rpc('increment_views', { post_id: postId })
}

export async function getViewsByCountry(daysBack = 30) {
  const { data, error } = await supabase.rpc('get_views_by_country', { days_back: daysBack })
  return { data: data || [], error }
}

// ─── ADMIN POSTS ──────────────────────────────────────────────────────────────

export async function adminGetPosts({ page = 1, status, search } = {}) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('id, title, slug, category, region, status, is_auto_generated, views, published_at', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query
  return { data, error, count, totalPages: Math.ceil((count || 0) / PAGE_SIZE) }
}

export async function adminGetPost(id) {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()
  return { data, error }
}

export async function adminCreatePost(post) {
  const { data, error } = await supabase.from('posts').insert(post).select().single()
  return { data, error }
}

export async function adminUpdatePost(id, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function adminDeletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  return { error }
}

export async function adminDuplicatePost(id) {
  const { data: original, error } = await supabase.from('posts').select('*').eq('id', id).single()
  if (error || !original) return { data: null, error: error || new Error('Post not found') }
  const { id: _id, created_at: _ca, updated_at: _ua, views: _v, ...rest } = original
  const { data, error: insertError } = await supabase
    .from('posts')
    .insert({
      ...rest,
      slug: `${original.slug}-copy-${Date.now().toString(36)}`,
      title: `${original.title} (Copy)`,
      status: 'draft',
      views: 0,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  return { data, error: insertError }
}

export async function adminBulkUpdateStatus(ids, status) {
  const { error } = await supabase.from('posts').update({ status }).in('id', ids)
  return { error }
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  return { data, error }
}

// ─── FEED SOURCES ─────────────────────────────────────────────────────────────

export async function getFeeds() {
  const { data, error } = await supabase
    .from('feed_sources')
    .select('*')
    .order('name')
  return { data, error }
}

export async function updateFeedStatus(id, is_active) {
  const { error } = await supabase.from('feed_sources').update({ is_active }).eq('id', id)
  return { error }
}

export async function createFeed(feed) {
  const { data, error } = await supabase.from('feed_sources').insert(feed).select().single()
  return { data, error }
}

export async function deleteFeed(id) {
  const { error } = await supabase.from('feed_sources').delete().eq('id', id)
  return { error }
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export async function getComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, name, content, created_at')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function adminApproveComment(id) {
  const { error } = await supabase.from('comments').update({ status: 'approved' }).eq('id', id)
  return { error }
}

export async function adminMarkCommentSpam(id) {
  const { error } = await supabase.from('comments').update({ status: 'spam' }).eq('id', id)
  return { error }
}

export async function addComment(postId, name, content) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, name: name.trim(), content: content.trim() })
    .select('id, name, content, created_at')
    .single()
  return { data, error }
}

// ─── LIKES ─────────────────────────────────────────────────────────────────────

export async function getLikeCount(postId) {
  const { count, error } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
  return { count: count || 0, error }
}

export async function toggleLike(postId, sessionId) {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('session_id', sessionId)
    return { liked: false, error }
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, session_id: sessionId })
    return { liked: true, error }
  }
}

export async function hasLiked(postId, sessionId) {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('session_id', sessionId)
    .maybeSingle()
  return !!data
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [postsRes, viewsTodayRes, postsToday, subscribersRes] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('viewed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('published_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  return {
    totalPosts: postsRes.count || 0,
    viewsToday: viewsTodayRes.count || 0,
    postsToday: postsToday.count || 0,
    subscribers: subscribersRes.count || 0,
  }
}

export async function getTopPostsByViews() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, views, category')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(10)
  return { data, error }
}

export async function getViewsOverTime() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('page_views')
    .select('viewed_at')
    .gte('viewed_at', sevenDaysAgo.toISOString())
  return { data, error }
}
