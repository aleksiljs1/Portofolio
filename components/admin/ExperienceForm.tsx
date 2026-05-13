'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const experienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().min(1, 'Description is required'),
})

type ExperienceFormValues = z.infer<typeof experienceSchema>

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

interface ExperienceFormProps {
  experience?: Experience
  onSuccess: () => void
}

const inputClass =
  'w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/40 transition-colors'
const labelClass = 'block text-white/60 text-sm mb-1.5'

function toDateInput(val: string | null | undefined): string {
  if (!val) return ''
  return val.slice(0, 10)
}

export function ExperienceForm({ experience, onSuccess }: ExperienceFormProps) {
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    },
  })

  useEffect(() => {
    if (experience) {
      reset({
        title: experience.title,
        company: experience.company,
        location: experience.location,
        startDate: toDateInput(experience.startDate),
        endDate: toDateInput(experience.endDate),
        current: experience.current,
        description: experience.description.join('\n'),
      })
    }
  }, [experience, reset])

  async function onSubmit(values: ExperienceFormValues) {
    const url = experience ? `/api/experiences/${experience.id}` : '/api/experiences'
    const method = experience ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      toast.error('Failed to save experience')
      return
    }

    toast.success('Experience saved')
    await qc.invalidateQueries({ queryKey: ['experiences'] })
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Title</label>
        <input {...register('title')} className={inputClass} placeholder="Software Engineer" />
        {errors.title && (
          <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Company</label>
        <input {...register('company')} className={inputClass} placeholder="Acme Corp" />
        {errors.company && (
          <p className="text-red-400 text-xs mt-1">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Location</label>
        <input {...register('location')} className={inputClass} placeholder="Remote / Berlin, DE" />
        {errors.location && (
          <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            {...register('startDate')}
            className={inputClass}
          />
          {errors.startDate && (
            <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="date"
            {...register('endDate')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="current"
          {...register('current')}
          className="accent-white w-4 h-4"
        />
        <label htmlFor="current" className="text-white/60 text-sm">
          Currently working here
        </label>
      </div>

      <div>
        <label className={labelClass}>Description (one bullet per line)</label>
        <textarea
          {...register('description')}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="Built X using Y&#10;Reduced latency by Z%"
        />
        {errors.description && (
          <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white text-[#050810] font-medium rounded-lg py-2 text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving…' : experience ? 'Update Experience' : 'Create Experience'}
      </button>
    </form>
  )
}
