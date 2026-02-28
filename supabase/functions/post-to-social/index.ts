/**
 * post-to-social — called by crawl-news after each new article is published.
 * Posts a link to Twitter/X and Facebook Page automatically.
 *
 * Required secrets:
 *   TWITTER_API_KEY         – OAuth 1.0a consumer key
 *   TWITTER_API_SECRET      – OAuth 1.0a consumer secret
 *   TWITTER_ACCESS_TOKEN    – OAuth 1.0a access token (post as this account)
 *   TWITTER_ACCESS_SECRET   – OAuth 1.0a access token secret
 *   FACEBOOK_PAGE_ID        – Numeric page ID
 *   FACEBOOK_PAGE_TOKEN     – Page access token (pages_manage_posts permission)
 *
 * Request body: { title, slug, excerpt, category, cover_image }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SITE_URL = Deno.env.get('SITE_URL') || 'https://yup.ng'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { title, slug, excerpt, category, cover_image } = await req.json()
    if (!title || !slug) {
      return json({ error: 'title and slug are required' }, 400)
    }

    const articleUrl = `${SITE_URL}/post/${slug}`
    const tag = categoryToHashtag(category)
    const tweet = buildTweet(title, excerpt, articleUrl, tag)

    const results: Record<string, any> = {}

    // ── Twitter/X ──────────────────────────────────────────────────────────
    const twitterKey    = Deno.env.get('TWITTER_API_KEY')
    const twitterSecret = Deno.env.get('TWITTER_API_SECRET')
    const twitterToken  = Deno.env.get('TWITTER_ACCESS_TOKEN')
    const twitterTokSec = Deno.env.get('TWITTER_ACCESS_SECRET')

    if (twitterKey && twitterSecret && twitterToken && twitterTokSec) {
      try {
        const twitterRes = await postTweet(tweet, {
          apiKey: twitterKey,
          apiSecret: twitterSecret,
          accessToken: twitterToken,
          accessSecret: twitterTokSec,
        })
        results.twitter = twitterRes
      } catch (e: any) {
        results.twitter_error = e.message
      }
    } else {
      results.twitter = 'skipped — credentials not configured'
    }

    // ── Facebook Page ───────────────────────────────────────────────────────
    const fbPageId    = Deno.env.get('FACEBOOK_PAGE_ID')
    const fbPageToken = Deno.env.get('FACEBOOK_PAGE_TOKEN')

    if (fbPageId && fbPageToken) {
      try {
        const fbRes = await postToFacebook(title, excerpt, articleUrl, cover_image, fbPageId, fbPageToken)
        results.facebook = fbRes
      } catch (e: any) {
        results.facebook_error = e.message
      }
    } else {
      results.facebook = 'skipped — credentials not configured'
    }

    return json({ success: true, results }, 200)

  } catch (err: any) {
    console.error('post-to-social error:', err)
    return json({ error: err.message }, 500)
  }
})

// ─── TWITTER / X ──────────────────────────────────────────────────────────────

function buildTweet(title: string, excerpt: string | undefined, url: string, hashtag: string): string {
  // Twitter limit is 280 chars; the URL counts as 23 chars (t.co shortening)
  const suffix = `\n${url}\n${hashtag}`
  const suffixLen = 23 + 1 + hashtag.length + 2 // URL + newline + tag + 2 newlines
  const maxBody = 280 - suffixLen
  const body = excerpt
    ? (title.length + excerpt.length + 3 <= maxBody
        ? `${title}\n\n${excerpt}`
        : title.length <= maxBody ? title : title.substring(0, maxBody - 1) + '…')
    : title.substring(0, maxBody)
  return `${body}\n${url}\n${hashtag}`
}

async function postTweet(
  text: string,
  creds: { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string }
): Promise<any> {
  const url = 'https://api.twitter.com/2/tweets'
  const body = JSON.stringify({ text })

  const authHeader = await buildOAuth1Header('POST', url, {}, creds)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body,
    signal: AbortSignal.timeout(10000),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Twitter ${res.status}: ${JSON.stringify(data)}`)
  return data
}

// OAuth 1.0a signature for Twitter API v2
async function buildOAuth1Header(
  method: string,
  url: string,
  params: Record<string, string>,
  creds: { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string }
): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: '1.0',
  }

  // Signature base string
  const allParams = { ...params, ...oauthParams }
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&')

  const baseString = `${method.toUpperCase()}&${pct(url)}&${pct(sortedParams)}`
  const signingKey = `${pct(creds.apiSecret)}&${pct(creds.accessSecret)}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(baseString))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

  oauthParams.oauth_signature = signature

  const headerValue = 'OAuth ' + Object.entries(oauthParams)
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(', ')

  return headerValue
}

function pct(str: string): string {
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')
}

// ─── FACEBOOK ─────────────────────────────────────────────────────────────────

async function postToFacebook(
  title: string,
  excerpt: string | undefined,
  url: string,
  coverImage: string | undefined,
  pageId: string,
  pageToken: string
): Promise<any> {
  // Use the /feed endpoint with a link post — Facebook will auto-fetch OG metadata
  const message = excerpt ? `${title}\n\n${excerpt}` : title

  const body = new URLSearchParams({
    message,
    link: url,
    access_token: pageToken,
  })

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(10000),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${JSON.stringify(data)}`)
  return data
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function categoryToHashtag(category: string | undefined): string {
  const map: Record<string, string> = {
    'breaking-news': '#BreakingNews',
    politics: '#Politics',
    finance: '#Finance #Markets',
    crypto: '#Crypto #Bitcoin',
    technology: '#Tech',
    sports: '#Sports',
    business: '#Business',
    health: '#Health',
    entertainment: '#Entertainment',
    world: '#WorldNews',
  }
  return map[category || ''] || '#News #YUP'
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
