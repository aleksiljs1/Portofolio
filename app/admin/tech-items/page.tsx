'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TechBadge } from '@/components/TechBadge'

type TechCategory = 'FRAMEWORK' | 'LANGUAGE' | 'SKILL'

interface TechItem {
  id: string
  name: string
  category: TechCategory
  _count: { projects: number }
}

const AddTechItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['FRAMEWORK', 'LANGUAGE', 'SKILL']),
})
type AddTechItemValues = z.infer<typeof AddTechItemSchema>

export default function AdminTechItemsPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: techItems = [], isLoading } = useQuery<TechItem[]>({
    queryKey: ['tech-items'],
    queryFn: () => fetch('/api/tech-items').then((r) => r.json()),
  })

  const addMutation = useMutation({
    mutationFn: (data: AddTechItemValues) =>
      fetch('/api/tech-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error('Failed to create tech item')
        return r.json()
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tech-items'] })
      toast.success('Tech item added')
      setDialogOpen(false)
      reset()
    },
    onError: () => toast.error('Failed to add tech item'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/tech-items/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok && r.status !== 204) throw new Error('Failed to delete')
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tech-items'] })
      toast.success('Tech item deleted')
    },
    onError: () => toast.error('Failed to delete tech item'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddTechItemValues>({
    resolver: zodResolver(AddTechItemSchema),
    defaultValues: { name: '', category: 'FRAMEWORK' },
  })

  const onSubmit = (data: AddTechItemValues) => addMutation.mutate(data)

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Tech Items</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="default">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Tech Item
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tech Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/80">
                    Name
                  </label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Next.js"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/80">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full rounded-lg border border-white/10 bg-[#050810] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    <option value="FRAMEWORK">Framework</option>
                    <option value="LANGUAGE">Language</option>
                    <option value="SKILL">Skill</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? 'Adding…' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-white/40">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead># Projects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/40">
                      No tech items yet.
                    </TableCell>
                  </TableRow>
                )}
                {techItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-white">{item.name}</TableCell>
                    <TableCell>
                      <TechBadge name={item.category} category={item.category} />
                    </TableCell>
                    <TableCell className="text-white/60">
                      {item._count?.projects ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
