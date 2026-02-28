# YUP — AI-Powered Breaking News Blog

A fully automated, SEO-optimized news blog that crawls the internet for breaking news across the US, Nigeria, and globally — then publishes, formats, and manages content automatically. Built with React.js, Tailwind CSS, a modern black-and-white editorial design, mobile-first responsiveness, and a WordPress-style admin dashboard.

---

## Project Overview

YUP fetches real-time breaking news from trusted RSS feeds and news APIs, rewrites them using AI for SEO optimization, stores everything in Supabase, and displays them on a fast React.js frontend. The automation runs entirely on Supabase Edge Functions — no separate server needed. Editors can log in to a dashboard to review posts, track analytics, manage categories, and publish manually when needed.

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React.js 18 + Vite                              |
| Styling       | Tailwind CSS v3                                 |
| Routing       | React Router v6                                 |
| Database      | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI Rewriting  | OpenAI GPT-4o / Anthropic Claude API            |
| News Sources  | NewsAPI, GNews API, RSS Feeds                   |
| Automation    | Supabase Edge Functions (Deno) + pg_cron        |
| SEO           | React Helmet Async + JSON-LD Schema.org         |
| Analytics     | Supabase + custom page view tracking            |
| Charts        | Recharts                                        |
| Rich Editor   | Tiptap                                          |
| Hosting       | Vercel / Netlify (static React build)           |
| Image Storage | Supabase Storage                                |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                   │
│                                                      │
│  ┌─────────────────┐    ┌──────────────────────┐    │
│  │  Edge Function  │    │   PostgreSQL Tables  │    │
│  │  (Crawler +     │───▶│  posts, categories,  │    │
│  │   AI Rewriter)  │    │  feeds, analytics    │    │
│  └────────┬────────┘    └──────────────────────┘    │
│           │ pg_cron (every 30 mins)                  │
└───────────┼─────────────────────────────────────────┘
            │ REST API / Realtime
┌───────────▼─────────────────────────────────────────┐
│                  REACT.JS FRONTEND                   │
│                                                      │
│   Public Blog          │   Admin Dashboard           │
│   ─────────────────    │   ─────────────────────     │
│   Home (/)             │   /admin/dashboard          │
│   Article (/post/:slug)│   /admin/posts              │
│   Category (/cat/:slug)│   /admin/posts/new          │
│   Search (/search)     │   /admin/feeds              │
│   Region (/region/:r)  │   /admin/settings           │
└─────────────────────────────────────────────────────┘
```

---

## Step-by-Step Build Process

---

### PHASE 1 — Project Setup & Infrastructure

#### Step 1: Initialize the React Project with Vite
```bash
npm create vite@latest yup-blog -- --template react
cd yup-blog
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Step 2: Install All Dependencies
```bash
# Core
npm install react-router-dom@6
npm install @supabase/supabase-js

# SEO
npm install react-helmet-async

# UI & Charts
npm install recharts
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# Utilities
npm install date-fns slugify axios
npm install lucide-react
```

#### Step 3: Configure Tailwind
Update `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      colors: {
        ink: '#0A0A0A',
        paper: '#FFFFFF',
        muted: '#6B6B6B',
        border: '#E5E5E5',
        surface: '#F7F7F7',
        breaking: '#FF3B30',
        admin: '#1A1A1A',
      },
    },
  },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Step 4: Set Up Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project → name it `yup-blog`
2. Copy your `Project URL` and `anon public key`
3. Enable **Row Level Security (RLS)** on all tables
4. Enable Supabase Auth (email/password)

#### Step 5: Create Environment Variables
Create `.env` in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SITE_URL=https://yupblog.com
VITE_SITE_NAME=YUP
```

