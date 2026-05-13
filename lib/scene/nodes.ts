import { IcosahedronGeometry, InstancedMesh, ShaderMaterial, Color, Vector2, Matrix4, BufferAttribute } from 'three'
import type { Object3D } from 'three'
import gsap from 'gsap'

// Module-level refs for update / dispose
let mesh: InstancedMesh | null = null
let geometry: IcosahedronGeometry | null = null
let material: ShaderMaterial | null = null
let aPulseArray: Float32Array | null = null
let bufAttr: BufferAttribute | null = null

export function createNodes(
  scene: Object3D,
  positions: { x: number; y: number; z: number }[],
): void {
  const nodeCount = positions.length

  geometry = new IcosahedronGeometry(0.06, 1)

  material = new ShaderMaterial({
    uniforms: {
      uTime:       { value: 0 },
      uMouse:      { value: new Vector2(0, 0) },
      uBaseColor:  { value: new Color(0x38bdf8) },
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

  // Per-instance aPulse attribute
  aPulseArray = new Float32Array(nodeCount)
  bufAttr = new BufferAttribute(aPulseArray, 1)
  geometry.setAttribute('aPulse', bufAttr)

  mesh = new InstancedMesh(geometry, material, nodeCount)

  const mat4 = new Matrix4()
  for (let i = 0; i < nodeCount; i++) {
    const { x, y, z } = positions[i]
    mat4.setPosition(x, y, z)
    mesh.setMatrixAt(i, mat4)
  }
  mesh.instanceMatrix.needsUpdate = true

  scene.add(mesh)
}

export function pulseNode(index: number): void {
  if (!aPulseArray || !bufAttr) return

  gsap.to(aPulseArray, {
    [index]: 1.0,
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: () => {
      if (bufAttr) bufAttr.needsUpdate = true
    },
    onComplete: () => {
      if (!aPulseArray || !bufAttr) return
      gsap.to(aPulseArray, {
        [index]: 0.0,
        duration: 0.4,
        ease: 'power2.in',
        onUpdate: () => {
          if (bufAttr) bufAttr.needsUpdate = true
        },
      })
    },
  })
}

export function updateNodes(time: number): void {
  if (!material) return
  material.uniforms.uTime.value = time
}

export function disposeNodes(): void {
  if (!mesh) return
  mesh.removeFromParent()
  geometry?.dispose()
  material?.dispose()
  mesh = null
  geometry = null
  material = null
  aPulseArray = null
  bufAttr = null
}
