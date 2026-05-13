import { WebGLRenderer, Scene, PerspectiveCamera, FogExp2, Group } from 'three'
import { generateEdges, computeLayout } from './layout'
import { createNodes, pulseNode, updateNodes, disposeNodes } from './nodes'
import { createEdges, disposeEdges } from './edges'
import { createParticles, updateParticles, disposeParticles } from './particles'
import { initBloom, renderWithBloom, disposeBloom } from './postfx'

// ---------------------------------------------------------------------------
// Module-level state — all accessible by destroyScene
// ---------------------------------------------------------------------------

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let sceneGroup: Group | null = null

let rafId: number = 0
let pulseIntervalId: ReturnType<typeof setInterval> | null = null
let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null

let isDestroyed = false
let bloomEnabled = false
let isReducedMotion = false

// Scroll state
let scrollY = 0

// Mouse: rawMouse is set by event, smoothMouse lerps toward it
let rawMouse = { x: 0, y: 0 }
let smoothMouse = { x: 0, y: 0 }

// Node count for pulse (set during init)
let nodeCount = 0

// (no per-frame clock needed — animate uses performance.now() directly)

// ---------------------------------------------------------------------------
// Hardware tier detection
// ---------------------------------------------------------------------------

type HardwareTier = 'high' | 'mid' | 'low'

interface TierConfig {
  particles: number
  nodes: number
  bloom: boolean
}

function detectHardwareTier(): HardwareTier {
  const cores = navigator.hardwareConcurrency ?? 2
  const mem = (navigator as any).deviceMemory ?? 2
  const isMobile = window.innerWidth < 768

  if (isMobile || cores <= 2 || mem <= 1) return 'low'
  if (cores <= 4 || mem <= 3) return 'mid'
  return 'high'
}

const TIER_CONFIGS: Record<HardwareTier, TierConfig> = {
  high: { particles: 3000, nodes: 120, bloom: true },
  mid: { particles: 1200, nodes: 80, bloom: false },
  low: { particles: 0, nodes: 0, bloom: false },
}

// ---------------------------------------------------------------------------
// Event handlers (named functions so they can be removed in destroyScene)
// ---------------------------------------------------------------------------

function onScroll(): void {
  scrollY = window.scrollY
}

function onMouseMove(e: MouseEvent): void {
  rawMouse.x = (e.clientX / window.innerWidth) * 2 - 1
  rawMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
}

function onResize(): void {
  if (resizeTimeoutId !== null) clearTimeout(resizeTimeoutId)
  resizeTimeoutId = setTimeout(() => {
    if (!renderer || !camera) return
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }, 150)
}

function onVisibilityChange(): void {
  if (document.hidden) {
    cancelAnimationFrame(rafId)
  } else {
    animate()
  }
}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------

function animate(): void {
  if (isDestroyed) return
  rafId = requestAnimationFrame(animate)

  // Absolute time in seconds — used as the clock for shader uniforms and particle drift
  const t = performance.now() / 1000

  // Lerp smoothMouse toward rawMouse
  smoothMouse.x += (rawMouse.x - smoothMouse.x) * 0.03
  smoothMouse.y += (rawMouse.y - smoothMouse.y) * 0.03

  if (camera) {
    // Mouse parallax — camera drifts ±1.5 units
    camera.position.x = smoothMouse.x * 1.5
    camera.position.y = smoothMouse.y * 1.5
    camera.lookAt(0, 0, 0)
    // Scroll parallax on top of mouse Y
    camera.position.y -= scrollY * 0.001
  }

  if (sceneGroup) {
    sceneGroup.rotation.y += 0.00015
  }

  updateNodes(t)
  updateParticles(t)

  if (renderer && scene && camera) {
    if (bloomEnabled) {
      renderWithBloom()
    } else {
      renderer.render(scene, camera)
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function initScene(canvas: HTMLCanvasElement): void {
  isDestroyed = false

  // 1. Hardware detection
  const tier = detectHardwareTier()
  const config = TIER_CONFIGS[tier]

  // 2. Reduced motion check
  isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 3. Renderer
  renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
    precision: 'lowp',
  })

  const w = window.innerWidth
  const h = window.innerHeight

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setSize(w, h, false)
  renderer.setClearColor(0x000000, 0)

  // 4. Scene + Camera + Fog
  scene = new Scene()
  camera = new PerspectiveCamera(60, w / h, 0.1, 100)
  camera.position.set(0, 0, 18)
  camera.lookAt(0, 0, 0)
  scene.fog = new FogExp2(0x050810, 0.045)

  // Scene group for Y-rotation
  sceneGroup = new Group()
  scene.add(sceneGroup)

  // Low tier: apply static CSS gradient on body and bail out after one frame
  if (tier === 'low') {
    document.body.style.background =
      'linear-gradient(135deg, #050810 0%, #0a1020 50%, #050810 100%)'
    renderer.render(scene, camera)
    return
  }

  // 5. Geometry
  const edgeList = generateEdges(config.nodes)
  const positions = computeLayout(config.nodes, edgeList)

  nodeCount = config.nodes

  createNodes(sceneGroup, positions)
  createEdges(sceneGroup, positions, edgeList)
  createParticles(sceneGroup, config.particles)

  // 6. Bloom (only if config says so)
  bloomEnabled = config.bloom
  if (bloomEnabled) {
    initBloom(renderer, scene, camera)
  }

  // 7. Reduced motion: render one static frame and stop
  if (isReducedMotion) {
    renderer.render(scene, camera)
    return
  }

  // 8. Event listeners
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibilityChange)

  // 9. Node pulse interval — every 2500ms
  pulseIntervalId = setInterval(() => {
    if (nodeCount > 0) {
      const idx = Math.floor(Math.random() * nodeCount)
      pulseNode(idx)
    }
  }, 2500)

  // 10. Start animation loop
  animate()
}

export function destroyScene(): void {
  isDestroyed = true

  // Cancel animation frame
  cancelAnimationFrame(rafId)
  rafId = 0

  // Clear pulse interval
  if (pulseIntervalId !== null) {
    clearInterval(pulseIntervalId)
    pulseIntervalId = null
  }

  // Clear resize debounce
  if (resizeTimeoutId !== null) {
    clearTimeout(resizeTimeoutId)
    resizeTimeoutId = null
  }

  // Dispose all modules
  disposeNodes()
  disposeEdges()
  disposeParticles()
  disposeBloom()

  // Remove event listeners
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  // Dispose renderer — releases WebGL context
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    renderer = null
  }

  // Null out scene references
  scene = null
  camera = null
  sceneGroup = null

  // Reset state
  scrollY = 0
  rawMouse = { x: 0, y: 0 }
  smoothMouse = { x: 0, y: 0 }
  nodeCount = 0
  bloomEnabled = false
}
