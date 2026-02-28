import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { otpEmail } from '../_shared/emailTemplates.ts'

const SITE_URL = 'https://yup.ng'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Try Mailgun US endpoint, then EU endpoint as fallback
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
  if (!mailgunKey) throw new Error('MAILGUN_API_KEY not configured')

  const form = new FormData()
  form.append('from', 'YUP News <newsletter@yup.ng>')
  form.append('to', to)
  form.append('subject', subject)
  form.append('html', html)

  // Try US then EU Mailgun region
  for (const base of ['https://api.mailgun.net', 'https://api.eu.mailgun.net']) {
    const res = await fetch(`${base}/v3/mg.yup.ng/messages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
      body: form,
    })
    if (res.ok) return
    const errText = await res.text()
    console.error(`Mailgun ${base} error:`, errText)
    // Only try EU if US returns a domain/routing error (not auth)
    if (res.status === 401 || res.status === 403) throw new Error(`Mailgun auth failed: ${errText}`)
  }
  throw new Error('Mailgun failed on both US and EU endpoints')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email } = await req.json()

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return json({ error: 'Please enter a valid email address.' }, 400)
    }

    const normalised = email.trim().toLowerCase()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Already subscribed?
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', normalised)
      .maybeSingle()

    if (existing?.is_active) {
      return json({ error: 'This email is already subscribed.' }, 409)
    }

    // Rate limit: max 3 requests per email per 15 minutes
    const { count } = await supabase
      .from('pending_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('email', normalised)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

    if ((count || 0) >= 3) {
      return json({ error: 'Too many requests. Please wait 15 minutes and try again.' }, 429)
    }

    // Delete old pending for this email
    await supabase.from('pending_subscribers').delete().eq('email', normalised)

    // Generate OTP + verify token
    const otp = (crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000).toString()
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { data: pending, error: insertError } = await supabase
      .from('pending_subscribers')
      .insert({ email: normalised, otp, expires_at })
      .select('id, verify_token')
      .single()

    if (insertError) throw insertError

    const verifyLink = `${SITE_URL}/subscribed?token=${pending.verify_token}&email=${encodeURIComponent(normalised)}`
    const html = otpEmail({
      otp,
      heading: 'Confirm your subscription',
      subheading: 'Enter the code below to start receiving your daily YUP briefing.',
      note: `Or skip the code and <a href="${verifyLink}" style="color:#555;text-decoration:underline;">click here to confirm with one tap</a>. If you didn't request this, you can safely ignore this email.`,
    })

    await sendEmail(normalised, `${otp} — confirm your YUP subscription`, html)

    return json({ success: true, pending_id: pending.id }, 200)

  } catch (err: any) {
    console.error('send-subscribe-otp error:', err)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
