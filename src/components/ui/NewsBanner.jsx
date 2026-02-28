import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const POLL_INTERVAL = 60_000      // check every 60 s
const BANNER_TTL    = 8_000       // auto-dismiss after 8 s
const BOTTOM_THRESHOLD = 0.6     // show only when scrolled past 60% of page

export default function NewsBanner() {
  const [banner, setBanner] = useState(null)   // { id, title, slug, category, cover_image }
  const [visible, setVisible] = useState(false)
  const [atBottom, setAtBottom] = useState(false)
  const dismissTimer = useRef(null)
  const latestSeenAt = useRef(sessionStorage.getItem('yup_latest_seen') || new Date().toISOString())
  const navigate = useNavigate()
  const location = useLocation()

  // Track scroll depth
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const ratio = (el.scrollTop + el.clientHeight) / el.scrollHeight
      setAtBottom(ratio >= BOTTOM_THRESHOLD)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    clearTimeout(dismissTimer.current)
    setTimeout(() => setBanner(null), 400) // wait for exit animation
  }, [])

  // Show banner when atBottom + new article queued
  useEffect(() => {
    if (atBottom && banner && !visible) {
      setVisible(true)
      clearTimeout(dismissTimer.current)
      dismissTimer.current = setTimeout(dismiss, BANNER_TTL)
    }
  }, [atBottom, banner, visible, dismiss])

  // Poll for new articles
  useEffect(() => {
    async function poll() {
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, category, cover_image, published_at')
        .eq('status', 'published')
        .gt('published_at', latestSeenAt.current)
        .order('published_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const newest = data[0]
        // Don't show banner for the article currently being read
        if (!location.pathname.endsWith(newest.slug)) {
          setBanner(newest)
          latestSeenAt.current = newest.published_at
          sessionStorage.setItem('yup_latest_seen', newest.published_at)
        }
      }
    }

    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [location.pathname])

  if (!banner) return null

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] w-[320px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0'
      }`}
      role="alert"
    >
      <div className="bg-ink text-white shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <span className="text-[0.58rem] font-mono uppercase tracking-[0.14em] text-white/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse inline-block" />
            Breaking Now
          </span>
          <button
            onClick={dismiss}
            className="text-white/40 hover:text-white transition-colors text-[0.7rem] font-mono leading-none pb-0.5"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <button
          onClick={() => { dismiss(); navigate(`/post/${banner.slug}`) }}
          className="w-full text-left flex items-start gap-3 px-3 pb-3 group"
        >
          {banner.cover_image && (
            <div className="w-14 h-10 flex-shrink-0 overflow-hidden bg-white/10 mt-0.5">
              <img
                src={banner.cover_image}
                alt=""
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[0.6rem] font-mono uppercase tracking-[0.1em] text-white/50 mb-0.5">
              {banner.category?.replace(/-/g, ' ')}
            </div>
            <p className="text-[0.82rem] font-serif font-semibold leading-[1.3] text-white group-hover:text-white/85 transition-colors line-clamp-2">
              {banner.title}
            </p>
          </div>
        </button>

        {/* Progress bar auto-dismiss */}
        {visible && (
          <div
            className="h-[2px] bg-white/20 origin-left"
            style={{ animation: `shrink ${BANNER_TTL}ms linear forwards` }}
          />
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}
