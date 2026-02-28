import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function NotFound() {
  return (
    <>
      <SEO title="404 — Page Not Found" description="The page you're looking for doesn't exist." />
      <Header />
      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-32 md:py-48 max-w-[560px]">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
            404
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            Page not found.
          </h1>
          <p className="text-[1rem] text-g500 font-light leading-[1.65] mb-10">
            The story you're looking for has moved, been removed, or never existed. Try the homepage or search for what you need.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="bg-ink text-paper text-[0.72rem] font-sans font-medium uppercase tracking-[0.1em] px-6 py-3 hover:opacity-75 transition-opacity"
            >
              Back to Home
            </Link>
            <Link
              to="/search"
              className="text-[0.72rem] font-mono text-g500 hover:text-ink transition-colors uppercase tracking-[0.1em]"
            >
              Search →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
