'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { initScene, destroyScene, transitionScene } from '@/lib/scene'

const PAGE_ORDER = ['/', '/projects', '/experience', '/about']

export default function SceneBackground() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const pathname    = usePathname()
  const prevPathRef = useRef<string | null>(null)

  // Init renderer ONCE on mount
  useEffect(() => {
    if (!canvasRef.current) return
    prevPathRef.current = pathname
    initScene(canvasRef.current, pathname)
    return () => destroyScene()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Slide gears on route change
  useEffect(() => {
    if (prevPathRef.current === null || prevPathRef.current === pathname) return
    prevPathRef.current = pathname
    transitionScene(pathname)
  }, [pathname])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none opacity-90"
      aria-hidden="true"
    />
  )
}
