import { Helmet } from 'react-helmet-async'

const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'YUP'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://yup.ng'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  article,
  breadcrumbs,
  isHomepage = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Breaking News`
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL
  const ogImage = image || DEFAULT_IMAGE

  // BreadcrumbList JSON-LD — shows breadcrumb trail in Google results
  const breadcrumbSchema = breadcrumbs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: `${SITE_URL}${b.url}`,
        })),
      }
    : null

  // WebSite schema for homepage — enables Google Sitelinks Search Box
  const websiteSchema = isHomepage
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: description || `${SITE_NAME} — Breaking News`,
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }
    : null

  const orgSchema = isHomepage
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: 200, height: 60 },
      }
    : null

  // NewsArticle schema
  const articleSchema = article
    ? {
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
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: 200, height: 60 },
        },
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        articleSection: article.category?.replace(/-/g, ' '),
        keywords: article.tags?.join(', '),
        isAccessibleForFree: true,
        inLanguage: 'en',
      }
    : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />

      {/* Tell Google to use full snippets and large image previews — critical for CTR */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Article-specific OG tags */}
      {article && (
        <>
          <meta property="article:published_time" content={article.published_at} />
          <meta property="article:modified_time" content={article.updated_at || article.published_at} />
          {article.category && <meta property="article:section" content={article.category.replace(/-/g, ' ')} />}
          {article.source_name && <meta property="article:author" content={article.source_name} />}
          {article.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@yupnews" />

      {/* Author and news_keywords — used by Google News crawler */}
      {article?.source_name && <meta name="author" content={article.source_name} />}
      {article?.tags?.length > 0 && (
        <meta name="news_keywords" content={article.tags.join(', ')} />
      )}

      {/* Structured data */}
      {articleSchema && (
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
      {websiteSchema && (
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      )}
      {orgSchema && (
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      )}
    </Helmet>
  )
}
