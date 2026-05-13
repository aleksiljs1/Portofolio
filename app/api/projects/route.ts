import { db } from '@/lib/db'

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { order: 'asc' },
    include: {
      techItems: {
        include: { techItem: true },
        orderBy: { order: 'asc' },
      },
    },
  })
  return Response.json(projects)
}

export async function POST(request: Request) {
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
    include: {
      techItems: {
        include: { techItem: true },
      },
    },
  })

  return Response.json(project, { status: 201 })
}
