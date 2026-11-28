import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { disposeTree } from './util';

/** What a game scene is given to build itself in. */
export interface StageEnv {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
}

/** What the stage needs back from a scene. */
export interface SceneHandle {
  /** Called every frame. `dt` in seconds (capped), `nowMs` is performance.now(). */
  update(dt: number, nowMs: number): void;
  /** The stage changed shape: refit the camera. */
  resize(): void;
  dispose(): void;
}

interface Props {
  /** Builds the scene once, when the stage appears. */
  create: (env: StageEnv) => SceneHandle;
  /** Gives the caller the scene so it can send it key presses. Called with null when the stage goes away. */
  onReady?: (handle: SceneHandle | null) => void;
}

/** Convert a pointer event on the canvas to normalised device coordinates (-1..1). */
export function pointerNdc(e: PointerEvent, canvas: HTMLCanvasElement): THREE.Vector2 {
  const r = canvas.getBoundingClientRect();
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
}

/**
 * A three.js canvas that fills its box. It owns the renderer and the animation loop and cleans up after
 * itself; what is drawn is up to the scene passed in `create`.
 */
export function Stage({ create, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const createRef = useRef(create);
  createRef.current = create;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setProblem('This browser could not start 3D graphics (WebGL). Try Edge or Chrome, and make sure hardware acceleration is on.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1014);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    const handle = createRef.current({ scene, camera, canvas: renderer.domElement });
    readyRef.current?.(handle);

    const resize = () => {
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      handle.resize();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      handle.update(dt, now);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      readyRef.current?.(null);
      handle.dispose();
      disposeTree(scene);
      renderer.dispose();
      renderer.forceContextLoss(); // the browser only allows a few 3D canvases at once
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="stage" ref={host}>
      {problem && <p className="hint-box error stage-problem">{problem}</p>}
    </div>
  );
}
