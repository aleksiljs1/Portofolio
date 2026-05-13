import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()
    const result: Record<string, string> = {}
    for (const s of settings) result[s.key] = s.value
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const UpsertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = UpsertSettingSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const setting = await db.siteSetting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    })
    return Response.json(setting)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
