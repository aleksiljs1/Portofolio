'use client'

import { useQuery } from '@tanstack/react-query'
import ProjectCard, { type Project } from '@/components/ProjectCard'
import { useFilterStore } from '@/lib/store'

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
      <div className="h-44 bg-white/10" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 bg-white/10 rounded w-16" />
          <div className="h-5 bg-white/10 rounded w-20" />
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })

  const activeTech = useFilterStore((s) => s.activeTech)
  const setActiveTech = useFilterStore((s) => s.setActiveTech)

  const filtered = activeTech
    ? projects.filter((p) =>
        p.techItems.some((pt) => pt.techItem.name === activeTech)
      )
    : projects

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-white/50 text-sm">
            A collection of things I&apos;ve built.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTech(null)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              activeTech === null
                ? 'border-sky-400 bg-sky-400/10 text-sky-400'
                : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
            }`}
          >
            All
          </button>
          {activeTech && (
            <div className="flex items-center gap-2 bg-sky-400/10 border border-sky-400/40 text-sky-400 text-sm px-3 py-1 rounded-full">
              <span>{activeTech}</span>
              <button
                onClick={() => setActiveTech(null)}
                aria-label="Clear filter"
                className="hover:text-white transition-colors leading-none"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/40 text-sm">
            No projects match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
