'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { MenuIcon, X } from 'lucide-react'
import { useFilterStore } from '@/lib/store'

interface TechItem {
  id: string
  name: string
  category: 'FRAMEWORK' | 'LANGUAGE' | 'SKILL'
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const setActiveTech = useFilterStore((s) => s.setActiveTech)

  const { data: techItems = [] } = useQuery<TechItem[]>({
    queryKey: ['tech-items'],
    queryFn: () => fetch('/api/tech-items').then((r) => r.json()),
  })

  const frameworks = techItems.filter((t) => t.category === 'FRAMEWORK')
  const languages = techItems.filter((t) => t.category === 'LANGUAGE')
  const skills = techItems.filter((t) => t.category === 'SKILL')

  function openDropdown() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setDropdownOpen(true)
  }

  function scheduleClose() {
    hoverTimeout.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  return (
    <nav className="fixed top-0 z-20 w-full bg-white/5 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — clicks go home */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-mono text-xs font-bold bg-sky-400/10 border border-sky-400/30 text-sky-400 px-2 py-1 rounded group-hover:bg-sky-400/20 transition-colors">
              AI
            </span>
            <span className="text-white font-medium tracking-tight group-hover:text-sky-400 transition-colors">
              Aleksandros Iljas
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Projects with hover dropdown — custom, no portal */}
            <div
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={scheduleClose}
            >
              <button
                className="text-white/70 hover:text-white transition-colors text-sm bg-transparent border-0 p-0 cursor-pointer"
                onClick={() => router.push('/projects')}
              >
                Projects
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 top-full w-52 rounded-xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-md shadow-xl overflow-hidden">
                  {/* invisible bridge so mouse can move from trigger into panel */}
                  <div className="h-2 w-full" />

                  {frameworks.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">Frameworks</p>
                      {frameworks.map((item) => (
                        <button
                          key={item.id}
                          className="w-full text-left rounded px-2 py-1.5 text-sm text-sky-400 hover:bg-white/10 hover:text-sky-300 transition-colors"
                          onClick={() => { setActiveTech(item.name); router.push('/projects'); setDropdownOpen(false) }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {frameworks.length > 0 && languages.length > 0 && (
                    <div className="mx-2 border-t border-white/10" />
                  )}
                  {languages.length > 0 && (
                    <div className="px-2 py-1">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">Languages</p>
                      {languages.map((item) => (
                        <button
                          key={item.id}
                          className="w-full text-left rounded px-2 py-1.5 text-sm text-indigo-400 hover:bg-white/10 hover:text-indigo-300 transition-colors"
                          onClick={() => { setActiveTech(item.name); router.push('/projects'); setDropdownOpen(false) }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {languages.length > 0 && skills.length > 0 && (
                    <div className="mx-2 border-t border-white/10" />
                  )}
                  {skills.length > 0 && (
                    <div className="px-2 py-1 pb-2">
                      <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40">Skills</p>
                      {skills.map((item) => (
                        <button
                          key={item.id}
                          className="w-full text-left rounded px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                          onClick={() => { setActiveTech(item.name); router.push('/projects'); setDropdownOpen(false) }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/experience"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              Experience
            </Link>
            <Link
              href="/about"
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              About
            </Link>

            <Link
              href="/about"
              className="text-sm border border-sky-400 text-sky-400 hover:bg-sky-400/10 transition-colors px-4 py-1.5 rounded-md"
            >
              Contact
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#050810]/95 backdrop-blur-md">
          <div className="flex flex-col px-4 py-4 gap-4">
            <Link
              href="/"
              className="text-white/70 hover:text-white transition-colors text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/projects"
              className="text-white/70 hover:text-white transition-colors text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Projects
            </Link>
            <Link
              href="/experience"
              className="text-white/70 hover:text-white transition-colors text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Experience
            </Link>
            <Link
              href="/about"
              className="text-white/70 hover:text-white transition-colors text-sm"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>

            {techItems.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-white/40 uppercase tracking-wider text-[10px] mb-3">
                  Filter by Tech
                </p>
                <div className="flex flex-wrap gap-2">
                  {techItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTech(item.name)
                        router.push('/projects')
                        setMobileOpen(false)
                      }}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        item.category === 'FRAMEWORK'
                          ? 'border-sky-400/50 text-sky-400 hover:bg-sky-400/10'
                          : item.category === 'LANGUAGE'
                          ? 'border-indigo-400/50 text-indigo-400 hover:bg-indigo-400/10'
                          : 'border-white/20 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/about"
              className="text-sm border border-sky-400 text-sky-400 hover:bg-sky-400/10 transition-colors px-4 py-2 rounded-md text-center"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
