import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Blog pages — eagerly loaded (critical path for all visitors)
import Home from '@/pages/blog/Home'
import Article from '@/pages/blog/Article'
import Category from '@/pages/blog/Category'
import Region from '@/pages/blog/Region'
import World from '@/pages/blog/World'
import Search from '@/pages/blog/Search'
import Tag from '@/pages/blog/Tag'
import NotFound from '@/pages/NotFound'
import NewsBanner from '@/components/ui/NewsBanner'

// Utility/static pages — lazy loaded (rarely visited)
const About      = lazy(() => import('@/pages/About'))
const Privacy    = lazy(() => import('@/pages/Privacy'))
const Terms      = lazy(() => import('@/pages/Terms'))
const Contact    = lazy(() => import('@/pages/Contact'))
const Advertise  = lazy(() => import('@/pages/Advertise'))
const Unsubscribe = lazy(() => import('@/pages/Unsubscribe'))
const Subscribed = lazy(() => import('@/pages/Subscribed'))
const Bookmarks  = lazy(() => import('@/pages/Bookmarks'))
const Preview    = lazy(() => import('@/pages/Preview'))

// Admin pages — lazy loaded (never loaded by public visitors; includes recharts)
const Login      = lazy(() => import('@/pages/admin/Login'))
const Dashboard  = lazy(() => import('@/pages/admin/Dashboard'))
const Posts      = lazy(() => import('@/pages/admin/Posts'))
const NewPost    = lazy(() => import('@/pages/admin/NewPost'))
const EditPost   = lazy(() => import('@/pages/admin/EditPost'))
const Feeds      = lazy(() => import('@/pages/admin/Feeds'))
const Settings   = lazy(() => import('@/pages/admin/Settings'))
const Comments   = lazy(() => import('@/pages/admin/Comments'))
const Newsletter = lazy(() => import('@/pages/admin/Newsletter'))
const Subscribers = lazy(() => import('@/pages/admin/Subscribers'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NewsBanner />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Public blog routes — critical path, no lazy loading */}
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<Article />} />
          <Route path="/category/:slug" element={<Category />} />
          <Route path="/region/global" element={<World />} />
          <Route path="/region/:region" element={<Region />} />
          <Route path="/search" element={<Search />} />
          <Route path="/tag/:tag" element={<Tag />} />

          {/* Static pages — lazy */}
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/subscribed" element={<Subscribed />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/preview" element={<Preview />} />

          {/* Admin routes — lazy, never bundled with public JS */}
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/new" element={<NewPost />} />
            <Route path="posts/:id" element={<EditPost />} />
            <Route path="feeds" element={<Feeds />} />
            <Route path="comments" element={<Comments />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="subscribers" element={<Subscribers />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