Create `.env.supabase` (for Edge Functions secrets — set in Supabase dashboard):
```
OPENAI_API_KEY=your_openai_key
NEWS_API_KEY=your_newsapi_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### PHASE 2 — Supabase Database Schema

#### Step 6: Create All Database Tables

Open the Supabase SQL Editor and run:

```sql
-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── POSTS ────────────────────────────────────────────────
CREATE TABLE posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  excerpt       TEXT,
  content       TEXT NOT NULL,
  cover_image   TEXT,
  category      TEXT NOT NULL,
  region        TEXT NOT NULL DEFAULT 'global',  -- 'us' | 'nigeria' | 'global'
  tags          TEXT[],
  source_url    TEXT,
  source_name   TEXT,
  status        TEXT DEFAULT 'published',         -- 'draft' | 'published' | 'archived'
  seo_title     TEXT,
  seo_description TEXT,
  is_auto_generated BOOLEAN DEFAULT true,
  views         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  published_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX posts_search_idx ON posts
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(excerpt,'') || ' ' || content));

-- ─── CATEGORIES ───────────────────────────────────────────
CREATE TABLE categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug) VALUES
  ('Breaking News', 'breaking-news'),
  ('Politics',      'politics'),
  ('Business',      'business'),
  ('Technology',    'technology'),
  ('Sports',        'sports'),
  ('Entertainment', 'entertainment'),
  ('Health',        'health'),
  ('World',         'world'),
  ('Nigeria',       'nigeria'),
  ('United States', 'united-states');

-- ─── RSS FEED SOURCES ─────────────────────────────────────
CREATE TABLE feed_sources (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  region       TEXT NOT NULL,        -- 'us' | 'nigeria' | 'global'
  category     TEXT,
  is_active    BOOLEAN DEFAULT true,
  last_fetched TIMESTAMPTZ,
  post_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feed_sources (name, url, region, category) VALUES
  ('BBC World News',       'http://feeds.bbci.co.uk/news/world/rss.xml',    'global',  'world'),
  ('CNN Top Stories',      'http://rss.cnn.com/rss/edition.rss',            'us',      'breaking-news'),
  ('Reuters',              'https://feeds.reuters.com/reuters/topNews',     'global',  'world'),
  ('Channels TV Nigeria',  'https://www.channelstv.com/feed/',              'nigeria', 'breaking-news'),
  ('Punch Nigeria',        'https://punchng.com/feed/',                     'nigeria', 'politics'),
  ('The Guardian Nigeria', 'https://guardian.ng/feed/',                     'nigeria', 'world'),
  ('Vanguard Nigeria',     'https://www.vanguardngr.com/feed/',             'nigeria', 'breaking-news'),
  ('NPR News',             'https://feeds.npr.org/1001/rss.xml',            'us',      'politics'),
  ('TechCrunch',           'https://techcrunch.com/feed/',                  'us',      'technology'),
  ('ESPN',                 'https://www.espn.com/espn/rss/news',            'us',      'sports'),
  ('Al Jazeera',           'https://www.aljazeera.com/xml/rss/all.xml',     'global',  'world');

-- ─── PAGE VIEWS ───────────────────────────────────────────
CREATE TABLE page_views (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id   UUID REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  country   TEXT,
  device    TEXT  -- 'mobile' | 'desktop' | 'tablet'
);

-- ─── ADMIN PROFILES ───────────────────────────────────────
CREATE TABLE admin_profiles (
  id         UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name  TEXT,
  role       TEXT DEFAULT 'editor',  -- 'super_admin' | 'editor'
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public read posts" ON posts
  FOR SELECT USING (status = 'published');

-- Public can read categories
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (true);

-- Admins have full access
CREATE POLICY "Admin full access posts" ON posts
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

CREATE POLICY "Admin full access feeds" ON feed_sources
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_profiles));

-- Anyone can insert page views
CREATE POLICY "Anyone insert views" ON page_views
  FOR INSERT WITH CHECK (true);
