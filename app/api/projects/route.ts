import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      include: {
        techItems: {
          include: { techItem: true },
          orderBy: { order: 'asc' },
        },
      },
    })
    return Response.json(projects)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, imageUrl, liveUrl, githubUrl, featured, techItemIds } = body

    if (!title || !description) {
      return Response.json({ error: 'title and description are required' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        liveUrl: liveUrl || null,
        githubUrl: githubUrl || null,
        featured: featured ?? false,
        techItems: {
          create: (techItemIds ?? []).map((techItemId: string, index: number) => ({
            techItemId,
            order: index,
          })),
        },
      },
      include: { techItems: { include: { techItem: true } } },
    })

    return Response.json(project, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
