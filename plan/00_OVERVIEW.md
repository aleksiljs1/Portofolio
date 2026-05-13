# Portfolio 3D Background — Master Plan

## What We're Building

A full-page live 3D background for Aleksandros Iljas's portfolio website. Built with raw Three.js (no React Three Fiber), integrated into Next.js 14 App Router. The scene is a **Neural Lattice** — a 3D graph of ~120 nodes connected by ~180 edges, visually mirroring the developer's actual work (AI pipelines, microservices, distributed systems). It sits behind all page content at `z-index: -10`, never re-mounts on navigation, and reacts to mouse movement and scroll.

## Four Agent Inputs, Synthesized

| Agent | Recommendation |
|---|---|
| Scene Design | Neural lattice, `#050810` bg, `#38bdf8`/`#818cf8` nodes, mouse parallax, node pulse |
| Performance | Raw Three.js, selective imports (~80KB), pixelRatio ≤1.5, `powerPreference: low-power`, tab pause |
| Next.js Integration | `dynamic(ssr:false)` in layout, `-z-10 pointer-events-none`, logic in `lib/scene.ts` |
| Shaders & Effects | Custom `ShaderMaterial`, bloom via `postprocessing` pkg, mouse as GLSL uniform + GSAP lerp |

## Conflict Resolutions

- **R3F vs raw Three.js**: Use raw Three.js. R3F is for interactive 3D apps, not a fixed background scene. Reduces bundle by ~40KB and eliminates React reconciler overhead.
- **Bloom vs no postprocessing**: Include bloom but gate it behind `isLowPower` check. On weak hardware, bloom is skipped entirely. On desktop it's on by default.
- **InstancedMesh vs Points**: Use InstancedMesh for the ~120 lattice nodes (icosahedron) and a separate Points layer for ~3000 ambient background particles. Best of both recommendations.

## File Structure (to be created)

```
portfolio/
├── app/
│   ├── layout.tsx              ← dynamic import of SceneBackground, ssr:false
│   └── page.tsx
├── components/
│   └── SceneBackground.tsx     ← thin React shell, just a <canvas> + useEffect
├── lib/
│   └── scene/
│       ├── index.ts            ← init(), destroy(), setScroll(), setMouse()
│       ├── nodes.ts            ← InstancedMesh lattice nodes + ShaderMaterial
│       ├── edges.ts            ← LineSegments connecting nodes
│       ├── particles.ts        ← background Points cloud
│       ├── postfx.ts           ← optional Bloom via postprocessing pkg
│       └── layout.ts           ← force-relaxed node position computation
└── plan/                       ← you are here
    ├── 00_OVERVIEW.md
    ├── 01_SCENE_DESIGN.md
    ├── 02_NEXTJS_ARCHITECTURE.md
    ├── 03_PERFORMANCE.md
    └── 04_SHADERS_AND_EFFECTS.md
```

## Section Plans (read these when implementing each part)

- `01_SCENE_DESIGN.md` — colors, scene composition, animation layers, fog
- `02_NEXTJS_ARCHITECTURE.md` — where code lives, SSR fix, scroll/mouse sharing, z-index
- `03_PERFORMANCE.md` — renderer settings, hardware detection, cleanup, tree-shaking
- `04_SHADERS_AND_EFFECTS.md` — ShaderMaterial code, bloom config, mouse uniform, GLSL snippets

## Dependencies to Install

```bash
npm install three postprocessing gsap
npm install -D @types/three
```

No React Three Fiber. No drei. No @react-three/postprocessing. Keep it minimal.

## Quality Bar

The background should make a visitor say "wow" within 3 seconds. It should NEVER drop below 30fps on a mid-range 2020 laptop. It should NEVER cause a hydration error. Text on top must always be readable.
