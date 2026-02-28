import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function About() {
  return (
    <>
      <SEO
        title="About YUP"
        description="YUP is an AI-assisted news publication covering the United States, China, and the world — updated every 30 minutes."
      />
      <Header />
      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-14 md:py-20 border-b border-g200 max-w-[720px]">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-5">
            About
          </div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.75rem)' }}
          >
            News that matters,<br />told clearly.
          </h1>
        </div>

        <div className="article-body max-w-[720px] py-12">
          <p>
            YUP is a fast, minimal news publication powered by AI-assisted journalism. We aggregate and rewrite stories from trusted sources across the United States, China, and the world — publishing new articles every 30 minutes, around the clock.
          </p>

          <h2>Our Mission</h2>
          <p>
            We believe that good journalism should be readable — no bloated ad layouts, no autoplay videos, no cookie banners hiding the first paragraph. YUP is built for people who want to know what's happening, quickly and clearly.
          </p>

          <h2>How We Work</h2>
          <p>
            Our crawler monitors a curated list of RSS feeds from established news sources. When a story breaks, our AI system rewrites it in YUP's voice — factual, concise, and free of filler — and publishes it within minutes. Every article links to the original source.
          </p>
          <p>
            Human editors review flagged content and maintain the list of active sources. We do not publish unverified rumors or opinion as news.
          </p>

          <h2 id="editorial-policy">Editorial Policy</h2>
          <p>
            We cover news, not noise. Our source list prioritizes publications with established editorial standards. AI-generated articles are labeled with an "AI" badge in the admin dashboard. We correct errors promptly — if you spot one, please reach out.
          </p>

          <h2>Contact</h2>
          <p>
            For corrections, press inquiries, or partnership requests, write to us at <a href="mailto:info@yup.ng">info@yup.ng</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
