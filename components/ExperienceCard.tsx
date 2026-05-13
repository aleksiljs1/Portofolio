'use client'

import { format } from 'date-fns'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string | Date
  endDate: string | Date | null
  current: boolean
  description: string[]
  order: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface ExperienceCardProps {
  experience: Experience
}

function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM yyyy')
}

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const start = formatDate(experience.startDate)
  const end = experience.current || !experience.endDate
    ? 'Present'
    : formatDate(experience.endDate)

  return (
    <div className="flex gap-4">
      {/* Timeline accent */}
      <div className="flex flex-col items-center">
        <div className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-sky-400" />
        <div className="mt-1 w-0.5 flex-1 bg-sky-400/30" />
      </div>

      {/* Card */}
      <div className="mb-8 flex-1 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">{experience.company}</h3>
            <p className="text-sm font-medium text-sky-400">{experience.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">
              {start} – {end}
            </p>
            <p className="text-xs text-white/40">{experience.location}</p>
          </div>
        </div>

        {experience.description.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {experience.description.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sky-400/70" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
