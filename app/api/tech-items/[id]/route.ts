import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateTechItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['FRAMEWORK', 'LANGUAGE', 'SKILL']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = UpdateTechItemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const techItem = await db.techItem.update({
      where: { id },
      data: parsed.data,
    })
    return Response.json(techItem)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.techItem.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
