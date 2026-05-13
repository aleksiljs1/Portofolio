import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { title, company, location, startDate, endDate, current, description } = body

    const descriptionLines: string[] =
      typeof description === 'string'
        ? description.split('\n').filter((l: string) => l.trim() !== '')
        : description ?? []

    const experience = await db.experience.update({
      where: { id },
      data: {
        title, company, location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current ?? false,
        description: descriptionLines,
      },
    })
    return Response.json(experience)
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
    await db.experience.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    if (e?.code === 'P2025') return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
