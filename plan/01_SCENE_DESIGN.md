# Scene Design Brief

Read this if you are implementing the Three.js scene's visual composition, colors, and animation.

## What the Scene Is

A **3D Neural Lattice** — a floating graph of ~120 spherical nodes connected by ~180 thin edges, resembling a neural network or microservices topology. NOT a uniform grid. NOT random particle soup. Think: a force-directed graph frozen mid-settle, seen in perspective through fog.

This directly mirrors the developer's CV: AI pipelines, distributed microservices, BullMQ job graphs, Redis pub/sub networks. The scene IS the developer's work made visible.

## Color Palette

| Element | Color | Hex |
|---|---|---|
| Background | Near-black, blue undertone | `#050810` |
| Scene fog | Same as background | `#050810` |
| Nodes (default) | Sky blue | `#38bdf8` |
| Nodes (pulsing active) | Indigo | `#818cf8` |
| Edges | Very dark blue, nearly invisible | `#1e3a5f` |
| Background particles | Sky blue, 20% opacity | `#38bdf8` at alpha 0.2 |

## Scene Geometry

### Nodes (~120 total)
- `IcosahedronGeometry(0.06, 1)` — tiny sphere-like shapes, 80 triangles each
- Rendered as a single `InstancedMesh` (one draw call for all 120)
- ShaderMaterial with emissive-style output (so bloom picks them up)
- 4–5 nodes are "active" at any time, glowing brighter at `#818cf8`

### Edges (~180 total)
- A single `LineSegments` object with one `BufferGeometry`
- Each edge connects two node positions
- Color `#1e3a5f` — subtle, barely there, creates a sense of structure
- Edge positions updated only when a node pulses (not every frame)

### Background Particles (~3000 on desktop, ~800 on mobile)
- `THREE.Points` + `BufferGeometry`
- Random positions in a sphere of radius 20
- Very small (`size: 0.015`), very low opacity (0.2)
- Slowly drift (offset positions by `sin(uTime + index) * 0.001`)
- These create depth behind the lattice

## Node Layout (Initial Positions)

Use a force-relaxed layout computed once at init, then baked/frozen:

```ts
// Rough algorithm: place nodes in a sphere, run 30 spring iterations
// Spring: attract connected nodes, repel all nodes
// Result: organic cluster that looks like a real graph
function computeLayout(nodeCount: number, edgeList: [number, number][]): Vector3[] {
  // Place randomly in sphere radius 8
  // Run 30 iterations of spring simulation
  // Return frozen positions
}
```

Precompute this at `init()` time. The scene is static topology, dynamic animation.

## Animation Layers (3 simultaneous, independent)

### Layer 1: Scene Rotation
- Rotate the entire scene group on Y-axis
- Speed: `0.00015` radians per frame
- Imperceptible on a single frame, creates "alive" feeling over time
- `sceneGroup.rotation.y += 0.00015` in the render loop

### Layer 2: Mouse Parallax
- On `mousemove`, lerp camera position toward cursor influence
- Camera moves ±1.5 units in X and Y
- Lerp factor: `0.03` (very smooth, lags behind cursor intentionally)
- Normalized mouse: `(clientX / width * 2 - 1, -(clientY / height) * 2 + 1)`
- Camera always looks at scene origin (update `lookAt` after position change)

### Layer 3: Node Pulse
- Every 2500ms: pick a random node index
- Tween its `aPulse` attribute from `0 → 1 → 0` over 800ms using GSAP
- In the fragment shader: mix node color with `#818cf8` by `aPulse` value
- Scale the node slightly larger during pulse (vertex shader reads `aPulse` too)

## Readability (How Text Stays Legible)

- Canvas CSS: `opacity: 0.55` — single lever, tune at final QA
- `FogExp2(0x050810, 0.045)` on the scene — distant nodes fade into background
- No bloom on text or UI elements (canvas is background only)
- No bright full-screen effects — just dark scene with blue accent nodes

## Camera Setup

```ts
camera = new PerspectiveCamera(60, width / height, 0.1, 100)
camera.position.set(0, 0, 18)
camera.lookAt(0, 0, 0)
scene.fog = new FogExp2(0x050810, 0.045)
```

## What NOT to Do

- No post-processing on mobile or low-power devices
- No GLTF files, no texture loading — zero network requests for the scene
- No OrbitControls — this is a background, not interactive 3D
- No bright white particles — they blow out behind light text
- Do not animate edges per-frame unless a node is pulsing
