'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Image from 'next/image'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: { siteTitle: '', profileImageUrl: '' },
  })

  const profileImageUrl = watch('profileImageUrl')

  useEffect(() => {
    if (settings) {
      reset({
        siteTitle: settings.siteTitle ?? '',
        profileImageUrl: settings.profileImageUrl ?? '',
      })
      setPreview(settings.profileImageUrl ?? null)
    }
  }, [settings, reset])

  useEffect(() => {
    setPreview(profileImageUrl || null)
  }, [profileImageUrl])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!r.ok) {
        const { error } = await r.json()
        toast.error(error ?? 'Upload failed')
        return
      }
      const { url } = await r.json()
      setValue('profileImageUrl', url, { shouldDirty: true, shouldValidate: true })
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [setValue])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

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
                Profile Photo
              </label>

              {/* Preview */}
              {preview && (
                <div className="mb-3 flex items-center gap-4">
                  <Image
                    src={preview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-sky-400/40"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValue('profileImageUrl', '', { shouldDirty: true, shouldValidate: true })
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Drag-and-drop / click zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={[
                  'mb-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-6 py-8 text-sm transition-colors select-none',
                  dragging
                    ? 'border-sky-400 bg-sky-400/10 text-sky-400'
                    : 'border-white/20 bg-white/5 text-white/50 hover:border-sky-400/50 hover:text-sky-400',
                  uploading ? 'pointer-events-none opacity-50' : '',
                ].join(' ')}
              >
                <svg className="h-7 w-7 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="font-medium">
                  {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : 'Drag & drop or click to select'}
                </span>
                <span className="text-xs opacity-50">JPEG, PNG, WebP, GIF — max 5 MB</span>
              </div>

              {/* URL fallback */}
              <input
                {...register('profileImageUrl')}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
              />
              <p className="mt-1 text-xs text-white/30">Or paste an image URL above</p>
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
