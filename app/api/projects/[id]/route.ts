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
    const { title, description, imageUrl, liveUrl, githubUrl, featured, techItemIds } = body

    const project = await db.$transaction(async (tx) => {
      await tx.projectTech.deleteMany({ where: { projectId: id } })
      return tx.project.update({
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
        include: { techItems: { include: { techItem: true } } },
      })
    })

    return Response.json(project)
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
    await db.project.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e: any) {
    if (e?.code === 'P2025') return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