```

---

### PHASE 3 — Supabase Edge Function (Crawler + AI Rewriter)

#### Step 7: Create the Edge Function

In the Supabase dashboard → Edge Functions → New Function → name it `crawl-news`:

```typescript
// supabase/functions/crawl-news/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Fetch all active feed sources
  const { data: feeds } = await supabase
    .from('feed_sources')
    .select('*')
    .eq('is_active', true)

  let newPostsCount = 0

  for (const feed of feeds || []) {
    // 2. Fetch RSS feed
    const rssResponse = await fetch(feed.url)
    const rssText = await rssResponse.text()

    // 3. Parse XML (basic parser)
    const items = parseRSS(rssText)

    for (const item of items.slice(0, 5)) {
      // 4. Generate slug and check for duplicates
      const slug = generateSlug(item.title)
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) continue

      // 5. Rewrite with AI
      const aiResult = await rewriteWithAI(item.title, item.description)
      if (!aiResult) continue

      // 6. Insert into posts table
      await supabase.from('posts').insert({
        title: aiResult.title,
        slug: slug,
        excerpt: aiResult.excerpt,
        content: aiResult.content,
        cover_image: item.image || null,
        category: feed.category,
        region: feed.region,
        tags: aiResult.tags,
        source_url: item.link,
        source_name: feed.name,
        seo_title: aiResult.seo_title,
        seo_description: aiResult.seo_description,
        is_auto_generated: true,
        status: 'published',
      })

      newPostsCount++
    }

    // 7. Update last_fetched timestamp
    await supabase
      .from('feed_sources')
      .update({ last_fetched: new Date().toISOString() })
      .eq('id', feed.id)
  }

  return new Response(
    JSON.stringify({ success: true, new_posts: newPostsCount }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

async function rewriteWithAI(title: string, description: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `You are a professional news journalist. Rewrite this news story in a professional tone.

Title: ${title}
Summary: ${description}

Return ONLY a valid JSON object with these exact keys:
{
  "title": "SEO-optimized headline (max 70 chars)",
  "excerpt": "2-sentence summary (max 160 chars)",
  "content": "Full article body in HTML (400-600 words, use <p>, <h2>, <blockquote> tags)",
  "seo_title": "SEO title tag (max 60 chars)",
  "seo_description": "Meta description (max 155 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}`
      }],
      response_format: { type: 'json_object' }
    })
  })
  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

