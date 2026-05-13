import { LineSegments, LineBasicMaterial, BufferGeometry, Float32BufferAttribute } from 'three'
import type { Object3D } from 'three'

let lines: LineSegments | null = null
let geometry: BufferGeometry | null = null
let material: LineBasicMaterial | null = null

export function createEdges(
  scene: Object3D,
  positions: { x: number; y: number; z: number }[],
  edgeList: [number, number][],
): void {
  const vertices = new Float32Array(edgeList.length * 2 * 3)
  let offset = 0
  for (const [a, b] of edgeList) {
    const pa = positions[a], pb = positions[b]
    vertices[offset++] = pa.x; vertices[offset++] = pa.y; vertices[offset++] = pa.z
    vertices[offset++] = pb.x; vertices[offset++] = pb.y; vertices[offset++] = pb.z
  }

  geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))

  // Bright cyan-blue — clearly visible against the dark background
  material = new LineBasicMaterial({ color: 0x0ea5e9, opacity: 0.45, transparent: true })

  lines = new LineSegments(geometry, material)
  scene.add(lines)
}

export function disposeEdges(): void {
  if (!lines) return
  lines.removeFromParent()
  geometry?.dispose()
  material?.dispose()
  lines = null; geometry = null; material = null
}
