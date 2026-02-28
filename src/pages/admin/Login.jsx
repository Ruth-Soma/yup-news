import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/admin/dashboard', { replace: true })
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Invalid email or password.')
    } else {
      navigate('/admin/dashboard', { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-sans font-medium text-[1.6rem] tracking-[-0.02em] text-ink">yup</span>
          <p className="mt-1 text-[0.62rem] font-mono uppercase tracking-[0.16em] text-g500">Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-paper border border-border p-8">
          <h1 className="font-serif font-bold text-xl text-ink mb-6">Sign in</h1>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600 font-sans">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-border px-3 py-2.5 text-sm font-sans text-ink bg-paper focus:outline-none focus:border-ink transition-colors"
                placeholder="admin@yup.ng"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-border px-3 py-2.5 text-sm font-sans text-ink bg-paper focus:outline-none focus:border-ink transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-ink text-paper text-sm font-sans font-medium py-3 hover:bg-gray-800 active:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
