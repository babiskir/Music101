import * as THREE from 'three';

/**
 * Put the camera in front of and above `center`, far enough back that `width` world units fit across the
 * screen whatever its shape. Called again whenever the stage is resized.
 */
export function fitCamera(
  camera: THREE.PerspectiveCamera,
  o: { center: THREE.Vector3; width: number; pitchDeg: number; minDistance?: number },
): void {
  const halfV = THREE.MathUtils.degToRad(camera.fov) / 2;
  const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
  const dist = Math.max(o.width / 2 / Math.tan(halfH), o.minDistance ?? 0);
  const pitch = THREE.MathUtils.degToRad(o.pitchDeg);
  camera.position.set(o.center.x, o.center.y + Math.sin(pitch) * dist, o.center.z + Math.cos(pitch) * dist);
  camera.lookAt(o.center);
  camera.updateProjectionMatrix();
}

/** Free the GPU memory of everything below `root`. */
export function disposeTree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of mats) {
      (m as THREE.MeshBasicMaterial).map?.dispose();
      m.dispose();
    }
  });
}

/** Wait for the browser to paint, so the stage can be measured after a layout change. */
export const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Lights and a floor grid: the same dim "stage" for every game. */
export function addStage(scene: THREE.Scene, floorY = -1.2): void {
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 12, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6aa8ff, 0.7);
  rim.position.set(-6, 5, -8);
  scene.add(rim);
  const grid = new THREE.GridHelper(80, 80, 0x2a3446, 0x182030);
  grid.position.y = floorY;
  scene.add(grid);
  scene.fog = new THREE.Fog(0x0e1014, 30, 70);
}
