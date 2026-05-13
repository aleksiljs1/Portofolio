'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, GitBranch, X } from 'lucide-react'
import { useFilterStore } from '@/lib/store'
import type { Project } from '@/components/ProjectCard'

function techBadgeClass(category: string) {
  if (category === 'FRAMEWORK') return 'border-sky-400/50 text-sky-400 bg-sky-400/10'
  if (category === 'LANGUAGE')  return 'border-indigo-400/50 text-indigo-400 bg-indigo-400/10'
  return 'border-white/20 text-white/60 bg-white/5'
}

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

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const sorted = [...project.techItems].sort((a, b) => a.order - b.order)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#080e1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />

        <div className="p-6 sm:p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Featured badge */}
          {project.featured && (
            <span className="inline-block mb-3 rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 text-xs text-sky-400">
              Featured
            </span>
          )}

          <h2 className="text-xl font-bold text-white sm:text-2xl mb-4 pr-8">
            {project.title}
          </h2>

          <p className="text-white/70 text-sm leading-relaxed mb-6">
            {project.description}
          </p>

          {/* Tech stack */}
          {sorted.length > 0 && (
            <div className="mb-6">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {sorted.map(({ techItem }) => (
                  <span
                    key={techItem.id}
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${techBadgeClass(techItem.category)}`}
                  >
                    {techItem.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(project.githubUrl || project.liveUrl) && (
            <div className="flex gap-4">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/40 hover:text-white transition-colors"
                >
                  <GitBranch size={15} /> GitHub
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm text-sky-400 hover:bg-sky-400/20 transition-colors"
                >
                  <ExternalLink size={15} /> Live Demo
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const sorted = [...project.techItems].sort((a, b) => a.order - b.order)
  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-sky-400/30 transition-all duration-300 overflow-hidden group flex flex-col cursor-pointer"
    >
      {/* Image / gradient top */}
      <div className="relative h-44 w-full overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-violet-500/20 flex items-center justify-center group-hover:from-sky-500/30 transition-all duration-300">
          <span className="font-mono text-3xl font-bold text-white/15 select-none group-hover:text-white/25 transition-colors">
            {project.title.slice(0, 2).toUpperCase()}
          </span>
        </div>
        {project.featured && (
          <span className="absolute top-3 right-3 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-400">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white text-sm font-semibold mb-2 leading-snug">
          {project.title}
        </h3>
        <p className="text-white/55 text-xs leading-relaxed line-clamp-3 flex-1 mb-3">
          {project.description}
        </p>

        {/* Tech pills — top 5 only, +N more */}
        <div className="flex flex-wrap gap-1 mt-auto">
          {sorted.slice(0, 5).map(({ techItem }) => (
            <span
              key={techItem.id}
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${techBadgeClass(techItem.category)}`}
            >
              {techItem.name}
            </span>
          ))}
          {sorted.length > 5 && (
            <span className="inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">
              +{sorted.length - 5}
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-sky-400/60 group-hover:text-sky-400 transition-colors">
          Click to view details →
        </p>
      </div>
    </button>
  )
}

export default function ProjectsPage() {
  const [selected, setSelected] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })

  const activeTech    = useFilterStore((s) => s.activeTech)
  const setActiveTech = useFilterStore((s) => s.setActiveTech)

  const filtered = activeTech
    ? projects.filter((p) => p.techItems.some((pt) => pt.techItem.name === activeTech))
    : projects

  return (
    <>
      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}

      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-white/50 text-sm">Click any card to see full details.</p>
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
                <button onClick={() => setActiveTech(null)} aria-label="Clear filter" className="hover:text-white transition-colors leading-none">&times;</button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-white/40 text-sm">No projects match the selected filter.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => setSelected(project)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
