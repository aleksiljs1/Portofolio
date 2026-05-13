import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title, description, imageUrl, liveUrl, githubUrl, featured, techItemIds } = body

  // Delete existing tech items and re-insert
  await db.projectTech.deleteMany({ where: { projectId: id } })

  const project = await db.project.update({
    where: { id },
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

  return Response.json(project)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.project.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
