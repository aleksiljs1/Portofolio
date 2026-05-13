import Image from 'next/image'
import { db } from '@/lib/db'

export default async function Home() {
  const profileImageSetting = await db.siteSetting.findUnique({
    where: { key: 'profileImageUrl' },
  })
  const profileImageUrl = profileImageSetting?.value ?? null

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
        {profileImageUrl && (
          <div className="mb-6 flex justify-center">
            <Image
              src={profileImageUrl}
              alt="Aleksandros Iljas"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-sky-400/40"
              unoptimized
            />
          </div>
        )}
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Aleksandros Iljas
        </h1>
        <p className="mt-4 text-xl font-medium text-sky-400 sm:text-2xl">
          Full Stack Software Developer
        </p>
        <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
          Building AI pipelines, microservices, and distributed systems that scale.
        </p>
      </div>
    </div>
  )
}
