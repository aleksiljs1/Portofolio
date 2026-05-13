import { WebGLRenderer, Scene, PerspectiveCamera, FogExp2, Group } from 'three'
import { createParticles, updateParticles, disposeParticles } from './particles'
import { initBloom, renderWithBloom, disposeBloom } from './postfx'
import { createGears, updateGears, disposeGears, transitionGears } from './gears'
import { createSparks, updateSparks, disposeSparks } from './sparks'

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let renderer:   WebGLRenderer   | null = null
let scene:      Scene           | null = null
let camera:     PerspectiveCamera | null = null
let sceneGroup: Group           | null = null

let rafId:           number                         = 0
let resizeTimeoutId: ReturnType<typeof setTimeout>  | null = null

let isDestroyed   = false
let bloomEnabled  = false

let scrollY    = 0
let rawMouse   = { x: 0, y: 0 }
let smoothMouse = { x: 0, y: 0 }

// ---------------------------------------------------------------------------
// Hardware tier
// ---------------------------------------------------------------------------

type HardwareTier = 'high' | 'mid' | 'low'
interface TierConfig { particles: number; bloom: boolean }

function detectHardwareTier(): HardwareTier {
  const cores    = navigator.hardwareConcurrency ?? 4
  const mem      = (navigator as any).deviceMemory ?? 4
  const isMobile = window.innerWidth < 480
  if (isMobile || (cores <= 2 && mem <= 1)) return 'low'
  if (cores <= 2 || mem <= 2) return 'mid'
  return 'high'
}

const TIER_CONFIGS: Record<HardwareTier, TierConfig> = {
  high: { particles: 1200, bloom: true  },
  mid:  { particles:  600, bloom: false },
  low:  { particles:    0, bloom: false },
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function onScroll() { scrollY = window.scrollY }

function onMouseMove(e: MouseEvent) {
  rawMouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
  rawMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
}

function onResize() {
  if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId)
  resizeTimeoutId = setTimeout(() => {
    if (!renderer || !camera) return
    const w = window.innerWidth, h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }, 150)
}

function onVisibilityChange() {
  if (document.hidden) cancelAnimationFrame(rafId)
  else animate()
}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------

function animate() {
  if (isDestroyed) return
  rafId = requestAnimationFrame(animate)

  const t = performance.now() / 1000

  smoothMouse.x += (rawMouse.x - smoothMouse.x) * 0.03
  smoothMouse.y += (rawMouse.y - smoothMouse.y) * 0.03

  if (camera) {
    camera.position.x = smoothMouse.x * 1.5
    camera.position.y = smoothMouse.y * 1.5 - scrollY * 0.001
    camera.lookAt(0, 0, 0)
  }

  if (sceneGroup) sceneGroup.rotation.y += 0.0006

  updateGears(t)
  updateSparks(t)
  updateParticles(t)

  if (renderer && scene && camera) {
    bloomEnabled ? renderWithBloom() : renderer.render(scene, camera)
  }
}

// ---------------------------------------------------------------------------
// WebGL health probe (throwaway canvas — never poisons the real one)
// ---------------------------------------------------------------------------

function isWebGLHealthy(): boolean {
  try {
    const probe = document.createElement('canvas')
    probe.width = 1; probe.height = 1
    const gl =
      (probe.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (probe.getContext('webgl')  as WebGLRenderingContext  | null)
    if (!gl) return false
    const version = gl.getParameter(gl.VERSION)
    if (typeof version !== 'string' || version.length === 0) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch { return false }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initScene(canvas: HTMLCanvasElement, pathname = '/'): void {
  isDestroyed = false

  const tier   = detectHardwareTier()
  const config = TIER_CONFIGS[tier]
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isWebGLHealthy()) {
    console.warn('[scene] WebGL unavailable — skipping 3D background')
    return
  }

  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true,
      powerPreference: 'low-power', precision: 'mediump' })
  } catch (e) {
    console.warn('[scene] WebGLRenderer failed:', e)
    return
  }

  try {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    renderer.setClearColor(0x000000, 0)

    scene      = new Scene()
    camera     = new PerspectiveCamera(60, w / h, 0.1, 100)
    camera.position.set(0, 0, 12)
    camera.lookAt(0, 0, 0)
    scene.fog  = new FogExp2(0x050810, 0.012)

    sceneGroup = new Group()
    scene.add(sceneGroup)

    if (tier === 'low') {
      renderer.render(scene, camera)
      return
    }

    // Gears on every page, sparks always
    createGears(sceneGroup, pathname)
    createSparks(sceneGroup)
    if (config.particles > 0) createParticles(sceneGroup, config.particles)

    bloomEnabled = config.bloom
    if (bloomEnabled) {
      try { initBloom(renderer, scene, camera) }
      catch (e) { console.warn('[scene] Bloom failed:', e); bloomEnabled = false }
    }

    if (reduced) { renderer.render(scene, camera); return }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)

    animate()
  } catch (e) {
    console.warn('[scene] Scene init failed:', e)
    destroyScene()
  }
}

// Called on route change — slides old gears out, new ones in
export function transitionScene(newPathname: string): void {
  transitionGears(newPathname)
}

export function destroyScene(): void {
  isDestroyed = true

  cancelAnimationFrame(rafId)
  rafId = 0

  if (resizeTimeoutId !== null) { clearTimeout(resizeTimeoutId); resizeTimeoutId = null }

  disposeGears()
  disposeSparks()
  disposeParticles()
  disposeBloom()

  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  if (renderer) { renderer.dispose(); renderer = null }

  scene      = null
  camera     = null
  sceneGroup = null
  scrollY    = 0
  rawMouse   = { x: 0, y: 0 }
  smoothMouse = { x: 0, y: 0 }
  bloomEnabled = false
}