function parseRSS(xml: string) {
  const items: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    items.push({
      title: extractTag(item, 'title'),
      description: extractTag(item, 'description'),
      link: extractTag(item, 'link'),
      image: extractImage(item),
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.+?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]+)<\\/${tag}>`, 's'))
  return (match?.[1] || match?.[2] || '').trim()
}

function extractImage(xml: string): string | null {
  const match = xml.match(/url="([^"]+\.(jpg|jpeg|png|webp))"/i)
  return match?.[1] || null
}
```

#### Step 8: Schedule the Edge Function with pg_cron

In the Supabase SQL Editor:
```sql
-- Run the crawler every 30 minutes
SELECT cron.schedule(
  'crawl-news-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/crawl-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

### PHASE 4 — React App Structure & Routing

#### Step 9: Project File Structure

```
yup-blog/
├── public/
│   ├── robots.txt
│   └── og-default.png
├── src/
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Router setup
│   ├── index.css                 # Tailwind + Google Fonts
│   │
│   ├── lib/
│   │   ├── supabase.js           # Supabase client init
│   │   ├── queries.js            # All Supabase query functions
│   │   └── utils.js              # Date formatting, slug helpers
│   │
│   ├── hooks/
│   │   ├── usePosts.js           # Fetch posts with filters
│   │   ├── usePost.js            # Fetch single post by slug
│   │   ├── useAuth.js            # Auth state management
│   │   └── useAnalytics.js       # Dashboard analytics data
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx        # Top bar + logo + nav
│   │   │   ├── Footer.jsx        # Footer links
│   │   │   ├── BreakingTicker.jsx # Scrolling news ticker
│   │   │   └── MobileMenu.jsx    # Hamburger mobile nav
│   │   ├── blog/
│   │   │   ├── ArticleCard.jsx   # Post card (grid/list)
│   │   │   ├── HeroSection.jsx   # Featured top story
│   │   │   ├── ArticleGrid.jsx   # Responsive post grid
│   │   │   ├── Sidebar.jsx       # Most read + categories
│   │   │   ├── RegionTabs.jsx    # US / Nigeria / World tabs
│   │   │   ├── ShareButtons.jsx  # Social share
│   │   │   └── RelatedPosts.jsx  # Related articles section
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx   # Sidebar + topbar wrapper
│   │   │   ├── Sidebar.jsx       # Admin sidebar nav
│   │   │   ├── StatsCard.jsx     # Metric card component
│   │   │   ├── PostsTable.jsx    # Sortable posts data table
│   │   │   ├── PostEditor.jsx    # Tiptap rich text editor
│   │   │   └── FeedsTable.jsx    # RSS feed manager table
│   │   └── ui/
│   │       ├── Badge.jsx         # Category/status badges
│   │       ├── Button.jsx        # Reusable button
│   │       ├── Input.jsx         # Form input
│   │       ├── Modal.jsx         # Confirmation modal
│   │       └── SEO.jsx           # React Helmet wrapper
│   │
│   └── pages/
│       ├── blog/
│       │   ├── Home.jsx          # / (homepage)
│       │   ├── Article.jsx       # /post/:slug
│       │   ├── Category.jsx      # /category/:slug
│       │   ├── Region.jsx        # /region/:region
│       │   └── Search.jsx        # /search?q=...
│       └── admin/
│           ├── Login.jsx         # /admin/login
│           ├── Dashboard.jsx     # /admin/dashboard
│           ├── Posts.jsx         # /admin/posts
│           ├── NewPost.jsx       # /admin/posts/new
│           ├── EditPost.jsx      # /admin/posts/:id
│           ├── Feeds.jsx         # /admin/feeds
│           ├── Categories.jsx    # /admin/categories
│           └── Settings.jsx      # /admin/settings
│
├── .env
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

#### Step 10: Set Up React Router
In `src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Blog pages
import Home from './pages/blog/Home'
import Article from './pages/blog/Article'
import Category from './pages/blog/Category'
import Region from './pages/blog/Region'
import Search from './pages/blog/Search'

// Admin pages
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Posts from './pages/admin/Posts'
import NewPost from './pages/admin/NewPost'
import EditPost from './pages/admin/EditPost'
import Feeds from './pages/admin/Feeds'
import Settings from './pages/admin/Settings'
import AdminLayout from './components/admin/AdminLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public blog routes */}
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<Article />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/region/:region" element={<Region />} />
        <Route path="/search" element={<Search />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/new" element={<NewPost />} />
          <Route path="posts/:id" element={<EditPost />} />
          <Route path="feeds" element={<Feeds />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

### PHASE 5 — SEO with React Helmet Async

#### Step 11: SEO Component
Since React is a SPA, use `react-helmet-async` for dynamic meta tags:

```jsx
// src/components/ui/SEO.jsx
import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, image, url, type = 'website', article }) {
  const siteName = 'YUP'
  const defaultImage = '/og-default.png'
  const fullTitle = title ? `${title} | ${siteName}` : siteName

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* Article Schema.org JSON-LD */}
      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.excerpt,
            "image": article.cover_image,
            "datePublished": article.published_at,
            "dateModified": article.updated_at,
            "author": { "@type": "Organization", "name": "YUP" },
            "publisher": {
              "@type": "Organization",
              "name": "YUP",
              "logo": { "@type": "ImageObject", "url": `${import.meta.env.VITE_SITE_URL}/logo.png` }
            },
            "url": url,
            "mainEntityOfPage": url,
          })}
        </script>
      )}
    </Helmet>
  )
}
```

#### Step 12: SEO Checklist

- [ ] `react-helmet-async` wrapping entire app in `HelperProvider`
- [ ] Dynamic title + description on every page
- [ ] Open Graph + Twitter Card on all pages
- [ ] JSON-LD NewsArticle schema on article pages
- [ ] `robots.txt` in `/public` — disallow `/admin`
- [ ] Breadcrumb schema on category pages
- [ ] Image alt text on all `<img>` tags
- [ ] `sitemap.xml` generated at build time (vite-plugin-sitemap or manual)
- [ ] Lazy loading for images (`loading="lazy"`)
- [ ] Pre-rendering with Vite SSG or Prerender.io for Googlebot

---

### PHASE 6 — Mobile-Responsive Design

#### Step 13: Mobile-First Breakpoints

All layouts follow Tailwind's mobile-first approach:

| Breakpoint | Width     | Layout Change                        |
|------------|-----------|--------------------------------------|
| `base`     | < 640px   | Single column, hamburger menu, no sidebar |
| `sm`       | 640px+    | 2-column article grid                |
| `md`       | 768px+    | Show sidebar, 3-col grid             |
| `lg`       | 1024px+   | Full desktop layout, wider margins   |
| `xl`       | 1280px+   | Max-width container, large hero      |

#### Step 14: Mobile UI Decisions
- **Header:** Logo + hamburger icon on mobile; full horizontal nav on desktop
- **Hero:** Full-width single story on mobile; 3-panel layout on desktop
- **Article Grid:** 1 col → 2 col → 3 col
- **Sidebar:** Hidden on mobile, sticky on desktop
- **Admin Sidebar:** Collapsible drawer on mobile, fixed on desktop
- **Article Body:** Full width on mobile, 720px centered on desktop
- **Ticker:** Horizontal scroll on mobile, marquee animation on desktop

---

### PHASE 7 — Deployment

#### Step 15: Build & Deploy to Vercel

```bash
# Build the app
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

