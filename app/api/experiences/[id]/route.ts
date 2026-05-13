import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      title,
      company,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current: current ?? false,
      description: descriptionLines,
    },
  })

  return Response.json(experience)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.experience.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
