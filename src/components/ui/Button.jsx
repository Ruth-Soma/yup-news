export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-sans font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-ink text-paper hover:bg-gray-800 active:bg-black',
    secondary: 'bg-surface text-ink border border-border hover:bg-gray-100',
    ghost: 'text-ink hover:bg-surface',
    danger: 'bg-breaking text-white hover:bg-red-600',
    outline: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
