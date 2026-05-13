export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
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
