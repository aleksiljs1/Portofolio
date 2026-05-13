import {
  BufferGeometry, Float32BufferAttribute, LineLoop, LineBasicMaterial,
  Points, PointsMaterial, AdditiveBlending, Group,
} from 'three'
import type { Object3D } from 'three'

// Creates a flat gear outline (toothed circle) as a LineLoop
function gearOutlineGeo(outerR: number, innerR: number, teeth: number): BufferGeometry {
  const pts: number[] = []
  const steps = teeth * 4   // 4 vertices per tooth: rise, top, top, fall

  for (let i = 0; i <= steps; i++) {
    const t    = i / steps
    const ang  = t * Math.PI * 2
    // Tooth profile: outer radius at 0° and 50% of tooth width, inner at 25% and 75%
    const phase = (i % 4)
    const r     = (phase === 1 || phase === 2) ? outerR : innerR
    pts.push(Math.cos(ang) * r, Math.sin(ang) * r, 0)
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return geo
}

// Spoke circle for the gear hub
function hubGeo(r: number, spokes: number): BufferGeometry {
  const pts: number[] = []
  // Outer ring
  const segs = 48
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2
    pts.push(Math.cos(a) * r, Math.sin(a) * r, 0)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return geo
}

interface GearConfig {
  outerR: number; innerR: number; teeth: number
  hubR: number; x: number; y: number; z: number
  color: number; opacity: number
  speed: number   // rotation speed rad/frame
}

const GEARS: GearConfig[] = [
  // Huge background gear, top-left
  { outerR: 9,   innerR: 7.5, teeth: 22, hubR: 2.5,
    x: -9,  y: 6,   z: -8,  color: 0x38bdf8, opacity: 0.7,  speed:  0.0004 },
  // Large gear, bottom-right
  { outerR: 6.5, innerR: 5.2, teeth: 16, hubR: 1.8,
    x: 10,  y: -6,  z: -5,  color: 0x818cf8, opacity: 0.75, speed: -0.0006 },
  // Medium gear, top-right
  { outerR: 4.5, innerR: 3.5, teeth: 12, hubR: 1.2,
    x: 10,  y: 6,   z: -2,  color: 0x38bdf8, opacity: 0.80, speed:  0.001  },
  // Small gear, bottom-left
  { outerR: 3.0, innerR: 2.3, teeth: 8,  hubR: 0.8,
    x: -9,  y: -5,  z: -1,  color: 0xa78bfa, opacity: 0.85, speed: -0.0015 },
  // Tiny accent gear, centre-left
  { outerR: 1.8, innerR: 1.3, teeth: 6,  hubR: 0.5,
    x: -4,  y: 1.5, z:  1,  color: 0x67e8f9, opacity: 0.90, speed:  0.002  },
]

type GearGroup = Group & { _speed: number }
const gearGroups: GearGroup[] = []

export function createGears(scene: Object3D): void {
  for (const g of GEARS) {
    const group = new Group() as GearGroup
    group._speed = g.speed
    group.position.set(g.x, g.y, g.z)

    // Outer toothed ring
    const teethGeo = gearOutlineGeo(g.outerR, g.innerR, g.teeth)
    const teethMat = new LineBasicMaterial({ color: g.color, opacity: g.opacity, transparent: true })
    group.add(new LineLoop(teethGeo, teethMat))

    // Hub ring
    const hubG   = hubGeo(g.hubR, 6)
    const hubMat = new LineBasicMaterial({ color: g.color, opacity: g.opacity * 0.6, transparent: true })
    group.add(new LineLoop(hubG, hubMat))

    // Spokes — 4 lines from hub to inner radius
    for (let s = 0; s < 4; s++) {
      const ang    = (s / 4) * Math.PI * 2
      const spokeP = new Float32Array([
        Math.cos(ang) * g.hubR,         Math.sin(ang) * g.hubR,         0,
        Math.cos(ang) * (g.innerR - 0.3), Math.sin(ang) * (g.innerR - 0.3), 0,
      ])
      const spokeGeo = new BufferGeometry()
      spokeGeo.setAttribute('position', new Float32BufferAttribute(spokeP, 3))
      const spokeMat = new LineBasicMaterial({ color: g.color, opacity: g.opacity * 0.5, transparent: true })
      group.add(new LineLoop(spokeGeo, spokeMat))
    }

    // Glowing centre dot
    const dotGeo = new BufferGeometry()
    dotGeo.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
    const dotMat = new PointsMaterial({
      color: g.color, size: g.hubR * 0.6,
      blending: AdditiveBlending, transparent: true, opacity: 0.9, depthWrite: false,
    })
    group.add(new Points(dotGeo, dotMat))

    gearGroups.push(group)
    scene.add(group)
  }
}

export function updateGears(_time: number): void {
  for (const g of gearGroups) {
    g.rotation.z += g._speed
  }
}

export function disposeGears(): void {
  for (const g of gearGroups) {
    g.removeFromParent()
    g.traverse((child) => {
      if ((child as any).geometry) (child as any).geometry.dispose()
      if ((child as any).material) (child as any).material.dispose()
    })
  }
  gearGroups.length = 0
}
