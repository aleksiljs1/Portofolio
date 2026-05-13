'use client'

import dynamic from 'next/dynamic'

const SceneBackground = dynamic(
  () => import('@/components/SceneBackground'),
  { ssr: false }
)

export default function SceneBackgroundLoader() {
  return <SceneBackground />
}
