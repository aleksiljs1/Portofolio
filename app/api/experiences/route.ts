import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const experiences = await db.experience.findMany({ orderBy: { order: 'asc' } })
    return Response.json(experiences)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, company, location, startDate, endDate, current, description, order } = body

    const descriptionLines: string[] =
      typeof description === 'string'
        ? description.split('\n').filter((l: string) => l.trim() !== '')
        : description ?? []

    const experience = await db.experience.create({
      data: {
        title,
        company,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current ?? false,
        description: descriptionLines,
        order: order ?? 0,
      },
    })
    return Response.json(experience, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
