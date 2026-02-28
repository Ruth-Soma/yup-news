import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, X, Menu, Sun, Moon, Bookmark } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'

const NAV_ITEMS = [
  { to: '/region/global', label: 'World' },
  { to: '/region/us', label: 'United States' },
  { to: '/region/china', label: 'China' },
  { to: '/category/technology', label: 'Technology' },
  { to: '/category/business', label: 'Business' },
  { to: '/markets', label: 'Markets', highlight: true },
  { to: '/category/crypto', label: 'Crypto' },
  { to: '/category/politics', label: 'Politics' },
  { to: '/category/sports', label: 'Sports' },
]

// ─── Subscribe dropdown ───────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

function callFn(name, body) {
  return fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(body),
  }).then(r => r.json())
}

function SubscribeDropdown({ onClose }) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pendingId, setPendingId] = useState('')
  // idle | sending | otp | verifying | done | error | otp_error
  const [status, setStatus] = useState('idle')
  const [errMsg, setErrMsg] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrMsg('')
    const data = await callFn('send-subscribe-otp', { email })
    if (data.success) {
      setPendingId(data.pending_id)
      setStatus('otp')
    } else {
      setErrMsg(data.error || 'Something went wrong.')
      setStatus('error')
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    if (!otp.trim()) return
    setStatus('verifying')
    setErrMsg('')
    const data = await callFn('verify-subscribe', { pending_id: pendingId, otp })
    if (data.success) {
      setStatus('done')
    } else {
      setErrMsg(data.error || 'Incorrect code. Please try again.')
      setStatus('otp_error')
    }
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-paper border border-g200 shadow-lg p-5 z-50"
    >
      {status === 'done' ? (
        <div className="text-center py-2">
          <p className="text-[0.88rem] font-sans font-medium text-ink mb-1">You're subscribed!</p>
          <p className="text-[0.75rem] font-sans text-g500">Welcome aboard. Expect great stories daily.</p>
          <button onClick={onClose} className="mt-3 text-[0.7rem] font-mono text-g400 hover:text-ink transition-colors uppercase tracking-[0.1em]">Close</button>
        </div>
      ) : status === 'otp' || status === 'verifying' || status === 'otp_error' ? (
        <>
          <p className="text-[0.78rem] font-sans text-g600 mb-3 leading-[1.5]">
            We sent a 6-digit code to <strong className="text-ink">{email}</strong>.
          </p>
          <form onSubmit={handleOtpSubmit} className="flex gap-0 mb-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); if (status === 'otp_error') setStatus('otp') }}
              placeholder="000000"
              required
              disabled={status === 'verifying'}
              autoFocus
              className="flex-1 border border-g300 px-3 py-2.5 text-sm font-mono tracking-[0.25em] bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'verifying' || otp.length < 6}
              className="bg-ink text-paper text-[0.7rem] font-mono uppercase tracking-[0.1em] px-4 border border-ink hover:opacity-80 transition-opacity flex-shrink-0 disabled:opacity-50"
            >
              {status === 'verifying' ? '...' : 'Verify'}
            </button>
          </form>
          {status === 'otp_error' && (
            <p className="text-[0.72rem] font-sans text-red-500 mb-2">{errMsg}</p>
          )}
          <button
            onClick={() => { setStatus('idle'); setOtp(''); setErrMsg('') }}
            className="text-[0.7rem] font-mono text-g400 hover:text-ink transition-colors underline"
          >
            Use a different email
          </button>
        </>
      ) : (
        <>
          <p className="text-[0.72rem] font-mono uppercase tracking-[0.14em] text-g500 mb-3">Daily Briefing</p>
          <p className="text-[0.82rem] font-sans text-g600 mb-4 leading-[1.5]">
            Top stories from the US, China, and the world — every morning.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'sending'}
              autoFocus
              className="flex-1 border border-g300 px-3 py-2.5 text-sm font-sans bg-paper text-ink outline-none focus:border-ink transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-ink text-paper text-[0.7rem] font-mono uppercase tracking-[0.1em] px-4 border border-ink hover:opacity-80 transition-opacity flex-shrink-0 disabled:opacity-50"
            >
              {status === 'sending' ? '...' : 'Subscribe'}
            </button>
          </form>
          {(status === 'error') && (
            <p className="text-[0.72rem] font-sans text-red-500 mt-2">{errMsg}</p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useDarkMode()
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSubscribeOpen(false)
        setMenuOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-g200">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 h-[60px]">

        {/* Logo */}
        <Link
          to="/"
          className="font-sans font-medium text-[1.25rem] tracking-[-0.02em] text-ink hover:opacity-70 transition-opacity flex-shrink-0"
          style={{ letterSpacing: '-0.01em' }}
        >
          yup
        </Link>

        {/* Desktop center nav */}
        <nav className="hidden md:flex items-center gap-0">
          {NAV_ITEMS.map(item => (
            item.highlight ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-[0.7rem] font-sans font-medium uppercase tracking-[0.12em] px-3 mx-1 h-8 flex items-center transition-all rounded-sm border-b-[2px] border-transparent ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-[0.7rem] font-sans font-medium uppercase tracking-[0.12em] px-3 lg:px-4 h-[60px] flex items-center transition-all border-b-[2px] ${
                    isActive
                      ? 'text-ink border-ink'
                      : 'text-g500 border-transparent hover:text-ink hover:bg-g100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-shrink-0 relative">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden md:flex text-g500 hover:text-ink transition-colors p-1"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
          >
            <Search size={17} strokeWidth={1.7} />
          </button>

          {/* Bookmarks */}
          <Link
            to="/bookmarks"
            className="hidden md:flex text-g500 hover:text-ink transition-colors p-1"
            aria-label="Reading list"
          >
            <Bookmark size={17} strokeWidth={1.7} />
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="hidden md:flex text-g500 hover:text-ink transition-colors p-1"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={17} strokeWidth={1.7} /> : <Moon size={17} strokeWidth={1.7} />}
          </button>

          {/* Subscribe pill */}
          <button
            onClick={() => setSubscribeOpen(v => !v)}
            className="hidden md:inline-flex items-center justify-center bg-ink text-paper text-[0.7rem] font-sans font-medium uppercase tracking-[0.1em] px-5 h-9 rounded-full hover:opacity-75 transition-opacity"
          >
            Subscribe
          </button>

          {subscribeOpen && (
            <SubscribeDropdown onClose={() => setSubscribeOpen(false)} />
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-ink p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-g200 px-4 sm:px-6 md:px-8 lg:px-12">
          <form onSubmit={handleSearch} className="flex items-center gap-3 h-[48px]">
            <Search size={14} className="text-g400 shrink-0" strokeWidth={1.7} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stories..."
              className="flex-1 bg-transparent text-sm font-sans outline-none placeholder-g400"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setQuery('') }}
              className="text-xs font-mono text-g400 hover:text-ink transition-colors shrink-0"
            >
              esc
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-g200 bg-paper px-6 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between py-2.5 text-sm font-sans border-b border-g200 last:border-0 ${
                item.highlight ? 'text-emerald-700 font-medium' : 'text-ink'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.label}</span>
              {item.highlight && (
                <span className="text-[0.55rem] font-mono uppercase tracking-widest bg-emerald-100 text-emerald-700 px-1.5 py-0.5">
                  Trader
                </span>
              )}
            </Link>
          ))}
          <Link
            to="/bookmarks"
            className="flex items-center justify-between w-full py-2.5 text-sm font-sans text-ink border-b border-g200"
            onClick={() => setMenuOpen(false)}
          >
            <span>Reading List</span>
            <Bookmark size={15} />
          </Link>
          <button
            onClick={() => setDark(d => !d)}
            className="flex items-center justify-between w-full py-2.5 text-sm font-sans text-ink border-b border-g200"
          >
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link
            to="/#newsletter"
            className="block mt-4 text-center bg-ink text-paper text-sm font-sans font-medium py-2.5 rounded-full"
            onClick={() => setMenuOpen(false)}
          >
            Subscribe
          </Link>
        </div>
      )}
    </header>
  )
}
