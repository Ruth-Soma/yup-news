import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { otpEmail } from '../_shared/emailTemplates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const emailRes = await fetch('https://api.mailgun.net/v3/mg.yup.ng/messages', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
      body: form,
    })

    if (!emailRes.ok) {
      const errData = await emailRes.text()
      throw new Error(`Email send failed: ${errData}`)
    }

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