In Vercel dashboard:
- Set environment variables from `.env`
- Set **Framework Preset** to `Vite`
- Set **Output Directory** to `dist`

#### Step 16: Handle Client-Side Routing on Vercel
Create `vercel.json` in the project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Step 17: `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://yupblog.com/sitemap.xml
```

---

## Design System — YUP Editorial Style

### Color Palette
```
Background:    #FFFFFF   pure white
Primary Text:  #0A0A0A   near black (ink)
Secondary:     #6B6B6B   medium gray (muted)
Border:        #E5E5E5   light gray
Surface:       #F7F7F7   off-white (card backgrounds)
Breaking Red:  #FF3B30   alerts + breaking news ONLY
Admin Dark:    #1A1A1A   dashboard sidebar
Admin Hover:   #2E2E2E   sidebar hover state
```

### Typography Scale
```
Brand Logo:    Playfair Display, 900 weight, uppercase tracking
H1 (Article):  Playfair Display, 700, 40px mobile / 56px desktop
H2 (Section):  Playfair Display, 700, 28px
Card Title:    Inter, 600, 18px
Body Text:     Inter, 400, 17px, line-height 1.8
Byline/Meta:   Roboto Mono, 400, 12px, uppercase, letter-spacing 0.08em
Tags/Badges:   Inter, 500, 11px, uppercase
```

---

### Blog — Page-by-Page Design

#### Header (Mobile + Desktop)

**Mobile:**
```
┌─────────────────────────────┐
│  [≡]      YUP         [🔍] │  ← hamburger | logo | search icon
├─────────────────────────────┤
│  🔴 BREAKING  |  US  |  NG │  ← region pill tabs (scrollable)
└─────────────────────────────┘
```

**Desktop:**
```
┌─────────────────────────────────────────────────────────┐
│  THU, FEB 26 2026          YUP              [Search 🔍] │
├─────────────────────────────────────────────────────────┤
│  Breaking  Politics  Business  Tech  Sports  Nigeria    │
└─────────────────────────────────────────────────────────┘
```

- Sticky header with thin bottom border `#E5E5E5`
- Logo: `YUP` in Playfair Display, 900 weight, tracked wide
- Subtle scroll shadow when page scrolls down

