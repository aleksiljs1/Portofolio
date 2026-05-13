# Performance Brief

Read this if you are implementing the Three.js renderer setup, hardware detection, or animation loop.

## Target

- 60fps on desktop (2020+ mid-range, integrated graphics)
- 30fps acceptable on older mobile
- 0fps (disabled) on very weak devices or `prefers-reduced-motion`
- Bundle contribution: under 100KB (Three.js selective imports)

## Renderer Setup

```ts
const renderer = new WebGLRenderer({
  canvas,
  antialias: false,          // antialias kills perf, invisible on backgrounds
  alpha: true,               // transparent canvas — bg color comes from CSS body
  powerPreference: 'low-power', // tells GPU driver this is not a game
  precision: 'lowp',         // mediump is default and wasteful for a background
})

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))  // never 2
renderer.setSize(window.innerWidth, window.innerHeight, false)   // false = don't set CSS size (Tailwind handles that)
renderer.setClearColor(0x000000, 0)  // transparent — CSS body bg shows through
```

## Hardware Detection

Run once at `initScene()`. Adjust counts and features accordingly:

```ts
function detectHardwareTier(): 'high' | 'mid' | 'low' {
  const cores = navigator.hardwareConcurrency ?? 2
  const mem = (navigator as any).deviceMemory ?? 2  // GB, not in all browsers
  const isMobile = window.innerWidth < 768

  if (isMobile || cores <= 2 || mem <= 1) return 'low'
  if (cores <= 4 || mem <= 3) return 'mid'
  return 'high'
}

const tier = detectHardwareTier()

const config = {
  high: { particles: 3000, nodes: 120, edges: 180, bloom: true },
  mid:  { particles: 1200, nodes:  80, edges: 120, bloom: false },
  low:  { particles:    0, nodes:   0, edges:   0, bloom: false },
}[tier]

// On 'low': render one static frame, then stop
if (tier === 'low') {
  renderer.render(scene, camera)
  return
}
```

## Animation Loop

Use raw `requestAnimationFrame`, not R3F's `useFrame`:

```ts
let rafId: number
let isDestroyed = false

function animate() {
  if (isDestroyed) return
  rafId = requestAnimationFrame(animate)
  updateScene()          // mouse lerp, pulse tweens, scroll
  renderer.render(scene, camera)
}

animate()
```

**Tab visibility pause** — single biggest win, free performance when tab hidden:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId)
  } else {
    animate()  // restart loop
  }
})
```

## Cleanup (Critical — Prevents Memory Leaks)

The `destroyScene()` export must do ALL of this:

```ts
export function destroyScene() {
  isDestroyed = true
  cancelAnimationFrame(rafId)

  // Dispose geometry and materials
  nodeGeometry.dispose()
  nodeMaterial.dispose()
  edgeGeometry.dispose()
  edgeMaterial.dispose()
  particleGeometry.dispose()
  particleMaterial.dispose()

  // Dispose renderer — releases WebGL context
  renderer.dispose()
  renderer.forceContextLoss()  // essential on mobile, prevents context leak

  // Remove event listeners
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibilityChange)
}
```

The `SceneBackground` React component calls `destroyScene()` in its `useEffect` cleanup. This runs on hot-reload in dev and on component unmount.

## Tree-shaking (Bundle Size)

**NEVER do this:**
```ts
import * as THREE from 'three'  // imports entire 600KB library
```

**Do this instead:**
```ts
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js'
import { Scene } from 'three/src/scenes/Scene.js'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js'
import { InstancedMesh } from 'three/src/objects/InstancedMesh.js'
import { IcosahedronGeometry } from 'three/src/geometries/IcosahedronGeometry.js'
import { LineSegments } from 'three/src/objects/LineSegments.js'
import { BufferGeometry } from 'three/src/core/BufferGeometry.js'
import { Points } from 'three/src/objects/Points.js'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js'
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js'
import { PointsMaterial } from 'three/src/materials/PointsMaterial.js'
import { FogExp2 } from 'three/src/scenes/FogExp2.js'
import { Vector3, Color, Matrix4 } from 'three/src/math/...'
```

Expected bundle contribution: ~70–90KB gzipped for this scene.

**Do NOT import:**
- `OrbitControls` (+15KB) — not needed
- `GLTFLoader` (+50KB) — no models
- `EffectComposer` from Three.js examples (+30KB) — use `postprocessing` pkg instead
- `TextGeometry` + font JSON (+200KB+) — no 3D text
- `Stats` — only in dev if needed

## Pixel Ratio Policy

```ts
// Set at init, never change dynamically
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

// Why 1.5 not 2.0?
// At pixelRatio=2 (Retina), you render 4x the pixels of a 1080p screen.
// For a background scene, the visual difference vs 1.5 is invisible.
// The performance difference is ~25%.
```

## Mobile Policy

| Condition | Action |
|---|---|
| `window.innerWidth < 480` | Skip scene entirely, static CSS gradient fallback |
| `prefers-reduced-motion: reduce` | Render one static frame, no animation loop |
| `window.innerWidth < 768` | Reduce particles to 800, skip bloom, pixelRatio = 1 |
| Hardware tier = 'low' | One static frame, no loop |

The CSS body background `#050810` ensures the page looks intentional even with no WebGL.
