import {
  Group, Mesh, EdgesGeometry, LineSegments, LineBasicMaterial,
  TorusGeometry, CylinderGeometry, BufferGeometry,
} from 'three'
import type { Object3D } from 'three'

interface GearDef {
  radius: number
  tube: number
  radSeg: number
  tubeSeg: number
  x: number; y: number; z: number
  rotSpeedX: number; rotSpeedY: number; rotSpeedZ: number
  color: number
  opacity: number
}

const GEAR_DEFS: GearDef[] = [
  // Large back ring — slow Y rotation
  { radius: 6.5, tube: 0.08, radSeg: 7, tubeSeg: 20,
    x: 2, y: 0, z: -4, rotSpeedX: 0, rotSpeedY: 0.0003, rotSpeedZ: 0.0002,
    color: 0x38bdf8, opacity: 0.55 },
  // Medium left ring — tilted, faster
  { radius: 4.0, tube: 0.06, radSeg: 6, tubeSeg: 18,
    x: -5, y: 1.5, z: -2, rotSpeedX: 0.0004, rotSpeedY: 0.0002, rotSpeedZ: 0.0005,
    color: 0x818cf8, opacity: 0.45 },
  // Small right ring — spinning in a different axis
  { radius: 2.8, tube: 0.055, radSeg: 5, tubeSeg: 16,
    x: 5.5, y: -1, z: -1, rotSpeedX: 0.0006, rotSpeedY: -0.0003, rotSpeedZ: 0.0007,
    color: 0x38bdf8, opacity: 0.40 },
  // Large flat disc (gear face) — horizontal, slow
  { radius: 5.0, tube: 0.04, radSeg: 16, tubeSeg: 6,
    x: -1, y: -3.5, z: -5, rotSpeedX: 0.0002, rotSpeedY: 0.0004, rotSpeedZ: 0,
    color: 0xc7d2fe, opacity: 0.25 },
  // Inner detail ring
  { radius: 1.8, tube: 0.05, radSeg: 8, tubeSeg: 14,
    x: 3, y: 2.5, z: 0, rotSpeedX: -0.0005, rotSpeedY: 0.0008, rotSpeedZ: 0.0003,
    color: 0xa78bfa, opacity: 0.50 },
]

const gearMeshes: Mesh[] = []

export function createGears(scene: Object3D): void {
  for (const def of GEAR_DEFS) {
    const torus    = new TorusGeometry(def.radius, def.tube, def.radSeg, def.tubeSeg)
    const edges    = new EdgesGeometry(torus)
    const material = new LineBasicMaterial({
      color:       def.color,
      opacity:     def.opacity,
      transparent: true,
    })
    const mesh = new Mesh(torus)
    const lines = new LineSegments(edges, material)
    lines.position.set(def.x, def.y, def.z)
    ;(lines as any)._rotSpeed = { x: def.rotSpeedX, y: def.rotSpeedY, z: def.rotSpeedZ }
    gearMeshes.push(lines as unknown as Mesh)
    scene.add(lines)

    // Spokes — 3 thin cylinders across the ring diameter
    const spokeGeo  = new CylinderGeometry(0.01, 0.01, def.radius * 2, 4)
    const spokeEdge = new EdgesGeometry(spokeGeo)
    for (let s = 0; s < 3; s++) {
      const spoke = new LineSegments(spokeEdge, new LineBasicMaterial({
        color: def.color, opacity: def.opacity * 0.6, transparent: true,
      }))
      spoke.position.set(def.x, def.y, def.z)
      spoke.rotation.set(Math.PI / 2, (s * Math.PI) / 3, 0)
      ;(spoke as any)._rotSpeed = { x: def.rotSpeedX, y: def.rotSpeedY, z: def.rotSpeedZ }
      ;(spoke as any)._isSpoke  = true
      gearMeshes.push(spoke as unknown as Mesh)
      scene.add(spoke)
    }

    torus.dispose()
    spokeGeo.dispose()
  }
}

export function updateGears(_time: number): void {
  for (const m of gearMeshes) {
    const rs = (m as any)._rotSpeed
    if (!rs) continue
    m.rotation.x += rs.x
    m.rotation.y += rs.y
    m.rotation.z += rs.z
  }
}

export function disposeGears(): void {
  for (const m of gearMeshes) {
    m.removeFromParent()
    ;(m as any).geometry?.dispose()
    ;(m as any).material?.dispose()
  }
  gearMeshes.length = 0
}
