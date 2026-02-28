import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { name, email, subject, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return json({ error: 'Name, email and message are required.' }, 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return json({ error: 'Please enter a valid email address.' }, 400)
    }

    const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
    if (!mailgunKey) return json({ error: 'Contact form is temporarily unavailable. Please email info@yup.ng directly.' }, 503)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1a1a1a; padding: 20px 28px;">
          <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #f0ede6;">yup</span>
          <span style="font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(240,237,230,0.45); margin-left: 12px;">Contact Form</span>
        </div>
        <div style="background: #fff; padding: 32px 28px; border: 1px solid #e2dfd7; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px;">
            <tr><td style="padding: 8px 0; color: #999; width: 80px;">From</td><td style="padding: 8px 0; font-weight: 600;">${name.trim()} &lt;${email.trim()}&gt;</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Subject</td><td style="padding: 8px 0;">${(subject || 'General enquiry').trim()}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2dfd7; margin: 20px 0;" />
          <p style="font-size: 14px; line-height: 1.7; color: #333; margin: 0; white-space: pre-wrap;">${message.trim()}</p>
        </div>
        <div style="padding: 16px 28px; background: #f7f6f2; border: 1px solid #e2dfd7; border-top: none;">
          <p style="font-family: Arial, sans-serif; font-size: 11px; color: #aaa; margin: 0;">Reply directly to this email to respond to ${email.trim()}.</p>
        </div>
      </div>
    `

    const form = new FormData()
    form.append('from', 'YUP Contact <noreply@yup.ng>')
    form.append('to', 'info@yup.ng')
    form.append('subject', `[YUP Contact] ${(subject || 'General enquiry').trim()}`)
    form.append('html', html)
    form.append('h:Reply-To', email.trim())

    const res = await fetch('https://api.mailgun.net/v3/mg.yup.ng/messages', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
      body: form,
    })

    if (!res.ok) throw new Error(`Mailgun error: ${await res.text()}`)

    return json({ success: true }, 200)

  } catch (err: any) {
    console.error('send-contact error:', err)
    return json({ error: 'Something went wrong. Please try again or email info@yup.ng directly.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
