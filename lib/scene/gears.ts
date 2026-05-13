import {
  BufferGeometry, Float32BufferAttribute, LineLoop, LineBasicMaterial,
  Points, PointsMaterial, AdditiveBlending, Group,
} from 'three'
import type { Object3D } from 'three'
import gsap from 'gsap'

interface GearConfig {
  outerR: number; innerR: number; teeth: number; hubR: number
  x: number; y: number; z: number
  color: number; opacity: number; speed: number
}

// Each route has its own set of gears
const PAGE_CONFIGS: Record<string, GearConfig[]> = {
  '/': [
    { outerR: 9,   innerR: 7.5, teeth: 22, hubR: 2.5,  x: -9,  y:  6, z: -8, color: 0x38bdf8, opacity: 0.75, speed:  0.0004 },
    { outerR: 6.5, innerR: 5.2, teeth: 16, hubR: 1.8,  x: 10,  y: -6, z: -5, color: 0x818cf8, opacity: 0.78, speed: -0.0006 },
    { outerR: 4.5, innerR: 3.5, teeth: 12, hubR: 1.2,  x: 10,  y:  6, z: -2, color: 0x38bdf8, opacity: 0.82, speed:  0.0010 },
    { outerR: 3.0, innerR: 2.3, teeth:  8, hubR: 0.8,  x: -9,  y: -5, z: -1, color: 0xa78bfa, opacity: 0.88, speed: -0.0015 },
    { outerR: 1.8, innerR: 1.3, teeth:  6, hubR: 0.5,  x: -4,  y:  2, z:  1, color: 0x67e8f9, opacity: 0.90, speed:  0.0020 },
  ],
  '/projects': [
    { outerR: 5.5, innerR: 4.3, teeth: 14, hubR: 1.5,  x: -10, y:  5, z: -6, color: 0x38bdf8, opacity: 0.80, speed:  0.0007 },
    { outerR: 3.8, innerR: 2.9, teeth: 10, hubR: 1.0,  x:  9,  y:  3, z: -4, color: 0x818cf8, opacity: 0.75, speed: -0.0010 },
    { outerR: 6.0, innerR: 4.8, teeth: 18, hubR: 1.6,  x:  8,  y: -5, z: -7, color: 0x38bdf8, opacity: 0.72, speed:  0.0005 },
    { outerR: 2.5, innerR: 1.9, teeth:  8, hubR: 0.7,  x: -8,  y: -4, z: -2, color: 0x67e8f9, opacity: 0.85, speed: -0.0018 },
    { outerR: 4.0, innerR: 3.1, teeth: 12, hubR: 1.1,  x:  0,  y:  7, z: -5, color: 0xa78bfa, opacity: 0.70, speed:  0.0008 },
  ],
  '/experience': [
    { outerR: 7.0, innerR: 5.7, teeth: 20, hubR: 2.0,  x: -11, y:  0, z: -8, color: 0x818cf8, opacity: 0.78, speed:  0.0005 },
    { outerR: 4.5, innerR: 3.5, teeth: 12, hubR: 1.2,  x:  10, y:  0, z: -4, color: 0x38bdf8, opacity: 0.82, speed: -0.0009 },
    { outerR: 2.8, innerR: 2.1, teeth:  8, hubR: 0.8,  x: -10, y:  6, z: -3, color: 0xa78bfa, opacity: 0.88, speed:  0.0014 },
    { outerR: 3.2, innerR: 2.4, teeth: 10, hubR: 0.9,  x:  9,  y: -5, z: -2, color: 0x67e8f9, opacity: 0.85, speed: -0.0012 },
    { outerR: 5.5, innerR: 4.4, teeth: 16, hubR: 1.5,  x:  0,  y: -7, z: -6, color: 0x38bdf8, opacity: 0.70, speed:  0.0006 },
  ],
  '/about': [
    { outerR: 8.0, innerR: 6.5, teeth: 24, hubR: 2.2,  x:  9,  y:  5, z: -9, color: 0xa78bfa, opacity: 0.75, speed:  0.0003 },
    { outerR: 5.0, innerR: 4.0, teeth: 14, hubR: 1.4,  x: -9,  y:  4, z: -5, color: 0x38bdf8, opacity: 0.80, speed: -0.0007 },
    { outerR: 3.5, innerR: 2.7, teeth: 10, hubR: 1.0,  x: -8,  y: -5, z: -3, color: 0x818cf8, opacity: 0.85, speed:  0.0012 },
    { outerR: 2.2, innerR: 1.6, teeth:  6, hubR: 0.6,  x:  8,  y: -4, z: -1, color: 0x67e8f9, opacity: 0.90, speed: -0.0018 },
    { outerR: 6.0, innerR: 4.8, teeth: 18, hubR: 1.7,  x:  1,  y:  0, z:-10, color: 0x38bdf8, opacity: 0.60, speed:  0.0004 },
  ],
}

