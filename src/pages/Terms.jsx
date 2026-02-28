import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function Terms() {
  return (
    <>
      <SEO title="Terms of Use — YUP" description="Terms and conditions for using YUP." />
      <Header />
      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-14 border-b border-g200 max-w-[720px]">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-5">Legal</div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Terms of Use
          </h1>
          <p className="mt-4 text-[0.72rem] font-mono text-g500">Last updated: February 2026</p>
        </div>

        <div className="article-body max-w-[720px] py-12">
          <p>
            By accessing yupnews.com, you agree to be bound by these terms. If you do not agree, please do not use the site.
          </p>

          <h2>Content</h2>
          <p>
            All articles published on YUP are either original AI-assisted rewrites of publicly available news or original editorial content. Original source articles are credited and linked. Content is provided for informational purposes only and does not constitute legal, financial, or professional advice.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            The YUP name, logo, and original editorial content are owned by YUP Media Ltd. You may share links to our articles freely. Reproducing full article text without attribution is not permitted.
          </p>

          <h2>Accuracy</h2>
          <p>
            We strive for accuracy but cannot guarantee that all information on this site is current, complete, or error-free. AI-assisted articles are reviewed but may contain mistakes. If you identify an error, please contact us so we can correct it promptly.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            YUP Media Ltd. is not liable for any damages arising from your use of or reliance on content published on this site.
          </p>

          <h2>Governing Law</h2>
          <p>
            These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of English courts.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms? Write to <a href="mailto:info@yup.ng">info@yup.ng</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
