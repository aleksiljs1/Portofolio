import { LineSegments } from 'three/src/objects/LineSegments.js'
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js'
import { BufferGeometry } from 'three/src/core/BufferGeometry.js'
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js'
import type { Object3D } from 'three'

// Module-level refs for dispose
let lines: LineSegments | null = null
let geometry: BufferGeometry | null = null
let material: LineBasicMaterial | null = null

export function createEdges(
  scene: Object3D,
  positions: { x: number; y: number; z: number }[],
  edgeList: [number, number][],
): void {
  // 2 vertices per edge × 3 floats each
  const vertices = new Float32Array(edgeList.length * 2 * 3)

  let offset = 0
  for (const [a, b] of edgeList) {
    const pa = positions[a]
    const pb = positions[b]
    vertices[offset++] = pa.x
    vertices[offset++] = pa.y
    vertices[offset++] = pa.z
    vertices[offset++] = pb.x
    vertices[offset++] = pb.y
    vertices[offset++] = pb.z
  }

  geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))

  material = new LineBasicMaterial({ color: 0x1e3a5f })

  lines = new LineSegments(geometry, material)
  scene.add(lines)
}

export function disposeEdges(): void {
  if (!lines) return
  lines.removeFromParent()
  geometry?.dispose()
  material?.dispose()
  lines = null
  geometry = null
  material = null
}
