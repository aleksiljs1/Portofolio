'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const SettingsSchema = z.object({
  siteTitle: z.string().min(1, 'Site title is required'),
  profileImageUrl: z.string().url('Must be a valid URL').or(z.literal('')),
})
type SettingsValues = z.infer<typeof SettingsSchema>

interface SiteSettings {
  siteTitle?: string
  profileImageUrl?: string
}

async function patchSetting(key: string, value: string) {
  const r = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!r.ok) throw new Error('Failed to save setting')
  return r.json()
}

export default function AdminSettingsPage() {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: { siteTitle: '', profileImageUrl: '' },
  })

  useEffect(() => {
    if (settings) {
      reset({
        siteTitle: settings.siteTitle ?? '',
        profileImageUrl: settings.profileImageUrl ?? '',
      })
    }
  }, [settings, reset])

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsValues) => {
      await Promise.all([
        patchSetting('siteTitle', data.siteTitle),
        patchSetting('profileImageUrl', data.profileImageUrl),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const onSubmit = (data: SettingsValues) => saveMutation.mutate(data)

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
        {isLoading ? (
          <p className="mt-6 text-sm text-white/40">Loading settings…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">
                Site Title
              </label>
              <input
                {...register('siteTitle')}
                placeholder="Aleksandros Iljas — Full Stack Developer"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              />
              {errors.siteTitle && (
                <p className="mt-1 text-xs text-red-400">{errors.siteTitle.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">
                Profile Image URL
              </label>
              <input
                {...register('profileImageUrl')}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              />
              {errors.profileImageUrl && (
                <p className="mt-1 text-xs text-red-400">{errors.profileImageUrl.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={saveMutation.isPending || !isDirty}
              className="w-full"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
