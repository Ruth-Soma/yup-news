import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

const SUBJECTS = [
  'General enquiry',
  'Editorial feedback',
  'Story correction',
  'Press & partnerships',
  'Advertising',
  'Technical issue',
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('')

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('done')
        setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
      } else {
        setErrMsg(data.error || 'Something went wrong.')
        setStatus('error')
      }
    } catch {
      setErrMsg('Network error. Please try again or email info@yup.ng directly.')
      setStatus('error')
    }
  }

  const inputCls = 'w-full border border-g200 px-4 py-3 text-[0.88rem] font-sans text-ink placeholder:text-g300 focus:outline-none focus:border-g400 bg-white transition-colors'

  return (
    <>
      <SEO title="Contact — YUP" description="Get in touch with the YUP editorial team." url="/contact" />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="max-w-[720px] mx-auto py-16 md:py-24">

          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
            Contact
          </div>

          <h1
            className="font-serif font-bold text-ink leading-[1.06] tracking-[-0.025em] mb-4"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}
          >
            Get in touch.
          </h1>
          <p className="text-[0.9rem] font-sans text-g500 font-light leading-[1.65] mb-12">
            For editorial enquiries, corrections, press, or partnerships. We aim to respond within 48 hours.
            Prefer email? <a href="mailto:info@yup.ng" className="text-ink underline underline-offset-4 decoration-g300 hover:decoration-ink transition-colors">info@yup.ng</a>
          </p>

          {status === 'done' ? (
            <div className="border border-g200 p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg mx-auto mb-4">✓</div>
              <p className="font-serif font-bold text-xl text-ink mb-2">Message sent.</p>
              <p className="text-[0.88rem] font-sans text-g500">We'll get back to you within 48 hours.</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-6 text-[0.72rem] font-mono uppercase tracking-[0.1em] text-g400 hover:text-ink transition-colors"
              >
                Send another →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update('name')}
                    required
                    maxLength={80}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    required
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-2">Subject</label>
                <select value={form.subject} onChange={update('subject')} className={inputCls}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[0.65rem] font-mono uppercase tracking-[0.14em] text-g500 mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  required
                  maxLength={2000}
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {status === 'error' && (
                <p className="text-[0.78rem] font-sans text-red-500">{errMsg}</p>
              )}

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-[0.72rem] font-sans text-g400">We respect your privacy.</p>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="bg-ink text-paper text-[0.78rem] font-mono uppercase tracking-[0.1em] px-8 py-3 hover:opacity-75 transition-opacity disabled:opacity-40"
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
