import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SEO from '@/components/ui/SEO'

export default function Privacy() {
  return (
    <>
      <SEO title="Privacy Policy — YUP" description="How YUP collects and uses data." />
      <Header />
      <main className="px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="py-14 border-b border-g200 max-w-[720px]">
          <div className="text-[0.65rem] font-mono uppercase tracking-[0.16em] text-g500 mb-5">Legal</div>
          <h1
            className="font-serif font-bold text-ink leading-[1.08] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Privacy Policy
          </h1>
          <p className="mt-4 text-[0.72rem] font-mono text-g500">Last updated: February 2026</p>
        </div>

        <div className="article-body max-w-[720px] py-12">
          <p>
            YUP ("we", "us", "our") operates yupnews.com. This page explains what information we collect and how we use it.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We collect basic analytics data — page views, referrer URLs, and browser type — to understand how our publication is read. We do not collect personally identifiable information unless you voluntarily submit it (e.g., via the newsletter signup form).
          </p>
          <p>
            If you subscribe to our newsletter, we store your email address to send you updates. You can unsubscribe at any time using the link in any email we send.
          </p>

          <h2>Cookies</h2>
          <p>
            We use minimal cookies required for site functionality. We do not use advertising cookies or third-party tracking pixels.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our site is hosted on infrastructure that may log access requests. We use Supabase for our database and authentication. We embed fonts from Google Fonts, which may log your IP address when fonts are loaded.
          </p>

          <h2>Your Rights</h2>
          <p>
            You may request deletion of any personal data we hold about you at any time. To exercise this right, contact us at <a href="mailto:info@yup.ng">info@yup.ng</a>.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy from time to time. We will note the date of the most recent revision at the top of this page.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
