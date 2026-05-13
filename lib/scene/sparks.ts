import { Points, BufferGeometry, BufferAttribute, ShaderMaterial, AdditiveBlending } from 'three'
import type { Object3D } from 'three'

const SPARK_COUNT = 500

// Per-spark state (CPU-side)
const pos  = new Float32Array(SPARK_COUNT * 3)
const vel  = new Float32Array(SPARK_COUNT * 3)  // velocity
const life = new Float32Array(SPARK_COUNT)        // 0→1, 1 = just born

// Emitter origins — match gear positions
const EMITTERS = [
  [ -9,  6,  -8 ],   // top-left large gear
  [ 10, -6,  -5 ],   // bottom-right gear
  [ 10,  6,  -2 ],   // top-right gear
  [ -9, -5,  -1 ],   // bottom-left gear
  [ -4,  1.5, 1 ],   // centre-left small gear
]

let geometry: BufferGeometry | null = null
let material: ShaderMaterial | null = null
let points: Points | null = null
let posAttr: BufferAttribute | null = null

function respawn(i: number) {
  const e = EMITTERS[Math.floor(Math.random() * EMITTERS.length)]
  pos[i * 3]     = e[0] + (Math.random() - 0.5) * 2
  pos[i * 3 + 1] = e[1] + (Math.random() - 0.5) * 2
  pos[i * 3 + 2] = e[2] + (Math.random() - 0.5) * 1.5

  const speed = 0.015 + Math.random() * 0.045
  const theta = Math.random() * Math.PI * 2
  const phi   = Math.random() * Math.PI
  vel[i * 3]     = Math.sin(phi) * Math.cos(theta) * speed
  vel[i * 3 + 1] = Math.abs(Math.cos(phi)) * speed * 1.5   // bias upward
  vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

  life[i] = Math.random()  // stagger so they don't all die together
}

export function createSparks(scene: Object3D): void {
  for (let i = 0; i < SPARK_COUNT; i++) respawn(i)

  geometry = new BufferGeometry()
  posAttr  = new BufferAttribute(pos, 3)
  geometry.setAttribute('position', posAttr)
  geometry.setAttribute('aLife', new BufferAttribute(life, 1))

  material = new ShaderMaterial({
    blending:    AdditiveBlending,
    depthWrite:  false,
    transparent: true,
    uniforms: {},
    vertexShader: /* glsl */ `
      attribute float aLife;
      varying  float vLife;
      void main() {
        vLife = aLife;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        // Closer sparks = bigger point
        gl_PointSize = clamp(120.0 / -mvPos.z, 1.0, 4.0) * vLife;
        gl_Position  = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5) discard;
        // Orange core → white hot centre, fades with life
        vec3 hot   = vec3(1.0, 0.9, 0.7);
        vec3 ember = vec3(1.0, 0.45, 0.05);
        vec3 color = mix(ember, hot, pow(1.0 - r * 2.0, 2.0));
        float alpha = (0.5 - r) * 2.0 * vLife * 1.4;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `,
  })

  points = new Points(geometry, material)
  scene.add(points)
}

const GRAVITY = -0.00008

export function updateSparks(_time: number): void {
  if (!posAttr || !geometry) return

  const lifeAttr = geometry.getAttribute('aLife') as BufferAttribute

  for (let i = 0; i < SPARK_COUNT; i++) {
    life[i] -= 0.004 + Math.random() * 0.003   // random decay rate
    vel[i * 3 + 1] += GRAVITY                   // gravity

    pos[i * 3]     += vel[i * 3]
    pos[i * 3 + 1] += vel[i * 3 + 1]
    pos[i * 3 + 2] += vel[i * 3 + 2]

    if (life[i] <= 0) respawn(i)
  }

  posAttr.needsUpdate = true
  lifeAttr.needsUpdate = true
}

export function disposeSparks(): void {
  if (points) { points.removeFromParent(); points = null }
  geometry?.dispose()
  material?.dispose()
  geometry = null; material = null; posAttr = null
}
