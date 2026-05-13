import { Vector3 } from 'three/src/math/Vector3.js'

/** Place nodeCount points randomly inside a sphere of given radius. */
function randomInSphere(count: number, radius: number): Vector3[] {
  const pts: Vector3[] = []
  for (let i = 0; i < count; i++) {
    // Rejection-sample for uniform distribution
    let x: number, y: number, z: number
    do {
      x = (Math.random() * 2 - 1) * radius
      y = (Math.random() * 2 - 1) * radius
      z = (Math.random() * 2 - 1) * radius
    } while (x * x + y * y + z * z > radius * radius)
    pts.push(new Vector3(x, y, z))
  }
  return pts
}

/**
 * generateEdges — for each node connect to its 2–3 nearest neighbours.
 * Positions are placed first in a temporary sphere so distances are meaningful.
 * Returns ~180 unique [a, b] pairs.
 */
export function generateEdges(nodeCount: number): [number, number][] {
  const positions = randomInSphere(nodeCount, 8)
  const edgeSet = new Set<string>()
  const edges: [number, number][] = []

  for (let i = 0; i < nodeCount; i++) {
    // Compute distances from i to every other node
    const distances: { j: number; d: number }[] = []
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue
      distances.push({ j, d: positions[i].distanceTo(positions[j]) })
    }
    distances.sort((a, b) => a.d - b.d)

    // Pick 2 or 3 nearest neighbours
    const k = Math.random() < 0.5 ? 2 : 3
    for (let n = 0; n < k && n < distances.length; n++) {
      const j = distances[n].j
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push([Math.min(i, j), Math.max(i, j)])
      }
    }
  }

  return edges
}

/**
 * computeLayout — force-relaxed positions.
 * Place nodeCount nodes randomly in sphere radius 8, run 40 spring iterations,
 * return frozen {x, y, z}[] positions.
 */
export function computeLayout(
  nodeCount: number,
  edgeList: [number, number][],
): { x: number; y: number; z: number }[] {
  const SPRING_K = 0.05
  const REPULSION = 0.8
  const ITERATIONS = 40

  const positions = randomInSphere(nodeCount, 8)
  const velocities = Array.from({ length: nodeCount }, () => new Vector3())

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces = Array.from({ length: nodeCount }, () => new Vector3())

    // Spring attraction along edges
    for (const [a, b] of edgeList) {
      const pa = positions[a]
      const pb = positions[b]
      const diff = new Vector3().subVectors(pb, pa)
      const dist = Math.max(diff.length(), 0.001)
      // F = k * displacement (towards each other)
      const f = diff.multiplyScalar(SPRING_K)
      forces[a].add(f)
      forces[b].sub(f)
    }

    // Pairwise repulsion
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const diff = new Vector3().subVectors(positions[i], positions[j])
        const dist2 = Math.max(diff.lengthSq(), 0.0001)
        const dist = Math.sqrt(dist2)
        // F = repulsion / dist² in direction away from j
        const magnitude = REPULSION / dist2
        const f = diff.multiplyScalar(magnitude / dist) // normalise then scale
        forces[i].add(f)
        forces[j].sub(f)
      }
    }

    // Integrate
    for (let i = 0; i < nodeCount; i++) {
      velocities[i].add(forces[i])
      velocities[i].multiplyScalar(0.85) // damping
      positions[i].add(velocities[i])
    }
  }

  return positions.map(p => ({ x: p.x, y: p.y, z: p.z }))
}
