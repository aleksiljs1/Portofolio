'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  liveUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  featured: z.boolean(),
  techItemIds: z.array(z.string()).min(1, 'Select at least one tech item'),
})

type ProjectFormValues = z.infer<typeof projectSchema>

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

interface ProjectFormProps {
  project?: Project
  onSuccess: () => void
}

const inputClass =
  'w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/40 transition-colors'
const labelClass = 'block text-white/60 text-sm mb-1.5'

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const qc = useQueryClient()

  const { data: techItems = [] } = useQuery<TechItem[]>({
    queryKey: ['tech-items'],
    queryFn: () => fetch('/api/tech-items').then((r) => r.json()),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      liveUrl: '',
      githubUrl: '',
      featured: false,
      techItemIds: [],
    },
  })

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        imageUrl: project.imageUrl ?? '',
        liveUrl: project.liveUrl ?? '',
        githubUrl: project.githubUrl ?? '',
        featured: project.featured,
        techItemIds: project.techItems.map((pt) => pt.techItem.id),
      })
    }
  }, [project, reset])

  const selectedIds = watch('techItemIds')

  function toggleTechItem(id: string) {
    const current = selectedIds ?? []
    if (current.includes(id)) {
      setValue(
        'techItemIds',
        current.filter((x) => x !== id),
        { shouldValidate: true }
      )
    } else {
      setValue('techItemIds', [...current, id], { shouldValidate: true })
    }
  }

  const grouped = techItems.reduce<Record<string, TechItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  async function onSubmit(values: ProjectFormValues) {
    const url = project ? `/api/projects/${project.id}` : '/api/projects'
    const method = project ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      toast.error('Failed to save project')
      return
    }

    toast.success('Project saved')
    await qc.invalidateQueries({ queryKey: ['projects'] })
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Title</label>
        <input {...register('title')} className={inputClass} placeholder="My Project" />
        {errors.title && (
          <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Project description…"
        />
        {errors.description && (
          <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Image URL</label>
        <input {...register('imageUrl')} className={inputClass} placeholder="https://…" />
        {errors.imageUrl && (
          <p className="text-red-400 text-xs mt-1">{errors.imageUrl.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Live URL</label>
        <input {...register('liveUrl')} className={inputClass} placeholder="https://…" />
        {errors.liveUrl && (
          <p className="text-red-400 text-xs mt-1">{errors.liveUrl.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>GitHub URL</label>
        <input {...register('githubUrl')} className={inputClass} placeholder="https://github.com/…" />
        {errors.githubUrl && (
          <p className="text-red-400 text-xs mt-1">{errors.githubUrl.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          {...register('featured')}
          className="accent-white w-4 h-4"
        />
        <label htmlFor="featured" className="text-white/60 text-sm">
          Featured project
        </label>
      </div>

      <div>
        <label className={labelClass}>Tech Items</label>
        {errors.techItemIds && (
          <p className="text-red-400 text-xs mb-2">{errors.techItemIds.message}</p>
        )}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1.5">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const checked = selectedIds?.includes(item.id) ?? false
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTechItem(item.id)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        checked
                          ? 'bg-white/20 border-white/40 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
                      }`}
                    >
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white text-[#050810] font-medium rounded-lg py-2 text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving…' : project ? 'Update Project' : 'Create Project'}
      </button>
    </form>
  )
}
