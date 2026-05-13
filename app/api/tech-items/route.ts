import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const techItems = await db.techItem.findMany({
    orderBy: { category: 'asc' },
    include: { _count: { select: { projects: true } } },
  })
  return Response.json(techItems)
}

const CreateTechItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['FRAMEWORK', 'LANGUAGE', 'SKILL']),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateTechItemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const techItem = await db.techItem.create({ data: parsed.data })
  return Response.json(techItem, { status: 201 })
}
