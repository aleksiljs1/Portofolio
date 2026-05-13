import {
  EdgesGeometry, LineSegments, LineBasicMaterial,
  TorusGeometry, CylinderGeometry,
} from 'three'
import type { Object3D } from 'three'

interface GearDef {
  radius: number; tube: number; radSeg: number; tubeSeg: number
  x: number; y: number; z: number
  rotSpeedX: number; rotSpeedY: number; rotSpeedZ: number
  color: number; opacity: number
}

// Gears live at the screen EDGES so they're visible around/behind the hero card.
// Camera is at z=12, FOV=60 → at z=0 the half-width is ~12*tan(30°)≈6.9 units.
// So x:±8 is clearly off-screen-center; y:±5 is top/bottom edge area.
const GEAR_DEFS: GearDef[] = [
  // Huge back ring — top-left, mostly visible, slow rotation
  { radius: 8.5, tube: 0.1, radSeg: 8, tubeSeg: 24,
    x: -7,  y: 4,   z: -6,
    rotSpeedX: 0.0001, rotSpeedY: 0.0003, rotSpeedZ: 0.0002,
    color: 0x38bdf8, opacity: 0.75 },

  // Large ring — bottom-right corner
  { radius: 6.0, tube: 0.08, radSeg: 7, tubeSeg: 20,
    x: 8, y: -4.5, z: -3,
    rotSpeedX: 0.0002, rotSpeedY: -0.0002, rotSpeedZ: 0.0004,
    color: 0x818cf8, opacity: 0.70 },

  // Medium ring — top-right
  { radius: 3.8, tube: 0.07, radSeg: 6, tubeSeg: 16,
    x: 7.5, y: 4.5, z: -1,
    rotSpeedX: -0.0004, rotSpeedY: 0.0005, rotSpeedZ: 0.0003,
    color: 0x38bdf8, opacity: 0.80 },

  // Small tight ring — bottom-left
  { radius: 2.5, tube: 0.06, radSeg: 5, tubeSeg: 14,
    x: -7, y: -4, z: 0,
    rotSpeedX: 0.0006, rotSpeedY: -0.0003, rotSpeedZ: 0.0008,
    color: 0xa78bfa, opacity: 0.85 },

  // Flat disc ring — far back centre, bleeds around card edges
  { radius: 7.0, tube: 0.05, radSeg: 16, tubeSeg: 8,
    x: 0, y: 0, z: -8,
    rotSpeedX: 0.0001, rotSpeedY: 0.0002, rotSpeedZ: 0.00015,
    color: 0x7dd3fc, opacity: 0.35 },

  // Inner accent ring — left mid
  { radius: 1.8, tube: 0.055, radSeg: 9, tubeSeg: 12,
    x: -4, y: 1, z: 1,
    rotSpeedX: -0.0007, rotSpeedY: 0.001, rotSpeedZ: 0.0005,
    color: 0xc4b5fd, opacity: 0.90 },
]

type GearLine = LineSegments & { _rotSpeed: { x: number; y: number; z: number } }
const gearLines: GearLine[] = []

export function createGears(scene: Object3D): void {
  for (const def of GEAR_DEFS) {
    const torus = new TorusGeometry(def.radius, def.tube, def.radSeg, def.tubeSeg)
    const edges = new EdgesGeometry(torus)
    const mat   = new LineBasicMaterial({ color: def.color, opacity: def.opacity, transparent: true })
    const line  = new LineSegments(edges, mat) as unknown as GearLine
    line.position.set(def.x, def.y, def.z)
    line._rotSpeed = { x: def.rotSpeedX, y: def.rotSpeedY, z: def.rotSpeedZ }
    gearLines.push(line)
    scene.add(line)
    torus.dispose()

    // Spokes — 3 diameters per ring, same rotation as ring
    const spokeGeo  = new CylinderGeometry(0.012, 0.012, def.radius * 1.9, 4)
    const spokeEdge = new EdgesGeometry(spokeGeo)
    for (let s = 0; s < 3; s++) {
      const spoke = new LineSegments(
        spokeEdge,
        new LineBasicMaterial({ color: def.color, opacity: def.opacity * 0.55, transparent: true }),
      ) as unknown as GearLine
      spoke.position.set(def.x, def.y, def.z)
      spoke.rotation.set(Math.PI / 2, (s * Math.PI) / 3, 0)
      spoke._rotSpeed = { x: def.rotSpeedX, y: def.rotSpeedY, z: def.rotSpeedZ }
      gearLines.push(spoke)
      scene.add(spoke)
    }
    spokeGeo.dispose()
  }
}

export function updateGears(_time: number): void {
  for (const l of gearLines) {
    l.rotation.x += l._rotSpeed.x
    l.rotation.y += l._rotSpeed.y
    l.rotation.z += l._rotSpeed.z
  }
}

export function disposeGears(): void {
  for (const l of gearLines) {
    l.removeFromParent()
    l.geometry.dispose()
    ;(l.material as LineBasicMaterial).dispose()
  }
  gearLines.length = 0
}
