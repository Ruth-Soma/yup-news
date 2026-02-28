import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    if (newPassword.length < 6) return setPwMsg('Password must be at least 6 characters.')
    setPwSaving(true)
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) {
      setPwMsg(error.message)
    } else {
      setPwMsg('Password updated successfully.')
      setNewPassword('')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif font-bold text-3xl text-ink">Settings</h1>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        {/* Site info — read-only display of env config */}
        <div className="bg-paper border border-border p-6 space-y-4">
          <h2 className="font-serif font-bold text-lg text-ink">Site Information</h2>
          <p className="text-xs font-mono text-muted">These values are set via environment variables in your deployment.</p>
          <div className="space-y-2">
            {[
              { label: 'Site Name', value: import.meta.env.VITE_SITE_NAME },
              { label: 'Site URL', value: import.meta.env.VITE_SITE_URL },
              { label: 'Supabase URL', value: import.meta.env.VITE_SUPABASE_URL },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted w-28 shrink-0">{label}</span>
                <span className="text-xs font-mono text-ink truncate">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="bg-paper border border-border p-6 space-y-4">
          <h2 className="font-serif font-bold text-lg text-ink">Change Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwMsg('') }}
                placeholder="Min. 6 characters"
                minLength={6}
                required
                className="w-full border border-border px-3 py-2 text-sm font-sans bg-paper text-ink focus:outline-none focus:border-ink"
              />
            </div>
            {pwMsg && (
              <p className={`text-xs font-mono ${pwMsg.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>
                {pwMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={pwSaving || !newPassword}
              className="px-4 py-2 bg-ink text-paper text-sm font-sans hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
