import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function callFn(name, body) {
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

const BUDGET_OPTIONS = [
  'Under $500',
  '$500 – $2,000',
  '$2,000 – $5,000',
  '$5,000 – $10,000',
  'Over $10,000',
  'Prefer not to say',
]

function AdvertiseForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')

    const body = [
      company && `Company: ${company}`,
      budget && `Budget: ${budget}`,
      '',
      message,
    ].filter(Boolean).join('\n')

    const data = await callFn('send-contact', {
      name,
      email,
      subject: 'Advertising Enquiry',
      message: body,
    })

    if (data.success) {
      setStatus('done')
    } else {
      setErrMsg(data.error || 'Something went wrong. Please email info@yup.ng directly.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="py-10 border-t border-g200 max-w-[560px]">
        <p className="font-serif text-xl text-ink mb-2">Message sent.</p>
        <p className="text-[0.85rem] font-sans text-g500">
          Thanks for reaching out. We typically respond within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="py-10 border-t border-g200 max-w-[560px] space-y-5">
      <h2 className="font-serif font-bold text-[1.4rem] text-ink tracking-[-0.015em]">Get in touch</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 mb-1.5">
            Name <span className="text-breaking">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={status === 'sending'}
            className="w-full border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 mb-1.5">
            Email <span className="text-breaking">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={status === 'sending'}
            className="w-full border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 mb-1.5">
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            disabled={status === 'sending'}
            className="w-full border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
            placeholder="Company name"
          />
        </div>
        <div>
          <label className="block text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 mb-1.5">
            Monthly budget
          </label>
          <select
            value={budget}
            onChange={e => setBudget(e.target.value)}
            disabled={status === 'sending'}
            className="w-full border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50 appearance-none"
          >
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[0.65rem] font-mono uppercase tracking-[0.12em] text-g500 mb-1.5">
          Message <span className="text-breaking">*</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={5}
          disabled={status === 'sending'}
          className="w-full border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors resize-none disabled:opacity-50"
          placeholder="Tell us about your campaign goals, target audience, and any specific requirements..."
        />
      </div>

      {status === 'error' && (
        <p className="text-[0.75rem] font-sans text-red-500">{errMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-ink text-paper text-[0.72rem] font-sans font-medium uppercase tracking-[0.12em] px-8 py-3 hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  )
}

export default function Advertise() {
  return (
    <>
      <SEO
        title="Advertise on YUP"
        description="Reach a global audience of news readers. Advertise with YUP."
      />
      <Header />

      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-14 md:py-20 border-b border-g200 max-w-[720px]">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-5">
            Advertise
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.75rem)' }}
          >
            Reach readers<br />who pay attention.
          </h1>
        </div>

        <div className="article-body max-w-[720px] py-12">
          <p>
            YUP delivers breaking news from the US, China, and the world — updated every 30 minutes. Our readers are curious, informed, and engaged. They come for clarity. That's your audience.
          </p>

          <h2>Who We Reach</h2>
          <p>
            Our readership spans professionals, students, and business communities across China, the United States, the United Kingdom, and beyond — with a particular strength in Chinese and US news coverage.
          </p>

          <h2>Ad Formats</h2>
          <p>
            We offer a small number of high-visibility placements to keep the reading experience clean:
          </p>
          <ul>
            <li><strong>Sponsored Story</strong> — A clearly labelled article written in YUP's editorial voice, published in the regular news feed.</li>
            <li><strong>Banner Placement</strong> — Above-the-fold and in-article positions, desktop and mobile.</li>
            <li><strong>Newsletter Sponsorship</strong> — A single sponsor mention in our daily briefing email.</li>
          </ul>
        </div>

        <AdvertiseForm />
      </main>

      <Footer />
    </>
  )
}
