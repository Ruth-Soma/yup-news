import { Link } from 'react-router-dom'
import { CATEGORIES } from '@/lib/utils'

const SOCIAL = [
  { label: '𝕏', title: 'Twitter / X', href: import.meta.env.VITE_SOCIAL_TWITTER },
  { label: 'in', title: 'LinkedIn', href: import.meta.env.VITE_SOCIAL_LINKEDIN },
  { label: 'f', title: 'Facebook', href: import.meta.env.VITE_SOCIAL_FACEBOOK },
  { label: 'ig', title: 'Instagram', href: import.meta.env.VITE_SOCIAL_INSTAGRAM },
].filter(s => s.href)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-admin text-white px-[clamp(20px,4vw,72px)] mt-16">
      {/* Top grid */}
      <div className="footer-grid py-14 border-b border-white/10">
        {/* Brand */}
        <div>
          <Link to="/" className="block font-sans font-medium text-[1.25rem] tracking-[-0.02em] leading-none mb-[12px] text-white">
            yup
          </Link>
          <p className="text-[0.78rem] text-white/50 font-light leading-[1.65]">
            Breaking news from the US, China, and the world — updated every 30 minutes.
          </p>
        </div>

        {/* Sections */}
        <div>
          <div className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.14em] text-white/35 mb-[13px]">
            Sections
          </div>
          <ul className="flex flex-col gap-2">
            {CATEGORIES.slice(0, 8).map(cat => (
              <li key={cat.value}>
                <Link
                  to={`/category/${cat.value}`}
                  className="text-[0.82rem] text-white/55 hover:text-white transition-colors"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Regions */}
        <div>
          <div className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.14em] text-white/35 mb-[13px]">
            Regions
          </div>
          <ul className="flex flex-col gap-2">
            {[
              { to: '/region/africa',        label: 'Africa' },
              { to: '/region/antarctica',    label: 'Antarctica' },
              { to: '/region/asia',          label: 'Asia' },
              { to: '/region/oceania',       label: 'Australia / Oceania' },
              { to: '/region/europe',        label: 'Europe' },
              { to: '/region/north-america', label: 'North America' },
              { to: '/region/south-america', label: 'South America' },
            ].map(r => (
              <li key={r.label}>
                <Link to={r.to} className="text-[0.82rem] text-white/55 hover:text-white transition-colors">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.14em] text-white/35 mb-[13px]">
            Company
          </div>
          <ul className="flex flex-col gap-2">
            {[
              { to: '/about', label: 'About YUP' },
              { to: '/about#editorial-policy', label: 'Editorial Policy' },
              { to: '/advertise', label: 'Advertise' },
              { to: '/contact', label: 'Contact' },
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms of Use' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.to} className="text-[0.82rem] text-white/55 hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between py-[18px] flex-wrap gap-[10px]">
        <p className="font-mono text-[0.6rem] text-white/30">
          © {year} YUP Media Ltd. All rights reserved. AI-assisted journalism.
        </p>
        <div className="flex">
          {SOCIAL.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              className="w-8 h-8 flex items-center justify-center font-mono text-[0.6rem] text-white/40 border border-white/15 -ml-px relative transition-all hover:bg-white/15 hover:text-white hover:border-white/30 hover:z-10"
            >
              {s.label}
            </a>
          ))}
          <a
            href="https://clxwyydoeodozndyfkkv.supabase.co/functions/v1/rss"
            target="_blank"
            rel="noopener noreferrer"
            title="RSS Feed"
            className="w-8 h-8 flex items-center justify-center text-white/40 border border-white/15 -ml-px relative transition-all hover:bg-white/15 hover:text-white hover:border-white/30 hover:z-10"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 11a9 9 0 0 1 9 9"/>
              <path d="M4 4a16 16 0 0 1 16 16"/>
              <circle cx="5" cy="19" r="1"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
