import { auth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { extname } from 'path'
import { join } from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
  }

  const ext = extname(file.name) || `.${file.type.split('/')[1]}`
  const filename = `profile-${Date.now()}${ext}`
  const dest = join(process.cwd(), 'public', 'pictures', filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(dest, buffer)

  return Response.json({ url: `/pictures/${filename}` })
}