#### Breaking News Ticker
```
┌─────────────────────────────────────────────────────────┐
│  🔴 BREAKING  │  Nigeria Senate passes new budget...  ▶ │
└─────────────────────────────────────────────────────────┘
```
- Black background, white text, red BREAKING label
- Auto-scrolling marquee of today's breaking headlines

#### Hero Section

**Mobile:**
```
┌─────────────────────┐
│  [LARGE IMAGE]      │
│  Breaking News  →   │  ← red badge
│  Big headline       │
│  text here that     │
│  spans two lines    │
│  ─────────────────  │
│  [Smaller story 1]  │
│  [Smaller story 2]  │
└─────────────────────┘
```

**Desktop:**
```
┌────────────────────────────┬─────────┬─────────┐
│  [LARGE IMAGE + OVERLAY]   │ Story 2 │ Story 3 │
│                            │ [img]   │ [img]   │
│  🔴 Breaking               │ Title   │ Title   │
│  BIG BOLD HEADLINE         │ Excerpt │ Excerpt │
│  HERE IN SERIF             │         │         │
│  Excerpt text...           │ 2h ago  │ 5h ago  │
└────────────────────────────┴─────────┴─────────┘
```

#### Article Card
```
┌─────────────────────────────┐
│  [Thumbnail image]          │
│  TECHNOLOGY  •  4 min read  │  ← mono, muted
│  Headline text here that    │  ← serif, bold
│  can span two lines         │
│  Short excerpt goes here... │  ← sans, muted, 2 lines
│  2 hours ago                │  ← mono, small
└─────────────────────────────┘
```

#### Article Page Layout

**Mobile:** Full width, 16px padding
**Desktop:** 720px centered column, sidebar at 1024px+

```
Article page structure:
──────────────────────
  Breadcrumb: Home > Politics > Article title

  [Full-width cover image]

  CATEGORY TAG

  H1: Big Bold Article Headline in
  Playfair Display Spanning Two Lines

  By YUP Staff  •  Feb 26, 2026  •  5 min read
  Source: Reuters
  ────────────────────────────────

  [Body content paragraphs]

  > Pull quote styled in large italic
    serif with left border

  [More paragraphs]

  Tags: #politics #us #senate

  [Share: Twitter Facebook Copy Link]

  ────────────────────────────────
  Related Stories
  [Card] [Card] [Card]
```

#### Footer
```
┌──────────────────────────────────────────────────────┐
│                      YUP                             │
│              Your daily news source.                 │
│                                                      │
│  Categories      Regions       Company               │
│  Breaking News   United States About                 │
│  Politics        Nigeria       Contact               │
│  Technology      World         Privacy Policy        │
│  Sports                        Terms                 │
│                                                      │
│  [RSS Feed]  [Twitter]  [Facebook]  [Instagram]      │
│  ─────────────────────────────────────────────────   │
│  © 2026 YUP. All rights reserved.                   │
└──────────────────────────────────────────────────────┘
```

---

### Admin Dashboard — Page-by-Page Design

#### Layout Shell

**Mobile:** Bottom tab bar (Dashboard, Posts, Feeds, Menu)
**Desktop:** Left dark sidebar (240px) + main content area

**Desktop Sidebar:**
```
┌─────────────────────┐
│  YUP Admin          │  ← white logo, dark bg #1A1A1A
│                     │
│  ▣  Dashboard       │
│  ≡  Posts      (24) │  ← badge count
│  ⊕  New Post        │
│  ◉  Categories      │
│  ⊞  Feeds           │
│  ⚙  Settings        │
│                     │
│  ─────────────────  │
│  [Avatar]           │
│  John Doe           │
│  Super Admin        │
│  [Logout]           │
└─────────────────────┘
```

