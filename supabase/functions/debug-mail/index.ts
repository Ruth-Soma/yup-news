import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async () => {
  const key = Deno.env.get('MAILGUN_API_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'No MAILGUN_API_KEY' }), { status: 500 })

  const results: Record<string, unknown> = { key_length: key.length, key_prefix: key.substring(0, 6) }

  for (const base of ['https://api.mailgun.net', 'https://api.eu.mailgun.net']) {
    const form = new FormData()
    form.append('from', 'YUP News <noreply@yup.ng>')
    form.append('to', 'rusomaokoye@gmail.com')
    form.append('subject', 'YUP Mail Test')
    form.append('text', 'This is a test email from YUP News Mailgun debug. If you see this, email delivery is working.')

    const res = await fetch(`${base}/v3/mg.yup.ng/messages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa('api:' + key)}` },
      body: form,
    })
    const body = await res.text()
    results[base] = { status: res.status, body }
    if (res.ok) break
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
