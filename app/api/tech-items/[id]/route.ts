import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const UpdateTechItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['FRAMEWORK', 'LANGUAGE', 'SKILL']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateTechItemSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const techItem = await db.techItem.update({ where: { id }, data: parsed.data })
    return Response.json(techItem)
  } catch (e: any) {
    if (e?.code === 'P2025') return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await db.techItem.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    if (e?.code === 'P2025') return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
