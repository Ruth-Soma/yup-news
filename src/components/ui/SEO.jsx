import { Helmet } from 'react-helmet-async'

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'YUP'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://yup.ng'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

export default function SEO({ title, description, image, url, type = 'website', article }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Breaking News`
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL
  const ogImage = image || DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.seo_title || article.title,
            description: article.seo_description || article.excerpt,
            image: [article.cover_image || ogImage],
            datePublished: article.published_at,
            dateModified: article.updated_at || article.published_at,
            author: article.source_name
              ? { '@type': 'Organization', name: article.source_name, url: article.source_url || undefined }
              : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
            },
            url: canonical,
            mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
            articleSection: article.category?.replace(/-/g, ' '),
            keywords: article.tags?.join(', '),
            isAccessibleForFree: true,
          })}
        </script>
      )}
    </Helmet>
  )
}
