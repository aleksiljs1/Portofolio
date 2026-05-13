# Next.js Architecture Brief

Read this if you are wiring the Three.js background into the Next.js 14 App Router project.

## Core Constraint

Three.js accesses `window`, `document`, and `WebGLRenderingContext` — none of which exist on the server. The component and ALL its imports must never execute during SSR.

## Component Hierarchy

```
app/layout.tsx (Server Component)
  └─ <html><body>
       ├─ SceneBackground      ← dynamic import, ssr: false, mounted ONCE for entire app
       └─ <main z-10>{children}
```

### `app/layout.tsx`

```tsx
import dynamic from 'next/dynamic'

const SceneBackground = dynamic(
  () => import('@/components/SceneBackground'),
  { ssr: false }
)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050810]">
        <SceneBackground />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
```

**Why `dynamic` with `ssr: false` here, not inside the component?**
The component JS is never evaluated on the server. A `useEffect` guard inside the component still ships Three.js code to the server bundle — it just doesn't run it. `dynamic` at the import site is the correct pattern.

## SceneBackground Component

```tsx
// components/SceneBackground.tsx
'use client'

import { useEffect, useRef } from 'react'
import { initScene, destroyScene } from '@/lib/scene'

export default function SceneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    initScene(canvasRef.current)
    return () => destroyScene()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
```

The component does NOTHING except hand the DOM node to the scene module and clean up. Zero Three.js imports in this file.

## Scene Module (`lib/scene/index.ts`)

All Three.js logic lives here, isolated from React. Exported API:

```ts
export function initScene(canvas: HTMLCanvasElement): void
export function destroyScene(): void
// called internally from scene module, not from React:
// window.addEventListener('scroll', ...) — handled inside init
// window.addEventListener('mousemove', ...) — handled inside init
```

**Why a standalone module, not a React hook?**
Three.js state is imperative and long-lived. A module avoids re-render churn. The `SceneBackground` component re-renders zero times after mount — `useEffect` with `[]` runs once. A hook would be fine too but offers no benefit here and adds indirection.

## CSS Z-Index Strategy

| Layer | Class | z-index |
|---|---|---|
| Canvas | `-z-10` (Tailwind = `-10`) | -10 |
| Body background | CSS `background-color: #050810` | — |
| Page content wrapper | `relative z-10` | 10 |
| Navbar | `relative z-20` | 20 |
| Modals/dialogs | `z-50` | 50 |

The body background color `#050810` matches the scene background — if WebGL fails or loads slowly, the page looks correct anyway.

## Scroll Integration (No Prop Drilling)

Scroll position is consumed directly in the scene module. No React context, no Zustand, no props:

```ts
// lib/scene/index.ts
let scrollY = 0

function initScrollListener() {
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY
  }, { passive: true })
}
```

Use `scrollY` in the render loop:
```ts
// Subtle vertical camera drift on scroll
camera.position.y = -scrollY * 0.001
```

## Mouse Integration

Same approach — native listener in the scene module:

```ts
let mouse = { x: 0, y: 0 }
let targetMouse = { x: 0, y: 0 }

window.addEventListener('mousemove', (e) => {
  targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1
  targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

// In render loop, lerp toward target:
mouse.x += (targetMouse.x - mouse.x) * 0.03
mouse.y += (targetMouse.y - mouse.y) * 0.03
camera.position.x = mouse.x * 1.5
camera.position.y = mouse.y * 1.5
camera.lookAt(0, 0, 0)
```

## Resize Handling

```ts
function initResizeListener() {
  let timeout: ReturnType<typeof setTimeout>
  window.addEventListener('resize', () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }, 150)  // debounce — not every pixel of resize
  })
}
```

## Reduced Motion Support

Respect `prefers-reduced-motion`:

```ts
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReduced) {
  // Don't start the animation loop
  // Render one static frame only
  renderer.render(scene, camera)
  return
}
```
