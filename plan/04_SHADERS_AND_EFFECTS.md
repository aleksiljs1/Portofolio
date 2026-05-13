# Shaders & Effects Brief

Read this if you are implementing the ShaderMaterial for nodes, the bloom effect, or mouse reactivity.

## Why Custom Shaders

Built-in Three.js materials (`MeshStandardMaterial`, `MeshPhongMaterial`) cannot produce emissive-looking nodes that bloom correctly without a light setup. For a background scene:
- No lights needed (fewer draw calls)
- Full control over color + glow via uniforms
- Bloom targets emissive output — we need to write color directly in `gl_FragColor`
- A `ShaderMaterial` for this scene is ~30 lines of GLSL, not a weeks-long project

## Node ShaderMaterial

```ts
import { ShaderMaterial, Color, Vector2 } from 'three/src/...'

export const nodeMaterial = new ShaderMaterial({
  uniforms: {
    uTime:     { value: 0 },
    uMouse:    { value: new Vector2(0, 0) },
    uBaseColor: { value: new Color(0x38bdf8) },
    uPulseColor: { value: new Color(0x818cf8) },
  },
  vertexShader: `
    attribute float aPulse;     // per-instance, 0.0–1.0
    varying float vPulse;
    varying vec3 vNormal;

    void main() {
      vPulse = aPulse;
      vNormal = normalize(normalMatrix * normal);

      // Scale node up during pulse
      vec3 pos = position * (1.0 + aPulse * 0.8);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uPulseColor;
    varying float vPulse;
    varying vec3 vNormal;

    void main() {
      // Fresnel rim — edges glow brighter
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

      // Mix base and pulse color
      vec3 color = mix(uBaseColor, uPulseColor, vPulse);

      // Brighten edges (fresnel)
      color += vec3(fresnel * 0.4);

      // Alpha: slightly transparent core, bright rim
      float alpha = 0.7 + fresnel * 0.3 + vPulse * 0.3;

      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
})
```

## Per-Instance Pulse Attribute

The `aPulse` attribute is a `Float32Array` of length `nodeCount`, one value per instance:

```ts
const pulseAttr = new Float32Array(nodeCount).fill(0)
const bufAttr = new BufferAttribute(pulseAttr, 1)
nodeGeometry.setAttribute('aPulse', bufAttr)

// When GSAP tweens a node's pulse:
gsap.to(pulseAttr, {
  [nodeIndex]: 1.0,
  duration: 0.4,
  ease: 'power2.out',
  onUpdate: () => { bufAttr.needsUpdate = true },
  onComplete: () => {
    gsap.to(pulseAttr, {
      [nodeIndex]: 0.0,
      duration: 0.4,
      ease: 'power2.in',
      onUpdate: () => { bufAttr.needsUpdate = true },
    })
  }
})
```

`bufAttr.needsUpdate = true` tells Three.js to re-upload the attribute to the GPU.

## uTime Uniform Update

In the render loop:

```ts
const clock = new Clock()

function updateScene() {
  const elapsed = clock.getElapsedTime()
  nodeMaterial.uniforms.uTime.value = elapsed
  particleMaterial.uniforms.uTime.value = elapsed
}
```

## Bloom (Desktop Only)

Use the `postprocessing` package (not Three.js examples EffectComposer):

```bash
npm install postprocessing
```

```ts
import { EffectComposer, RenderPass, EffectPass, BloomEffect, BlendFunction } from 'postprocessing'

let composer: EffectComposer | null = null

function initBloom(renderer, scene, camera) {
  const bloom = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    luminanceThreshold: 0.15,   // only bright emissive nodes bloom
    luminanceSmoothing: 0.9,
    intensity: 1.4,
    radius: 0.7,
  })

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new EffectPass(camera, bloom))
}

// In render loop, use composer.render() instead of renderer.render():
if (composer && bloomEnabled) {
  composer.render()
} else {
  renderer.render(scene, camera)
}
```

Gate on hardware tier (see `03_PERFORMANCE.md`): only enable on `'high'` tier.

## Mouse Uniform

Pass mouse position directly to the shader as a uniform. No raycasting needed — this is ambient reactivity, not picking:

```ts
// In lib/scene/index.ts
let smoothMouse = { x: 0, y: 0 }
let rawMouse = { x: 0, y: 0 }

window.addEventListener('mousemove', (e) => {
  rawMouse.x = (e.clientX / window.innerWidth) * 2 - 1
  rawMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
})

// In render loop — GSAP-style lerp without GSAP:
function lerpMouse() {
  smoothMouse.x += (rawMouse.x - smoothMouse.x) * 0.03
  smoothMouse.y += (rawMouse.y - smoothMouse.y) * 0.03
  nodeMaterial.uniforms.uMouse.value.set(smoothMouse.x, smoothMouse.y)
  camera.position.x = smoothMouse.x * 1.5
  camera.position.y = smoothMouse.y * 1.5
  camera.lookAt(0, 0, 0)
}
```

The 0.03 lerp factor = buttery smooth 33-frame lag. Makes it feel like the scene has inertia.

## Background Particle Shader

Simple, cheap, animated drift:

```ts
export const particleMaterial = new ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    void main() {
      // Slow sinusoidal drift unique per particle (use position as seed)
      vec3 pos = position;
      pos.x += sin(uTime * 0.3 + position.z * 10.0) * 0.05;
      pos.y += cos(uTime * 0.2 + position.x * 10.0) * 0.05;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 1.5;
    }
  `,
  fragmentShader: `
    void main() {
      // Circular particle (discard corners)
      vec2 uv = gl_PointCoord - 0.5;
      if (length(uv) > 0.5) discard;
      gl_FragColor = vec4(0.22, 0.74, 0.98, 0.18);  // #38bdf8 at 18% opacity
    }
  `,
  transparent: true,
  depthWrite: false,  // particles don't occlude — critical for correct blending
})
```

## What NOT to Do

- Do NOT use `RawShaderMaterial` — you lose Three.js built-in matrix uniforms and have to define them manually
- Do NOT add `DepthOfField` or `SSAO` — extreme cost, invisible benefit for a flat background
- Do NOT use `MeshPhongMaterial` with point lights — more draw calls than a ShaderMaterial, worse output
- Do NOT call `composer.render()` and `renderer.render()` in the same frame — pick one
- Do NOT set `logarithmicDepthBuffer: true` on the renderer — incompatible with some postprocessing passes
