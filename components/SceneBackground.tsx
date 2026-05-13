'use client'

import { useEffect, useRef } from 'react'
import { initScene, destroyScene } from '@/lib/scene'

export default function SceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    initScene(canvasRef.current)
    return () => destroyScene()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
