import { Points, BufferGeometry, BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import type { Object3D } from 'three'

let geometry: BufferGeometry | null = null
let material: ShaderMaterial | null = null
let points: Points | null = null

const vertexShader = /* glsl */ `
  uniform float uTime;
  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 0.25 + position.z * 8.0) * 0.08;
    pos.y += cos(uTime * 0.18 + position.x * 8.0) * 0.08;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    // Scale point size by distance — closer = bigger
    float dist   = length((modelViewMatrix * vec4(pos, 1.0)).xyz);
    gl_PointSize = clamp(280.0 / dist, 1.0, 3.5);
  }
`

const fragmentShader = /* glsl */ `
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r  = length(uv);
    if (r > 0.5) discard;
    // Soft glow falloff
    float alpha = (0.5 - r) * 2.0 * 0.5;
    gl_FragColor = vec4(0.22, 0.74, 0.98, alpha);   // #38bdf8
  }
`

export function createParticles(scene: Object3D, count: number): void {
  geometry = new BufferGeometry()
  const positions = new Float32Array(count * 3)
  const tmp = new Vector3()

  for (let i = 0; i < count; i++) {
    tmp.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
    tmp.normalize().multiplyScalar(4 + Math.random() * 18)   // spread from r=4 to r=22
    positions[i * 3]     = tmp.x
    positions[i * 3 + 1] = tmp.y
    positions[i * 3 + 2] = tmp.z
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))

  material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  points = new Points(geometry, material)
  scene.add(points)
}

export function updateParticles(time: number): void {
  if (material) material.uniforms['uTime'].value = time
}

export function disposeParticles(): void {
  if (points) { points.parent?.remove(points); points = null }
  geometry?.dispose(); geometry = null
  material?.dispose(); material = null
}
