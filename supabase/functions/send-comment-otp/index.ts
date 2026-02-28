import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { otpEmail } from '../_shared/emailTemplates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── HMAC token helpers (shared with verify-comment-otp) ─────────────────────

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { post_id, name, email, content } = await req.json()

    if (!post_id || !name?.trim() || !email?.trim() || !content?.trim()) {
      return json({ error: 'All fields are required.' }, 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address.' }, 400)
    }

    if (content.trim().length < 3) {
      return json({ error: 'Comment is too short.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ── Subscriber fast-path: skip OTP for verified subscribers ──────────────
    // Check if this email is already a confirmed subscriber — if so, trust them
    // and issue a commenter token directly without requiring OTP verification.
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('email, name')
      .eq('email', email.trim().toLowerCase())
      .eq('confirmed', true)
      .maybeSingle()

    if (subscriber) {
      // Known subscriber — generate token and return immediately (no OTP email)
      const displayName = name.trim().substring(0, 80)
      const commenter_token = await generateCommenterToken(
        email.trim().toLowerCase(),
        displayName,
        secret
      )
      return json({ success: true, skip_otp: true, commenter_token }, 200)
    }

    // ── Standard OTP flow for non-subscribers ────────────────────────────────

    // Rate limit: max 3 requests per email in the last 15 minutes
    const { count } = await supabase
      .from('pending_comments')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.trim().toLowerCase())
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    if ((count || 0) >= 3) {
      return json({ error: 'Too many requests. Please wait 15 minutes and try again.' }, 429)
    }

    // Remove any existing pending for this email + post (avoid duplicate OTPs)
    await supabase
      .from('pending_comments')
      .delete()
      .eq('email', email.trim().toLowerCase())
      .eq('post_id', post_id)

    // Generate cryptographically random 6-digit OTP
    const otp = (crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000).toString()
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { data: pending, error: insertError } = await supabase
      .from('pending_comments')
      .insert({
        post_id,
        name: name.trim().substring(0, 80),
        email: email.trim().toLowerCase(),
        content: content.trim().substring(0, 1000),
        otp,
        expires_at,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    // Send verification email via Mailgun
    const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
    if (!mailgunKey) return json({ error: 'Email delivery is not configured yet. Please try again later.' }, 503)

    const form = new FormData()
    form.append('from', 'YUP News <noreply@yup.ng>')
    form.append('to', email.trim())
    form.append('subject', `${otp} is your YUP comment verification code`)
    form.append('html', otpEmail({
      otp,
      heading: 'Verify your comment',
      subheading: 'Enter the code below to publish your comment on YUP News.',
      note: "If you didn't request this, you can safely ignore this email. Your comment will not be posted.",
    }))

    // Try US then EU — mg.yup.ng may be registered in either Mailgun region
    let emailSent = false
    for (const base of ['https://api.mailgun.net', 'https://api.eu.mailgun.net']) {
      const emailRes = await fetch(`${base}/v3/mg.yup.ng/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
        body: form,
      })
      if (emailRes.ok) { emailSent = true; break }
      const errData = await emailRes.text()
      console.error(`send-comment-otp Mailgun ${base} error:`, errData)
      if (emailRes.status === 401) throw new Error(`Mailgun auth failed: ${errData}`)
    }
    if (!emailSent) throw new Error('Mailgun delivery failed on both US and EU endpoints')

    return json({ success: true, pending_id: pending.id }, 200)

  } catch (err: any) {
    console.error('send-comment-otp error:', err)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
