import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

async function getStats() {
  const [projects, techItems, experiences] = await Promise.all([
    db.project.count(),
    db.techItem.count(),
    db.experience.count(),
  ])
  return { projects, techItems, experiences }
}

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session) redirect('/admin/login')

  let stats = { projects: 0, techItems: 0, experiences: 0 }
  try {
    stats = await getStats()
  } catch {
    // DB unreachable — show zeros
  }

  const cards = [
    { label: 'Projects',    count: stats.projects,    href: '/admin/projects',    action: 'Manage Projects' },
    { label: 'Tech Items',  count: stats.techItems,   href: '/admin/tech-items',  action: 'Manage Tech Items' },
    { label: 'Experiences', count: stats.experiences, href: '/admin/experiences', action: 'Manage Experiences' },
  ]

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold text-white">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-sm text-white/50">{card.label}</p>
              <p className="mt-1 text-4xl font-bold text-white">{card.count}</p>
            </div>
            <Link href={card.href} className="text-sm text-white/60 underline underline-offset-2 transition-colors hover:text-white">
              {card.action} &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
