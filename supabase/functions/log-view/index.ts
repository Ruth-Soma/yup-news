/**
 * log-view — server-side view tracking with real IP capture and deduplication
 *
 * POST /functions/v1/log-view
 * Body: { post_id: string, session_id?: string, country?: string, country_code?: string }
 *
 * - Extracts real visitor IP from request headers (works behind Cloudflare / Render CDN)
 * - Deduplicates: same IP + post within 30 minutes does NOT count as a new view
 * - Stores ip_address, country, country_code, user_agent in page_views
 * - Calls increment_views to add 1 to posts.views
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { post_id, session_id, country, country_code } = body

    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Extract real IP ──────────────────────────────────────────────────────
    // Priority: Cloudflare > Render/proxy X-Forwarded-For > X-Real-IP > direct
    const ip =
      req.headers.get('cf-connecting-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0'

    const userAgent = req.headers.get('user-agent') || ''

    // Ignore obvious bots
    const botPattern = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|twitterbot|semrush|ahrefs|mj12|dataprovider/i
    if (botPattern.test(userAgent)) {
      return new Response(JSON.stringify({ ok: true, skipped: 'bot' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Supabase client (service role for writes) ────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Dedup check: same IP + post within 30 minutes ────────────────────────
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('page_views')
      .select('id')
      .eq('post_id', post_id)
      .eq('ip_address', ip)
      .gte('viewed_at', cutoff)
      .limit(1)
      .maybeSingle()

    if (recent) {
      // Already counted this view recently — don't inflate
      return new Response(JSON.stringify({ ok: true, skipped: 'dedup' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Insert view record ────────────────────────────────────────────────────
    await supabase.from('page_views').insert({
      post_id,
      ip_address: ip,
      country: country || null,
      country_code: country_code || null,
      user_agent: userAgent.substring(0, 300),
      session_id: session_id || null,
    })

    // ── Increment posts.views counter ─────────────────────────────────────────
    await supabase.rpc('increment_views', { post_id })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('log-view error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
