import Link from 'next/link'

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/experiences', label: 'Experiences' },
  { href: '/admin/tech-items', label: 'Tech Items' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white/5 border-r border-white/10 min-h-screen flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase">
            Admin
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
