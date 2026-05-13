'use client'

import { useQuery } from '@tanstack/react-query'
import ExperienceCard from '@/components/ExperienceCard'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string | null
  current: boolean
  description: string[]
  order: number
  createdAt: string
  updatedAt: string
}

async function fetchExperiences(): Promise<Experience[]> {
  const res = await fetch('/api/experiences')
  if (!res.ok) throw new Error('Failed to fetch experiences')
  return res.json()
}

function SkeletonCard() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-white/20" />
        <div className="mt-1 w-0.5 flex-1 bg-white/10" />
      </div>
      <div className="mb-8 flex-1 animate-pulse rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-white/20" />
            <div className="h-3 w-24 rounded bg-sky-400/20" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-28 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-5/6 rounded bg-white/10" />
          <div className="h-3 w-4/6 rounded bg-white/10" />
        </div>
      </div>
    </div>
  )
}

export default function ExperiencePage() {
  const { data: experiences, isLoading, error } = useQuery({
    queryKey: ['experiences'],
    queryFn: fetchExperiences,
  })

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white">Experience</h1>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-sky-400" />
        </div>

        {/* Content */}
        {isLoading && (
          <div>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <p className="text-center text-white/60">Failed to load experiences.</p>
        )}

        {experiences && experiences.length === 0 && (
          <p className="text-center text-white/60">No experience entries yet.</p>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
