import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // Two modes: OTP entry { pending_id, otp } or link click { token, email }
    const { pending_id, otp, token, email } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let subscriberEmail: string

    if (token && email) {
      // Link-click mode: look up by token
      const { data: pending, error } = await supabase
        .from('pending_subscribers')
        .select('*')
        .eq('verify_token', token)
        .eq('email', email.trim().toLowerCase())
        .single()

      if (error || !pending) return json({ error: 'Invalid or expired verification link.' }, 400)
      if (new Date(pending.expires_at) < new Date()) return json({ error: 'This link has expired. Please subscribe again.' }, 400)

      subscriberEmail = pending.email
      await supabase.from('pending_subscribers').delete().eq('id', pending.id)

    } else if (pending_id && otp) {
      // OTP entry mode
      const { data: pending, error } = await supabase
        .from('pending_subscribers')
        .select('*')
        .eq('id', pending_id)
        .single()

      if (error || !pending) return json({ error: 'Verification session not found. Please try again.' }, 400)
      if (new Date(pending.expires_at) < new Date()) return json({ error: 'Code expired. Please subscribe again.' }, 400)

      // Timing-safe comparison
      const expected = new TextEncoder().encode(pending.otp)
      const provided = new TextEncoder().encode(otp.trim())
      let match = expected.length === provided.length
      for (let i = 0; i < Math.min(expected.length, provided.length); i++) {
        if (expected[i] !== provided[i]) match = false
      }
      if (!match) return json({ error: 'Incorrect code. Please try again.' }, 400)

      subscriberEmail = pending.email
      await supabase.from('pending_subscribers').delete().eq('id', pending.id)

    } else {
      return json({ error: 'Invalid request.' }, 400)
    }

    // Insert into subscribers (upsert in case they were previously inactive)
    const { error: subError } = await supabase
      .from('subscribers')
      .upsert(
        { email: subscriberEmail, is_active: true },
        { onConflict: 'email', ignoreDuplicates: false }
      )

    if (subError) throw subError

    return json({ success: true, email: subscriberEmail }, 200)

  } catch (err: any) {
    console.error('verify-subscribe error:', err)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
