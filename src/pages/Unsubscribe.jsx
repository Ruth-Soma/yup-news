import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'already' | 'invalid' | 'error'

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }

    supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('unsubscribe_token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        if (!data.is_active) { setStatus('already'); return }

        supabase
          .from('subscribers')
          .update({ is_active: false })
          .eq('id', data.id)
          .then(({ error: updateError }) => {
            setStatus(updateError ? 'error' : 'success')
          })
      })
  }, [token])

  const messages = {
    loading: {
      heading: 'Processing…',
      body: 'Please wait while we update your preferences.',
    },
    success: {
      heading: "You've been unsubscribed.",
      body: "You won't receive any more newsletters from YUP. We're sorry to see you go.",
    },
    already: {
      heading: 'Already unsubscribed.',
      body: 'This email address is not currently receiving newsletters from YUP.',
    },
    invalid: {
      heading: 'Link not recognised.',
      body: 'This unsubscribe link is invalid or has expired. Please contact us if you need help.',
    },
    error: {
      heading: 'Something went wrong.',
      body: 'We could not process your request. Please try again or contact us.',
    },
  }

  const { heading, body } = messages[status] || messages.error

  return (
    <>
      <SEO title="Unsubscribe" description="Manage your YUP newsletter subscription." url="/unsubscribe" />
      <Header />

      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center py-24">
          {status === 'loading' ? (
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          ) : (
            <div
              className={`w-12 h-12 rounded-full mx-auto mb-8 flex items-center justify-center text-xl ${
                status === 'success'
                  ? 'bg-green-100 text-green-600'
                  : status === 'already'
                  ? 'bg-g100 text-g500'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {status === 'success' || status === 'already' ? '✓' : '×'}
            </div>
          )}

          <h1 className="font-serif font-bold text-2xl text-ink mb-3 leading-tight">{heading}</h1>
          <p className="font-sans text-[0.88rem] text-g500 leading-relaxed mb-8">{body}</p>

          <Link
            to="/"
            className="inline-block border border-ink text-ink font-sans text-[0.75rem] font-semibold uppercase tracking-[0.12em] px-6 py-3 hover:bg-ink hover:text-paper transition-colors"
          >
            Back to YUP
          </Link>
        </div>
      </main>

      <Footer />
    </>
  )
}
