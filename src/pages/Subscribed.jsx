import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function Subscribed() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const email = params.get('email')

  // 'loading' | 'success' | 'already' | 'invalid' | 'error'
  const [status, setStatus] = useState(token && email ? 'loading' : 'invalid')
  const [confirmedEmail, setConfirmedEmail] = useState('')

  useEffect(() => {
    if (!token || !email) { setStatus('invalid'); return }

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token, email }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setConfirmedEmail(data.email)
          setStatus('success')
        } else if (data.error?.includes('already')) {
          setStatus('already')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('error'))
  }, [token, email])

  return (
    <>
      <SEO title="Subscribed" description="You are now subscribed to YUP News." url="/subscribed" />
      <Header />

      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center py-24">
          {status === 'loading' ? (
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          ) : (
            <div
              className={`w-14 h-14 rounded-full mx-auto mb-8 flex items-center justify-center text-2xl ${
                status === 'success' || status === 'already' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              }`}
            >
              {status === 'success' || status === 'already' ? '✓' : '×'}
            </div>
          )}

          {status === 'loading' && (
            <>
              <h1 className="font-serif font-bold text-2xl text-ink mb-3">Confirming your email…</h1>
              <p className="font-sans text-[0.88rem] text-g500">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <p className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-4">Email verified</p>
              <h1 className="font-serif font-bold text-3xl text-ink leading-tight mb-3">
                You're subscribed!
              </h1>
              {confirmedEmail && (
                <p className="font-sans text-[0.88rem] text-g500 mb-2">
                  We've confirmed <strong className="text-ink">{confirmedEmail}</strong>.
                </p>
              )}
              <p className="font-sans text-[0.88rem] text-g500 leading-relaxed mb-8">
                Your daily YUP briefing will land in your inbox every morning. Welcome aboard.
              </p>
              <Link
                to="/"
                className="inline-block bg-ink text-paper font-sans text-[0.75rem] font-semibold uppercase tracking-[0.12em] px-8 py-3 hover:opacity-75 transition-opacity"
              >
                Read Today's News →
              </Link>
            </>
          )}

          {status === 'already' && (
            <>
              <h1 className="font-serif font-bold text-2xl text-ink mb-3">Already subscribed</h1>
              <p className="font-sans text-[0.88rem] text-g500 leading-relaxed mb-8">
                This email is already on the list. You'll keep receiving your daily briefing.
              </p>
              <Link to="/" className="inline-block border border-ink text-ink font-sans text-[0.75rem] font-semibold uppercase tracking-[0.12em] px-6 py-3 hover:bg-ink hover:text-paper transition-colors">
                Back to YUP
              </Link>
            </>
          )}

          {(status === 'invalid' || status === 'error') && (
            <>
              <h1 className="font-serif font-bold text-2xl text-ink mb-3">Link not valid</h1>
              <p className="font-sans text-[0.88rem] text-g500 leading-relaxed mb-8">
                This confirmation link has expired or is invalid. Please subscribe again.
              </p>
              <Link to="/" className="inline-block border border-ink text-ink font-sans text-[0.75rem] font-semibold uppercase tracking-[0.12em] px-6 py-3 hover:bg-ink hover:text-paper transition-colors">
                Back to YUP
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
