import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Blog pages
import Home from '@/pages/blog/Home'
import Article from '@/pages/blog/Article'
import Category from '@/pages/blog/Category'
import Region from '@/pages/blog/Region'
import World from '@/pages/blog/World'
import Search from '@/pages/blog/Search'
import Tag from '@/pages/blog/Tag'
import NotFound from '@/pages/NotFound'
import NewsBanner from '@/components/ui/NewsBanner'
import About from '@/pages/About'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import Contact from '@/pages/Contact'
import Advertise from '@/pages/Advertise'
import Unsubscribe from '@/pages/Unsubscribe'
import Subscribed from '@/pages/Subscribed'
import Bookmarks from '@/pages/Bookmarks'
import Preview from '@/pages/Preview'

// Admin pages
import Login from '@/pages/admin/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Posts from '@/pages/admin/Posts'
import NewPost from '@/pages/admin/NewPost'
import EditPost from '@/pages/admin/EditPost'
import Feeds from '@/pages/admin/Feeds'
import Settings from '@/pages/admin/Settings'
import Comments from '@/pages/admin/Comments'
import Newsletter from '@/pages/admin/Newsletter'
import Subscribers from '@/pages/admin/Subscribers'
import AdminLayout from '@/components/admin/AdminLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <NewsBanner />
      <Routes>
        {/* Public blog routes */}
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<Article />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/region/global" element={<World />} />
        <Route path="/region/:region" element={<Region />} />
        <Route path="/search" element={<Search />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/subscribed" element={<Subscribed />} />
        <Route path="/tag/:tag" element={<Tag />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/preview" element={<Preview />} />

        {/* Admin routes */}
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
    </BrowserRouter>
  )
}
