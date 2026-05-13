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
  const stats = await getStats()

  const cards = [
    {
      label: 'Projects',
      count: stats.projects,
      href: '/admin/projects',
      action: 'Manage Projects',
    },
    {
      label: 'Tech Items',
      count: stats.techItems,
      href: '/admin/tech-items',
      action: 'Manage Tech Items',
    },
    {
      label: 'Experiences',
      count: stats.experiences,
      href: '/admin/experiences',
      action: 'Manage Experiences',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4"
          >
            <div>
              <p className="text-white/50 text-sm">{card.label}</p>
              <p className="text-4xl font-bold text-white mt-1">{card.count}</p>
            </div>
            <Link
              href={card.href}
              className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-2"
            >
              {card.action} &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
