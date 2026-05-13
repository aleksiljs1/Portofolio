import { Points, BufferGeometry, BufferAttribute, PointsMaterial } from 'three'
import type { Object3D } from 'three'

let stars: Points | null = null

export function createStars(scene: Object3D, count = 1200): void {
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // Distribute in a large shell so they always surround the scene
    pos[i * 3]     = (Math.random() - 0.5) * 80
    pos[i * 3 + 1] = (Math.random() - 0.5) * 50
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20  // push back
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))

  const mat = new PointsMaterial({
    color: 0xffffff,
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
  })

  stars = new Points(geo, mat)
  scene.add(stars)
}

export function disposeStars(): void {
  if (!stars) return
  stars.removeFromParent()
  ;(stars.geometry as BufferGeometry).dispose()
  ;(stars.material as PointsMaterial).dispose()
  stars = null
}
