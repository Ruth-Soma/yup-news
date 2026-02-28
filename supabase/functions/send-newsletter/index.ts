import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { newsletterEmail } from '../_shared/emailTemplates.ts'

const SITE_URL = 'https://yup.ng'
const BATCH_SIZE = 50  // concurrent sends per batch

serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
  if (!mailgunKey) {
    return new Response(JSON.stringify({ error: 'MAILGUN_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const logs: string[] = []
  let sentCount = 0
  let failedCount = 0

  try {
    // 1. Fetch top 7 posts published in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('title, slug, excerpt, cover_image, category, source_name, published_at')
      .eq('status', 'published')
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(7)

    if (postsError) throw postsError

    if (!posts || posts.length === 0) {
      logs.push('No new posts in the last 24 hours — newsletter not sent')
      return new Response(JSON.stringify({ success: true, sent: 0, logs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    logs.push(`Found ${posts.length} posts for newsletter`)

    // 2. Fetch all active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from('subscribers')
      .select('email, unsubscribe_token')
      .eq('is_active', true)

    if (subsError) throw subsError
    if (!subscribers || subscribers.length === 0) {
      logs.push('No active subscribers')
      return new Response(JSON.stringify({ success: true, sent: 0, logs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    logs.push(`Sending to ${subscribers.length} subscribers`)

    // 3. Format date for email header
    const date = new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // 4. Send in batches to avoid timeouts
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (sub) => {
          const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.unsubscribe_token}`
          const html = newsletterEmail({ posts, date, unsubscribeUrl })

          const form = new FormData()
          form.append('from', 'YUP News <newsletter@yup.ng>')
          form.append('to', sub.email)
          form.append('subject', `Your YUP Daily Briefing — ${date}`)
          form.append('html', html)

          const res = await fetch('https://api.mailgun.net/v3/mg.yup.ng/messages', {
            method: 'POST',
            headers: { Authorization: `Basic ${btoa('api:' + mailgunKey)}` },
            body: form,
          })

          if (res.ok) {
            sentCount++
          } else {
            failedCount++
            const errText = await res.text()
            logs.push(`Failed ${sub.email}: ${errText.substring(0, 80)}`)
          }
        })
      )

      // Small gap between batches
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    logs.push(`Done: ${sentCount} sent, ${failedCount} failed`)

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount, posts: posts.length, logs }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('send-newsletter error:', err)
    return new Response(
      JSON.stringify({ success: false, error: err.message, logs }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
