import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  try {
    const techItems = await db.techItem.findMany({
      orderBy: { category: 'asc' },
      include: { _count: { select: { projects: true } } },
    })
    return Response.json(techItems)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const CreateTechItemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['FRAMEWORK', 'LANGUAGE', 'SKILL']),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = CreateTechItemSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const techItem = await db.techItem.create({ data: parsed.data })
    return Response.json(techItem, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') return Response.json({ error: 'Tech item already exists' }, { status: 409 })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