function fallbackConfig(pathname: string): GearConfig[] {
  // For any unlisted route, use home config
  return PAGE_CONFIGS['/']
}

function getConfig(pathname: string): GearConfig[] {
  return PAGE_CONFIGS[pathname] ?? fallbackConfig(pathname)
}

function gearOutlineGeo(outerR: number, innerR: number, teeth: number): BufferGeometry {
  const pts: number[] = []
  const steps = teeth * 4
  for (let i = 0; i <= steps; i++) {
    const ang   = (i / steps) * Math.PI * 2
    const phase = i % 4
    const r     = (phase === 1 || phase === 2) ? outerR : innerR
    pts.push(Math.cos(ang) * r, Math.sin(ang) * r, 0)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return geo
}

function hubCircleGeo(r: number): BufferGeometry {
  const pts: number[] = []
  const segs = 48
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2
    pts.push(Math.cos(a) * r, Math.sin(a) * r, 0)
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return geo
}

type GearGroup = Group & { _speed: number }
let gearGroups: GearGroup[] = []
let parentScene: Object3D | null = null

function buildGearGroup(cfg: GearConfig): GearGroup {
  const group = new Group() as GearGroup
  group._speed = cfg.speed
  group.position.set(cfg.x, cfg.y, cfg.z)

  // Toothed outer ring
  group.add(new LineLoop(
    gearOutlineGeo(cfg.outerR, cfg.innerR, cfg.teeth),
    new LineBasicMaterial({ color: cfg.color, opacity: cfg.opacity, transparent: true }),
  ))

  // Hub ring
  group.add(new LineLoop(
    hubCircleGeo(cfg.hubR),
    new LineBasicMaterial({ color: cfg.color, opacity: cfg.opacity * 0.6, transparent: true }),
  ))

  // 4 spokes
  for (let s = 0; s < 4; s++) {
    const ang = (s / 4) * Math.PI * 2
    const sp  = new Float32Array([
      Math.cos(ang) * cfg.hubR,              Math.sin(ang) * cfg.hubR,              0,
      Math.cos(ang) * (cfg.innerR - 0.3),    Math.sin(ang) * (cfg.innerR - 0.3),    0,
    ])
    const sg = new BufferGeometry()
    sg.setAttribute('position', new Float32BufferAttribute(sp, 3))
    group.add(new LineLoop(sg, new LineBasicMaterial({ color: cfg.color, opacity: cfg.opacity * 0.45, transparent: true })))
  }

  // Glowing centre
  const dg = new BufferGeometry()
  dg.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))
  group.add(new Points(dg, new PointsMaterial({
    color: cfg.color, size: cfg.hubR * 0.65,
    blending: AdditiveBlending, transparent: true, opacity: 0.95, depthWrite: false,
  })))

  return group
}

function disposeGroup(g: GearGroup) {
  g.traverse((child) => {
    if ((child as any).geometry) (child as any).geometry.dispose()
    if ((child as any).material) (child as any).material.dispose()
  })
}

export function createGears(scene: Object3D, pathname = '/'): void {
  parentScene = scene
  for (const cfg of getConfig(pathname)) {
    const g = buildGearGroup(cfg)
    gearGroups.push(g)
    scene.add(g)
  }
}

const PAGE_ORDER = ['/', '/projects', '/experience', '/about']

export function transitionGears(newPathname: string): void {
  if (!parentScene) return

  const oldGroups = [...gearGroups]
  gearGroups = []

  const oldIdx = PAGE_ORDER.indexOf(
    oldGroups[0]
      ? PAGE_ORDER.find((p) => PAGE_CONFIGS[p]?.length === oldGroups.length) ?? '/'
      : '/'
  )
  const newIdx = PAGE_ORDER.indexOf(newPathname)
  const dir    = newIdx >= oldIdx ? -1 : 1   // -1 = slide left, 1 = slide right
  const dist   = 28

  // Slide old gears out
  for (const g of oldGroups) {
    gsap.to(g.position, {
      x: g.position.x + dir * dist,
      duration: 0.55,
      ease: 'power2.in',
      onComplete: () => {
        g.removeFromParent()
        disposeGroup(g)
      },
    })
  }

  // Build new gears starting off-screen in the opposite direction
  for (const cfg of getConfig(newPathname)) {
    const g = buildGearGroup(cfg)
    g.position.x += -dir * dist   // start off-screen
    parentScene!.add(g)
    gearGroups.push(g)

    gsap.to(g.position, {
      x: cfg.x,
      duration: 0.65,
      ease: 'power2.out',
      delay: 0.15,   // slight delay so old ones start leaving first
    })
  }
}

export function updateGears(_time: number): void {
  for (const g of gearGroups) g.rotation.z += g._speed
}

export function disposeGears(): void {
  for (const g of gearGroups) {
    g.removeFromParent()
    disposeGroup(g)
  }
  gearGroups = []
  parentScene = null
}
