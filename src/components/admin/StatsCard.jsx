import { TrendingUp } from 'lucide-react'

export default function StatsCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-paper border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-1 font-serif font-black text-3xl text-ink">{value}</p>
          {sub && <p className="mt-1 text-xs font-mono text-muted">{sub}</p>}
        </div>
        {Icon && (
          <div className="p-2 bg-surface">
            <Icon size={18} className="text-muted" />
          </div>
        )}
      </div>
    </div>
  )
}
