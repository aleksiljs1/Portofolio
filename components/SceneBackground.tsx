'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { initScene, destroyScene } from '@/lib/scene'

export default function SceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pathname  = usePathname()

  useEffect(() => {
    if (!canvasRef.current) return
    const mode = pathname === '/' ? 'home' : 'default'
    initScene(canvasRef.current, mode)
    return () => destroyScene()
  }, [pathname])   // reinit when route changes

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none opacity-90"
      aria-hidden="true"
    />
  )
}
