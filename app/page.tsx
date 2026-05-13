import Image from 'next/image'
import Link from 'next/link'
import { db } from '@/lib/db'

const techPills = ['Next.js', 'Node.js', 'Python', 'Docker', 'TypeScript']
const stats = [
  { value: '7+', label: 'Applications built' },
  { value: '6',  label: 'Interns mentored' },
  { value: '3+', label: 'Years experience' },
]

export default async function Home() {
  let profileImageUrl: string | null = null
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'profileImageUrl' } })
    profileImageUrl = setting?.value ?? null
  } catch {
    // DB not reachable — render without profile image
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 px-12 py-16 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          {profileImageUrl && (
            <div className="mb-6 flex justify-center">
              <Image src={profileImageUrl} alt="Aleksandros Iljas" width={96} height={96}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-sky-400/40" unoptimized />
            </div>
          )}
          <div className="mb-6 inline-block rounded-full border border-sky-400/50 bg-sky-400/10 px-4 py-1.5 font-mono text-sm text-sky-400">
            &lt; Full Stack Engineer /&gt;
          </div>
          <h1 className="bg-gradient-to-r from-white to-sky-400 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
            Aleksandros Iljas
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/60 sm:text-xl">
            Building AI pipelines, microservices &amp; distributed systems that scale.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects" className="rounded-lg bg-sky-400 px-6 py-2.5 text-sm font-semibold text-[#050810] transition-opacity hover:opacity-90">
              View Projects
            </Link>
            <Link href="/experience" className="rounded-lg border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-400/50 hover:bg-white/5">
              See Experience
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {techPills.map((tech) => (
              <span key={tech} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">{tech}</span>
            ))}
          </div>
        </div>
        <div className="mt-12 flex items-center justify-center divide-x divide-white/10">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center px-8 text-center">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className="mt-1 text-xs text-white/50">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
