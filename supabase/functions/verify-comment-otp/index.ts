import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── HMAC token helpers (no DB table needed) ────────────────────────────────

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function generateCommenterToken(email: string, name: string, secret: string): Promise<string> {
  const payload = { email, name, ts: Date.now() }
  const msg = JSON.stringify(payload)
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return btoa(JSON.stringify({ ...payload, sig: sigB64 }))
}

async function verifyCommenterToken(
  token: string,
  secret: string
): Promise<{ email: string; name: string } | null> {
  try {
    const { email, name, ts, sig } = JSON.parse(atob(token))
    if (!email || !name || !ts || !sig) return null
    // Expire after 180 days
    if (Date.now() - ts > 180 * 24 * 60 * 60 * 1000) return null
    const payload = JSON.stringify({ email, name, ts })
    const key = await getKey(secret)
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload))
    return valid ? { email, name } : null
  } catch {
    return null
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ── Path B: Trusted submission with commenter_token ──────────────────────
    if (body.commenter_token) {
      const { commenter_token, post_id, name, content } = body

      if (!commenter_token || !post_id || !name?.trim() || !content?.trim()) {
        return json({ error: 'Missing fields.' }, 400)
      }

      if (content.trim().length < 3) {
        return json({ error: 'Comment is too short.' }, 400)
      }

      const commenter = await verifyCommenterToken(commenter_token, secret)
      if (!commenter) {
        return json({ error: 'Verification expired. Please verify your email again.', token_expired: true }, 401)
      }

      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id,
          name: name.trim().substring(0, 80),
          content: content.trim().substring(0, 1000),
          status: 'approved',
        })
        .select('id, name, content, created_at, status')
        .single()

      if (commentError) throw commentError

      notifyAdmin(name.trim(), content.trim(), Deno.env.get('ADMIN_EMAIL'), Deno.env.get('MAILGUN_API_KEY'))

      return json({ success: true, comment }, 200)
    }

    // ── Path A: OTP verification ─────────────────────────────────────────────
    const { pending_id, otp } = body

    if (!pending_id || !otp?.trim()) {
      return json({ error: 'Missing fields.' }, 400)
    }

    const { data: pending, error: fetchError } = await supabase
      .from('pending_comments')
      .select('*')
      .eq('id', pending_id)
      .single()

    if (fetchError || !pending) {
      return json({ error: 'Session not found. Please submit your comment again.' }, 404)
    }

    if (new Date(pending.expires_at) < new Date()) {
      await supabase.from('pending_comments').delete().eq('id', pending_id)
      return json({ error: 'Code expired. Please submit your comment again.' }, 410)
    }

    if (pending.attempts >= 5) {
      await supabase.from('pending_comments').delete().eq('id', pending_id)
      return json({ error: 'Too many incorrect attempts. Please submit your comment again.' }, 429)
    }

    const inputOtp = otp.trim()
    const isValid = inputOtp.length === pending.otp.length &&
      inputOtp.split('').every((c: string, i: number) => c === pending.otp[i])

    if (!isValid) {
      await supabase
        .from('pending_comments')
        .update({ attempts: pending.attempts + 1 })
        .eq('id', pending_id)
      const remaining = 4 - pending.attempts
      return json({
        error: `Incorrect code. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'No attempts remaining.'}`,
      }, 422)
    }

    // OTP valid — insert comment (auto-approved, OTP is proof of real email)
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: pending.post_id,
        name: pending.name,
        content: pending.content,
        status: 'approved',
      })
      .select('id, name, content, created_at, status')
      .single()

    if (commentError) throw commentError

    await supabase.from('pending_comments').delete().eq('id', pending_id)

    notifyAdmin(pending.name, pending.content, Deno.env.get('ADMIN_EMAIL'), Deno.env.get('MAILGUN_API_KEY'))

    // Generate long-lived token so they never need to OTP again
    const commenter_token = await generateCommenterToken(pending.email, pending.name, secret)

    return json({ success: true, comment, commenter_token }, 200)

  } catch (err: any) {
    console.error('verify-comment-otp error:', err)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function notifyAdmin(name: string, content: string, adminEmail?: string, mailgunKey?: string) {
  if (!adminEmail || !mailgunKey) return
  const form = new FormData()
  form.append('from', 'YUP News <noreply@yup.ng>')
  form.append('to', adminEmail)
  form.append('subject', 'New comment on YUP News')
  form.append('html', `<p><strong>${name}</strong> left a comment.</p><blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${content.substring(0, 300)}</blockquote><p><a href="https://yup.ng/admin/comments">View in admin →</a></p>`)
  fetch('https://api.mailgun.net/v3/mg.yup.ng/messages', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
    body: form,
  }).catch(() => {})
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
