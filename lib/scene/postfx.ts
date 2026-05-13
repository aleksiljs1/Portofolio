import type { WebGLRenderer, Scene, Camera } from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  BlendFunction,
} from 'postprocessing'

// Module-level composer ref
let composer: EffectComposer | null = null

export function initBloom(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
): void {
  const bloom = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    luminanceThreshold: 0.15,
    luminanceSmoothing: 0.9,
    intensity: 1.4,
    radius: 0.7,
  })

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new EffectPass(camera, bloom))
}

export function renderWithBloom(): void {
  composer?.render()
}

export function disposeBloom(): void {
  composer?.dispose()
  composer = null
}
