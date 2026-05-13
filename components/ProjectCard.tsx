import Image from 'next/image'
import { GitBranch, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TechItem {
  id: string
  name: string
  category: 'FRAMEWORK' | 'LANGUAGE' | 'SKILL'
}

interface ProjectTech {
  projectId: string
  techItemId: string
  order: number
  techItem: TechItem
}

export interface Project {
  id: string
  title: string
  description: string
  imageUrl: string | null
  liveUrl: string | null
  githubUrl: string | null
  featured: boolean
  order: number
  techItems: ProjectTech[]
}

interface ProjectCardProps {
  project: Project
}

function techBadgeClass(category: TechItem['category']): string {
  if (category === 'FRAMEWORK') return 'border-sky-400/50 text-sky-400 bg-sky-400/10'
  if (category === 'LANGUAGE') return 'border-indigo-400/50 text-indigo-400 bg-indigo-400/10'
  return 'border-white/20 text-white/60 bg-white/5'
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const sortedTech = [...project.techItems].sort((a, b) => a.order - b.order)

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden group/card flex flex-col">
      {/* Image or gradient placeholder */}
      <div className="relative h-44 w-full overflow-hidden shrink-0">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="font-mono text-2xl font-bold text-white/20 select-none">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <CardHeader className="pt-4 pb-0">
        <CardTitle className="text-white text-base font-semibold">
          {project.title}
        </CardTitle>
        <CardDescription className="text-white/60 line-clamp-2 text-sm">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-3">
        {sortedTech.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sortedTech.map(({ techItem }) => (
              <span
                key={techItem.id}
                className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${techBadgeClass(techItem.category)}`}
              >
                {techItem.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-white/10 bg-transparent pt-3 pb-3 px-4 flex items-center gap-4">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-xs"
            aria-label="GitHub repository"
          >
            <GitBranch size={14} />
            <span>GitHub</span>
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sky-400/70 hover:text-sky-400 transition-colors text-xs"
            aria-label="Live demo"
          >
            <ExternalLink size={14} />
            <span>Live Demo</span>
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
