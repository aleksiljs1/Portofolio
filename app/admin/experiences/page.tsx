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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ExperienceForm } from '@/components/admin/ExperienceForm'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string | null
  current: boolean
  description: string[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 7)
}

export default function AdminExperiencesPage() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editExp, setEditExp] = useState<Experience | null>(null)

  const { data: experiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ['experiences'],
    queryFn: () => fetch('/api/experiences').then((r) => r.json()),
  })

  async function handleDelete(id: string) {
    if (!confirm('Delete this experience?')) return
    const res = await fetch(`/api/experiences/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Experience deleted')
      await qc.invalidateQueries({ queryKey: ['experiences'] })
    } else {
      toast.error('Failed to delete experience')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Experiences</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            className="bg-white text-[#050810] font-medium rounded-lg px-4 py-2 text-sm hover:bg-white/90 transition-colors"
          >
            Add Experience
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">New Experience</DialogTitle>
            </DialogHeader>
            <ExperienceForm onSuccess={() => setAddOpen(false)} />
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
                <TableHead className="text-white/50">Company</TableHead>
                <TableHead className="text-white/50">Period</TableHead>
                <TableHead className="text-white/50">Current</TableHead>
                <TableHead className="text-white/50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiences.map((exp) => (
                <TableRow key={exp.id} className="border-white/10">
                  <TableCell className="text-white font-medium">{exp.title}</TableCell>
                  <TableCell className="text-white/70">{exp.company}</TableCell>
                  <TableCell className="text-white/50 text-xs">
                    {formatDate(exp.startDate)}
                    {' – '}
                    {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${exp.current ? 'text-green-400' : 'text-white/30'}`}
                    >
                      {exp.current ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editExp?.id === exp.id}
                        onOpenChange={(open) => !open && setEditExp(null)}
                      >
                        <DialogTrigger
                          onClick={() => setEditExp(exp)}
                          className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
                        >
                          Edit
                        </DialogTrigger>
                        <DialogContent className="bg-[#0d1117] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Experience</DialogTitle>
                          </DialogHeader>
                          {editExp && (
                            <ExperienceForm
                              experience={editExp}
                              onSuccess={() => setEditExp(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/5"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {experiences.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/30 py-8">
                    No experiences yet
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
