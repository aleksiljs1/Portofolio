'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProjectForm } from '@/components/admin/ProjectForm'

interface TechItem {
  id: string
  name: string
  category: string
}

interface Project {
  id: string
  title: string
  description: string
  imageUrl: string | null
  liveUrl: string | null
  githubUrl: string | null
  featured: boolean
  techItems: { techItem: TechItem }[]
}

export default function AdminProjectsPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Project deleted')
      await qc.invalidateQueries({ queryKey: ['projects'] })
    } else {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            className="bg-white text-[#050810] font-medium rounded-lg px-4 py-2 text-sm hover:bg-white/90 transition-colors"
          >
            Add Project
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Title</TableHead>
                <TableHead className="text-white/50">Tech</TableHead>
                <TableHead className="text-white/50">Featured</TableHead>
                <TableHead className="text-white/50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {project.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {project.techItems.slice(0, 4).map(({ techItem }) => (
                        <Badge
                          key={techItem.id}
                          variant="secondary"
                          className="text-xs bg-white/10 text-white/70 border-0"
                        >
                          {techItem.name}
                        </Badge>
                      ))}
                      {project.techItems.length > 4 && (
                        <Badge variant="outline" className="text-xs border-white/20 text-white/40">
                          +{project.techItems.length - 4}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${project.featured ? 'text-green-400' : 'text-white/30'}`}
                    >
                      {project.featured ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editProject?.id === project.id}
                        onOpenChange={(open) => !open && setEditProject(null)}
                      >
                        <DialogTrigger
                          onClick={() => setEditProject(project)}
                          className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
                        >
                          Edit
                        </DialogTrigger>
                        <DialogContent className="bg-[#0d1117] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Project</DialogTitle>
                          </DialogHeader>
                          {editProject && (
                            <ProjectForm
                              project={editProject}
                              onSuccess={() => setEditProject(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/5"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-white/30 py-8">
                    No projects yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
