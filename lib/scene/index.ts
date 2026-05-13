import { WebGLRenderer, Scene, PerspectiveCamera, FogExp2, Group } from 'three'
import { generateEdges, computeLayout } from './layout'
import { createNodes, pulseNode, updateNodes, disposeNodes } from './nodes'
import { createEdges, disposeEdges } from './edges'
import { createParticles, updateParticles, disposeParticles } from './particles'
import { initBloom, renderWithBloom, disposeBloom } from './postfx'
import { createGears, updateGears, disposeGears } from './gears'
import { createSparks, updateSparks, disposeSparks } from './sparks'
import { createStars, disposeStars } from './stars'

type SceneMode = 'home' | 'default'
let currentMode: SceneMode = 'default'

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
  const cores = navigator.hardwareConcurrency ?? 4   // default assumes mid-range
  const mem = (navigator as any).deviceMemory ?? 4   // deviceMemory absent on Firefox/non-HTTPS → assume 4
  const isMobile = window.innerWidth < 480            // only kill on very small screens

  if (isMobile || (cores <= 2 && mem <= 1)) return 'low'   // needs both to be weak
  if (cores <= 2 || mem <= 2) return 'mid'
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

  if (currentMode === 'home') {
    updateGears(t)
    updateSparks(t)
  } else {
    updateNodes(t)
  }
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

// Pre-validate WebGL context before handing to Three.js.
// gl.getParameter(gl.VERSION) can return null when too many WebGL contexts
// are active (GPU context slots exhausted), which causes Three.js WebGLState
// to crash with "Cannot read properties of null (reading 'indexOf')".
function isWebGLHealthy(): boolean {
  // Use a throwaway canvas — never the real one, which would poison it
  // before Three.js gets a chance to create its own context on it.
  try {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    const gl =
      (probe.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (probe.getContext('webgl') as WebGLRenderingContext | null)
    if (!gl) return false
    const version = gl.getParameter(gl.VERSION)
    if (typeof version !== 'string' || version.length === 0) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function initScene(canvas: HTMLCanvasElement, mode: SceneMode = 'default'): void {
  currentMode = mode
  isDestroyed = false

  // 1. Hardware detection
  const tier = detectHardwareTier()
  const config = TIER_CONFIGS[tier]

  // 2. Reduced motion check
  isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 3. Pre-flight WebGL health check — bail silently if GPU context is unavailable
  if (!isWebGLHealthy()) {
    console.warn('[scene] WebGL unavailable or context limit reached — skipping 3D background')
    return
  }

  // 4. Renderer (wrapped — belt-and-suspenders against driver edge cases)
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      precision: 'mediump', // lowp causes precision issues on some drivers
    })
  } catch (e) {
    console.warn('[scene] WebGLRenderer construction failed:', e)
    return
  }

  try {
    const w = window.innerWidth
    const h = window.innerHeight

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    renderer.setClearColor(0x000000, 0)

    // 5. Scene + Camera + Fog
    scene = new Scene()
    camera = new PerspectiveCamera(60, w / h, 0.1, 100)
    const camZ = mode === 'home' ? 12 : 14
    camera.position.set(0, 0, camZ)
    camera.lookAt(0, 0, 0)
    const fogDensity = mode === 'home' ? 0.012 : 0.018
    scene.fog = new FogExp2(0x050810, fogDensity)

    sceneGroup = new Group()
    scene.add(sceneGroup)

    // Low tier: static gradient, one frame, done
    if (tier === 'low') {
      document.body.style.background =
        'linear-gradient(135deg, #050810 0%, #0a1020 50%, #050810 100%)'
      renderer.render(scene, camera)
      return
    }

    // 6. Geometry — home gets gears+sparks, other pages get neural lattice
    if (mode === 'home') {
      createStars(sceneGroup)
      createGears(sceneGroup)
      createSparks(sceneGroup)
      createParticles(sceneGroup, Math.floor(config.particles * 0.4))
    } else {
      const edgeList = generateEdges(config.nodes)
      const positions = computeLayout(config.nodes, edgeList)
      nodeCount = config.nodes
      createNodes(sceneGroup, positions)
      createEdges(sceneGroup, positions, edgeList)
      createParticles(sceneGroup, config.particles)
    }

    // 7. Bloom — always on for home (gears glow), config-gated for other pages
    bloomEnabled = mode === 'home' ? true : config.bloom
    if (bloomEnabled) {
      try {
        initBloom(renderer, scene, camera)
      } catch (e) {
        console.warn('[scene] Bloom init failed, continuing without it:', e)
        bloomEnabled = false
      }
    }

    // 8. Reduced motion: one static frame
    if (isReducedMotion) {
      renderer.render(scene, camera)
      return
    }

    // 9. Event listeners
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)

    // 10. Node pulse interval
    pulseIntervalId = setInterval(() => {
      if (nodeCount > 0) {
        const idx = Math.floor(Math.random() * nodeCount)
        pulseNode(idx)
      }
    }, 2500)

    // 11. Start animation loop
    animate()
  } catch (e) {
    console.warn('[scene] Scene initialisation failed:', e)
    destroyScene()
  }
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
  disposeGears()
  disposeSparks()
  disposeStars()
  disposeBloom()

  // Remove event listeners
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  // Dispose renderer — DO NOT call forceContextLoss():
  // React 18 StrictMode fires the useEffect cleanup then immediately
  // re-mounts. forceContextLoss() permanently kills the canvas context,
  // so the second mount's WebGLRenderer gets a dead canvas.
  // renderer.dispose() is sufficient — it frees GPU memory without
  // nuking the context slot.
  if (renderer) {
    renderer.dispose()
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
