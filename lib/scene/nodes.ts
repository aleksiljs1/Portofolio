import { IcosahedronGeometry, InstancedMesh, ShaderMaterial, Color, Vector2, Matrix4, BufferAttribute, AdditiveBlending } from 'three'
import type { Object3D } from 'three'
import gsap from 'gsap'

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

  geometry = new IcosahedronGeometry(0.18, 1)   // 3× larger — actually visible

  material = new ShaderMaterial({
    uniforms: {
      uTime:       { value: 0 },
      uMouse:      { value: new Vector2(0, 0) },
      uBaseColor:  { value: new Color(0x38bdf8) },
      uPulseColor: { value: new Color(0xa78bfa) },  // violet-400 for pulse pop
    },
    blending: AdditiveBlending,   // nodes add light — always bright on dark bg
    depthWrite: false,
    transparent: true,
    vertexShader: `
      attribute float aPulse;
      varying float vPulse;
      varying vec3 vNormal;

      void main() {
        vPulse  = aPulse;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position * (1.0 + aPulse * 1.2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uPulseColor;
      varying float vPulse;
      varying vec3 vNormal;

      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        vec3 color    = mix(uBaseColor, uPulseColor, vPulse);
        // Strong core + rim glow — additive blending makes this bright
        float core  = 0.5 - length(vNormal.xy) * 0.3;
        float alpha = clamp(core + fresnel * 0.9 + vPulse * 0.4, 0.0, 1.0);
        color += vec3(fresnel * 0.5 + vPulse * 0.3);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  aPulseArray = new Float32Array(nodeCount)
  bufAttr     = new BufferAttribute(aPulseArray, 1)
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
    duration: 0.35,
    ease: 'power2.out',
    onUpdate: () => { if (bufAttr) bufAttr.needsUpdate = true },
    onComplete: () => {
      if (!aPulseArray || !bufAttr) return
      gsap.to(aPulseArray, {
        [index]: 0.0,
        duration: 0.6,
        ease: 'power2.in',
        onUpdate: () => { if (bufAttr) bufAttr.needsUpdate = true },
      })
    },
  })
}

export function updateNodes(time: number): void {
  if (material) material.uniforms.uTime.value = time
}

export function disposeNodes(): void {
  if (!mesh) return
  mesh.removeFromParent()
  geometry?.dispose()
  material?.dispose()
  mesh = null; geometry = null; material = null
  aPulseArray = null; bufAttr = null
}