#### Dashboard Overview
```
┌─────────────────────────────────────────────────────────┐
│  Good morning, John.  Today: Thu, Feb 26 2026           │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 1,248    │ │ 3,891    │ │ 42       │ │ 7        │  │
│  │ Total    │ │ Views    │ │ Today's  │ │ Drafts   │  │
│  │ Posts    │ │ Today    │ │ New Posts│ │ Pending  │  │
│  │ ↑ 12%   │ │ ↑ 8%    │ │          │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  [Views Over Time — Line Chart — Last 7 days]           │
├─────────────────────────────────────────────────────────┤
│  [Top Posts by Views — Bar Chart]  │  [Region Pie Chart]│
└─────────────────────────────────────────────────────────┘
```

#### Posts Manager Table
```
┌─────────────────────────────────────────────────────────┐
│  Posts           [+ New Post]    [Search...]            │
│  Filter: All  Published  Drafts  AI  Manual             │
├──┬─────────────────────────────┬──────────┬────────┬───┤
│☐ │ Title                       │ Category │ Status │ … │
├──┼─────────────────────────────┼──────────┼────────┼───┤
│☐ │ Nigeria Senate passes...    │ Politics │ ● Live │ ⋮ │
│☐ │ Tech Giants Report...       │ Tech     │ ● Live │ ⋮ │
│☐ │ Breaking: US Election...    │ Breaking │ ○ Draft│ ⋮ │
└──┴─────────────────────────────┴──────────┴────────┴───┘
   Showing 1–20 of 1,248    [< Prev]  1 2 3 ...  [Next >]
```

#### Post Editor
```
┌─────────────────────────────┬────────────────────────┐
│  Post Title                 │  PUBLISH SETTINGS      │
│  [________________________________]  │  Status: [Published ▼] │
│                             │  Category: [Politics▼] │
│  [B] [I] [Link] [H2] [H3] [Quote] [Img]  │  Region: [Nigeria ▼] │
│  ──────────────────────     │  Tags: [+Add tag]      │
│                             │                        │
│  Article body content       │  SEO PREVIEW           │
│  goes here. Full Tiptap     │  ┌──────────────────┐  │
│  rich text editor with      │  │ YUP | Title here │  │
│  formatting toolbar.        │  │ yupblog.com/...  │  │
│                             │  │ Meta description │  │
│                             │  └──────────────────┘  │
│                             │  Slug: [auto-generated]│
│                             │  OG Image: [Upload]    │
│                             │                        │
│                             │  [Save Draft]          │
│                             │  [Publish Now]         │
└─────────────────────────────┴────────────────────────┘
```

---

## Automation Flow

```
Supabase pg_cron (every 30 minutes)
         │
         ▼
Edge Function: crawl-news
         │
         ▼
  Fetch active RSS feeds from feed_sources table
         │
         ▼
  Parse XML → extract title, description, image, link
         │
         ▼
  Check: slug already exists in posts table?
    YES → skip
    NO  ↓
         ▼
  Send to OpenAI GPT-4o
  → Returns: title, excerpt, content, seo_title,
             seo_description, tags (JSON)
         │
         ▼
  Insert into posts table (status: published)
         │
         ▼
  Update feed_sources.last_fetched timestamp
         │
         ▼
  React frontend fetches from Supabase on demand
  → New post appears instantly on /category and homepage
```

---

## Roadmap

### MVP (Build First)
- [ ] Phase 1: React + Vite + Tailwind setup
- [ ] Phase 2: Supabase schema + RLS policies
- [ ] Phase 3: Edge Function crawler + AI rewriter
- [ ] Phase 4: Public blog — Home, Article, Category pages
- [ ] Phase 5: Admin dashboard — Auth, Posts, Editor, Feeds
- [ ] Phase 6: SEO — React Helmet, Schema.org, robots.txt
- [ ] Phase 7: Vercel deployment

### Future Features
- [ ] Phase 8: Newsletter (Resend API)
- [ ] Phase 9: Web push notifications
- [ ] Phase 10: Google AdSense monetization
- [ ] Phase 11: Comment system (Supabase)
- [ ] Phase 12: PWA + offline support
- [ ] Phase 13: Multi-language (i18n)

---

## License

MIT License — Free to use, modify, and distribute.
