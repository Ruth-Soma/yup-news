import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Escape HTML special chars to prevent XSS/injection in email body */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Strip CR and LF to prevent CRLF header injection in email headers */
function safeHeader(str: string): string {
  return str.replace(/[\r\n]/g, ' ')
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

    // Length caps to prevent abuse
    const rawName    = name.trim().substring(0, 100)
    const rawEmail   = email.trim().substring(0, 254)
    const rawSubject = (subject || 'General enquiry').trim().substring(0, 200)
    const rawMessage = message.trim().substring(0, 5000)

    const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
    if (!mailgunKey) return json({ error: 'Contact form is temporarily unavailable. Please email info@yup.ng directly.' }, 503)

    // HTML-escaped values for embedding in email HTML
    const safeName    = escHtml(rawName)
    const safeEmail   = escHtml(rawEmail)
    const safeSubject = escHtml(rawSubject)
    const safeMessage = escHtml(rawMessage)

    // CRLF-stripped values for email headers
    const headerSubject = safeHeader(rawSubject)
    const headerReplyTo = safeHeader(rawEmail)

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1a1a1a; padding: 20px 28px;">
          <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #f0ede6;">yup</span>
          <span style="font-family: Arial, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(240,237,230,0.45); margin-left: 12px;">Contact Form</span>
        </div>
        <div style="background: #fff; padding: 32px 28px; border: 1px solid #e2dfd7; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px;">
            <tr><td style="padding: 8px 0; color: #999; width: 80px;">From</td><td style="padding: 8px 0; font-weight: 600;">${safeName} &lt;${safeEmail}&gt;</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Subject</td><td style="padding: 8px 0;">${safeSubject}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2dfd7; margin: 20px 0;" />
          <p style="font-size: 14px; line-height: 1.7; color: #333; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <div style="padding: 16px 28px; background: #f7f6f2; border: 1px solid #e2dfd7; border-top: none;">
          <p style="font-family: Arial, sans-serif; font-size: 11px; color: #aaa; margin: 0;">Reply directly to this email to respond to ${safeEmail}.</p>
        </div>
      </div>
    `

    const form = new FormData()
    form.append('from', 'YUP Contact <noreply@yup.ng>')
    form.append('to', 'info@yup.ng')
    form.append('subject', `[YUP Contact] ${headerSubject}`)
    form.append('html', html)
    form.append('h:Reply-To', headerReplyTo)

    // Try US then EU — mg.yup.ng may be registered in either Mailgun region
    let sent = false
    for (const base of ['https://api.mailgun.net', 'https://api.eu.mailgun.net']) {
      const res = await fetch(`${base}/v3/mg.yup.ng/messages`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
        body: form,
      })
      if (res.ok) { sent = true; break }
      const errText = await res.text()
      console.error(`send-contact Mailgun ${base} error:`, errText)
      if (res.status === 401) throw new Error(`Mailgun auth failed: ${errText}`)
    }
    if (!sent) throw new Error('Mailgun delivery failed on both US and EU endpoints')

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
