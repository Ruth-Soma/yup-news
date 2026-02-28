export function BreakingBadge() {
  return (
    <span className="breaking-badge inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      Breaking
    </span>
  )
}

export function CategoryBadge({ category }) {
  return (
    <span className="category-badge">
      {category?.replace(/-/g, ' ')}
    </span>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border border-amber-200',
    archived: 'bg-gray-100 text-gray-500 border border-gray-200',
    scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return (
    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}

export function AIBadge() {
  return (
    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded">
      AI
    </span>
  )
}
