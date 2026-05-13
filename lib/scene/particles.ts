import { Points, BufferGeometry, BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import type { Object3D } from 'three'
// Module-level refs for dispose
let geometry: BufferGeometry | null = null
let material: ShaderMaterial | null = null
let points: Points | null = null

const vertexShader = /* glsl */ `
  uniform float uTime;
  void main() {
    // Slow sinusoidal drift unique per particle (use position as seed)
    vec3 pos = position;
    pos.x += sin(uTime * 0.3 + position.z * 10.0) * 0.05;
    pos.y += cos(uTime * 0.2 + position.x * 10.0) * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 1.5;
  }
`

const fragmentShader = /* glsl */ `
  void main() {
    // Circular particle (discard corners)
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    gl_FragColor = vec4(0.22, 0.74, 0.98, 0.18);  // #38bdf8 at 18% opacity
  }
`

export function createParticles(scene: Object3D, count: number): void {
  geometry = new BufferGeometry()

  const positions = new Float32Array(count * 3)
  const tmp = new Vector3()

  for (let i = 0; i < count; i++) {
    // Random point in sphere of radius 20
    tmp.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    )
    // Normalize then scale to radius 20 (also randomise depth in sphere)
    tmp.normalize().multiplyScalar(Math.random() * 20)

    positions[i * 3]     = tmp.x
    positions[i * 3 + 1] = tmp.y
    positions[i * 3 + 2] = tmp.z
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))

  material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  points = new Points(geometry, material)
  scene.add(points)
}

export function updateParticles(time: number): void {
  if (material) {
    material.uniforms['uTime'].value = time
  }
}

export function disposeParticles(): void {
  if (points) {
    points.parent?.remove(points)
    points = null
  }
  geometry?.dispose()
  geometry = null
  material?.dispose()
  material = null
}
