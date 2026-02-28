/**
 * tweet-daily-breaking — posts 1 breaking-news article per day to Twitter via Late API.
 *
 * Flow:
 *   1. GET /accounts from Late → find the connected Twitter account ID
 *   2. Query Supabase for the most recent breaking-news article in the past 24h
 *      that has NOT already been logged in tweet_log
 *   3. Build a ≤280-char tweet (title + excerpt if it fits + URL + hashtag)
 *   4. POST to Late API → publishNow: true
 *   5. Insert a row into tweet_log so it never gets re-tweeted
 *
 * Required Supabase secrets:
 *   LATE_KEY          — Late API key (sk_...)
 *   SITE_URL          — public site URL (https://yup.ng)
 *
 * Auto-injected by Supabase:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LATE_KEY    = Deno.env.get('LATE_KEY') ?? ''
const SITE_URL    = Deno.env.get('SITE_URL') ?? 'https://yup.ng'
const SB_URL      = Deno.env.get('SUPABASE_URL') ?? ''
const SB_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const LATE_BASE   = 'https://getlate.dev/api/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    if (!LATE_KEY) throw new Error('LATE_KEY secret is not set')
    const supabase = createClient(SB_URL, SB_KEY)

    // ── 1. Resolve Twitter account ID from Late ─────────────────────────────
    const accountsRes = await fetch(`${LATE_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${LATE_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!accountsRes.ok) {
      throw new Error(`Late /accounts error: ${accountsRes.status} ${await accountsRes.text()}`)
    }

    const accountsPayload = await accountsRes.json()
    // Late may return { accounts: [...] } or directly [...]
    const accountsList: any[] = Array.isArray(accountsPayload)
      ? accountsPayload
      : (accountsPayload.accounts ?? accountsPayload.data ?? [])

    const twitterAccount = accountsList.find(
      (a: any) => (a.platform ?? a.type ?? '').toLowerCase() === 'twitter'
    )
    if (!twitterAccount) {
      throw new Error('No Twitter/X account connected to Late. Connect one at https://app.getlate.dev')
    }
    const accountId: string = twitterAccount._id ?? twitterAccount.id

    // ── 2. Find most recent unposted breaking-news article ──────────────────
    const { data: logged } = await supabase
      .from('tweet_log')
      .select('post_id')
      .order('tweeted_at', { ascending: false })
      .limit(200)

    const alreadyPosted = new Set((logged ?? []).map((r: any) => String(r.post_id)))

    const since = new Date()
    since.setHours(since.getHours() - 24)

    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, category')
      .eq('category', 'breaking-news')
      .gte('published_at', since.toISOString())
      .order('published_at', { ascending: false })
      .limit(30)

    if (postsErr) throw postsErr

    // Take the first post not yet in tweet_log
    const post = (posts ?? []).find((p: any) => !alreadyPosted.has(String(p.id)))

    if (!post) {
      return json({ message: 'No new breaking-news posts to tweet in the last 24h', skipped: true }, 200)
    }

    // ── 3. Build tweet ──────────────────────────────────────────────────────
    const articleUrl = `${SITE_URL}/post/${post.slug}`
    const tweet = buildTweet(post.title, post.excerpt, articleUrl)

    // ── 4. Post via Late ────────────────────────────────────────────────────
    const postRes = await fetch(`${LATE_BASE}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LATE_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        content: tweet,
        publishNow: true,
        platforms: [{ platform: 'twitter', accountId }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    const postData = await postRes.json()
    if (!postRes.ok) {
      throw new Error(`Late POST /posts error ${postRes.status}: ${JSON.stringify(postData)}`)
    }

    // ── 5. Log to tweet_log ─────────────────────────────────────────────────
    await supabase.from('tweet_log').insert({
      post_id:      String(post.id),
      tweet_text:   tweet,
      late_post_id: postData._id ?? postData.id ?? null,
      tweet_url:    postData.platformPostUrl ?? null,
    })

    return json({
      success:      true,
      slug:         post.slug,
      tweet,
      twitterUrl:   postData.platformPostUrl ?? null,
      latePostId:   postData._id ?? postData.id ?? null,
    }, 200)

  } catch (err: any) {
    console.error('[tweet-daily-breaking]', err.message)
    return json({ error: err.message }, 500)
  }
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a tweet that fits within 280 characters.
 * Twitter always wraps URLs to 23 chars (t.co), so we budget accordingly.
 */
function buildTweet(title: string, excerpt: string | undefined, url: string): string {
  const hashtag   = '#BreakingNews'
  // \n + t.co URL (23) + \n + hashtag
  const suffixLen = 1 + 23 + 1 + hashtag.length
  const maxBody   = 280 - suffixLen

  let body = title
  if (excerpt) {
    const withExcerpt = `${title}\n\n${excerpt}`
    if (withExcerpt.length <= maxBody) {
      body = withExcerpt
    }
  }
  if (body.length > maxBody) {
    body = body.substring(0, maxBody - 1) + '…'
  }

  return `${body}\n${url}\n${hashtag}`
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
