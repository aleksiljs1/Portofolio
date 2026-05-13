'use client'

import { useQuery } from '@tanstack/react-query'
import { Mail, GitBranch, ExternalLink } from 'lucide-react'
import { TechBadge } from '@/components/TechBadge'

type TechCategory = 'FRAMEWORK' | 'LANGUAGE' | 'SKILL'

interface TechItem {
  id: string
  name: string
  category: TechCategory
  _count?: { projects: number }
}

const CATEGORY_LABELS: Record<TechCategory, string> = {
  FRAMEWORK: 'Frameworks',
  LANGUAGE: 'Languages',
  SKILL: 'Skills',
}

const CATEGORY_ORDER: TechCategory[] = ['FRAMEWORK', 'LANGUAGE', 'SKILL']

export default function AboutPage() {
  const { data: techItems = [] } = useQuery<TechItem[]>({
    queryKey: ['tech-items'],
    queryFn: () => fetch('/api/tech-items').then((r) => r.json()),
  })

  const grouped = CATEGORY_ORDER.reduce<Record<TechCategory, TechItem[]>>(
    (acc, cat) => {
      acc[cat] = techItems.filter((t) => t.category === cat)
      return acc
    },
    { FRAMEWORK: [], LANGUAGE: [], SKILL: [] }
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      {/* Bio */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Hi, I&apos;m{' '}
          <span className="text-sky-400">Aleksandros</span>
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-white/70 sm:text-lg">
          <p>
            I&apos;m a full-stack software engineer with hands-on experience building
            AI analysis pipelines, fiscalization systems, restaurant SaaS platforms,
            and social media applications. I work across the entire stack — from
            crafting responsive UIs to designing scalable backend architectures
            and distributed microservices.
          </p>
          <p>
            Based in Tirana, Albania, I thrive on solving complex engineering
            challenges and turning ideas into reliable, production-grade software.
            Whether it&apos;s integrating LLMs into data pipelines or shipping a
            pixel-perfect feature, I care deeply about code quality, performance,
            and user experience.
          </p>
        </div>
      </section>

      {/* Skills grid */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white">Tech Skills</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="flex flex-wrap gap-2">
                {grouped[cat].length > 0 ? (
                  grouped[cat].map((item) => (
                    <TechBadge key={item.id} name={item.name} category={item.category} />
                  ))
                ) : (
                  <span className="text-sm text-white/30">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white">Get in Touch</h2>
        <ul className="mt-6 space-y-4">
          <li>
            <a
              href="mailto:aleksanderiljas@gmail.com"
              className="inline-flex items-center gap-3 text-white/70 transition-colors hover:text-sky-400"
            >
              <Mail className="h-5 w-5 shrink-0" />
              <span>aleksanderiljas@gmail.com</span>
            </a>
          </li>
          <li>
            <a
              href="https://github.com/aleksiljs1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-white/70 transition-colors hover:text-sky-400"
            >
              <GitBranch className="h-5 w-5 shrink-0" />
              <span>github.com/aleksiljs1</span>
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/aleksandros-iljas/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-white/70 transition-colors hover:text-sky-400"
            >
              <ExternalLink className="h-5 w-5 shrink-0" />
              <span>linkedin.com/in/aleksandros-iljas</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
