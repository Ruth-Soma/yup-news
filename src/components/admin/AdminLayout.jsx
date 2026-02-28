import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, PlusCircle, Rss, Settings, LogOut, Menu, MessageSquare, Mail, Users
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/posts', icon: FileText, label: 'Posts' },
  { to: '/admin/posts/new', icon: PlusCircle, label: 'New Post' },
  { to: '/admin/feeds', icon: Rss, label: 'Feed Sources' },
  { to: '/admin/comments', icon: MessageSquare, label: 'Comments' },
  { to: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
  { to: '/admin/subscribers', icon: Users, label: 'Subscribers' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-60 bg-admin flex flex-col z-30 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/" className="font-serif font-black text-2xl tracking-[0.12em] text-white uppercase">
            YUP
          </Link>
          <p className="text-[10px] font-mono text-white/40 mt-0.5 uppercase tracking-widest">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm font-sans transition-colors ${
                  isActive
                    ? 'bg-white text-admin font-medium'
                    : 'text-white/70 hover:text-white hover:bg-admin-hover'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs font-sans text-white/60 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 flex items-center gap-2 text-xs font-sans text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-paper border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-ink">
            <Menu size={22} />
          </button>
          <Link to="/" className="font-serif font-black text-xl tracking-[0.1em] text-ink uppercase">
            YUP
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
