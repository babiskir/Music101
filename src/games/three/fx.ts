import * as THREE from 'three';
import { textLabel } from './textures';

interface Burst {
  points: THREE.Points;
  velocities: Float32Array;
  age: number;
  life: number;
}

interface Floater {
  sprite: THREE.Sprite;
  age: number;
  life: number;
  startY: number;
}

/** Sparks and floating words: the little rewards that tell the player what just happened. */
export class Effects {
  private bursts: Burst[] = [];
  private floaters: Floater[] = [];
  private labels = new Map<string, THREE.CanvasTexture>();

  constructor(private scene: THREE.Scene) {}

  burst(at: THREE.Vector3, color: number, count = 22): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions.set([at.x, at.y, at.z], i * 3);
      const a = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      velocities.set([Math.cos(a) * speed, 1.5 + Math.random() * 3, Math.sin(a) * speed * 0.5], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size: 0.22, transparent: true, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    this.scene.add(points);
    this.bursts.push({ points, velocities, age: 0, life: 0.9 });
  }

  /** A word that drifts up and fades: "Perfect!", "+120". */
  float(text: string, at: THREE.Vector3, color = '#ffffff', scale = 1): void {
    const key = `${text}|${color}`;
    let tex = this.labels.get(key);
    if (!tex) {
      tex = textLabel(text, color);
      this.labels.set(key, tex);
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(3.2 * scale, 0.8 * scale, 1);
    sprite.position.copy(at);
    sprite.renderOrder = 10;
    this.scene.add(sprite);
    this.floaters.push({ sprite, age: 0, life: 1.1, startY: at.y });
  }

  update(dt: number): void {
    for (const b of this.bursts) {
      b.age += dt;
      const pos = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        b.velocities[i * 3 + 1] -= 9 * dt; // gravity
        pos.setXYZ(
          i,
          pos.getX(i) + b.velocities[i * 3] * dt,
          pos.getY(i) + b.velocities[i * 3 + 1] * dt,
          pos.getZ(i) + b.velocities[i * 3 + 2] * dt,
        );
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - b.age / b.life);
    }
    this.bursts = this.bursts.filter((b) => {
      if (b.age < b.life) return true;
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
      return false;
    });

    for (const f of this.floaters) {
      f.age += dt;
      const t = f.age / f.life;
      f.sprite.position.y = f.startY + t * 1.6;
      (f.sprite.material as THREE.SpriteMaterial).opacity = t < 0.6 ? 1 : Math.max(0, 1 - (t - 0.6) / 0.4);
    }
    this.floaters = this.floaters.filter((f) => {
      if (f.age < f.life) return true;
      this.scene.remove(f.sprite);
      f.sprite.material.dispose();
      return false;
    });
  }

  dispose(): void {
    for (const b of this.bursts) {
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    }
    for (const f of this.floaters) {
      this.scene.remove(f.sprite);
      f.sprite.material.dispose();
    }
    this.labels.forEach((t) => t.dispose());
    this.bursts = [];
    this.floaters = [];
    this.labels.clear();
  }
}
