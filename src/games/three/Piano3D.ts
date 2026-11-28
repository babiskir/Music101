import * as THREE from 'three';
import { isBlackKey, midiToName, noteName } from '../../domain/notes';
import { keyName } from './textures';

const WHITE = new THREE.Color(0xf1f0ea);
const BLACK = new THREE.Color(0x16181d);
const KEY_DEPTH = 5;
const BLACK_DEPTH = 3.1;
const FLASH_S = 0.4;

interface Key {
  midi: number;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseY: number;
  base: THREE.Color;
  /** Steady glow (a target to play), or null. */
  glow: THREE.Color | null;
  pulse: boolean;
  /** Short flash (right / wrong feedback). */
  flash: THREE.Color | null;
  flashAge: number;
  /** 1 right after a press, falls to 0. */
  down: number;
}

/**
 * A keyboard in 3D, lying along the x axis, centred on x = 0, the player at +z. White key tops are at
 * y = 0 and black key tops at y = 0.5. Keys can glow, flash and dip when pressed, and be picked with the
 * mouse or a finger on the screen.
 */
export class Piano3D {
  readonly group = new THREE.Group();
  /** Number of white keys, and the width in world units (one white key = 1). */
  readonly whiteCount: number;
  readonly width: number;
  private keys = new Map<number, Key>();
  private whiteIndex = new Map<number, number>();
  private raycaster = new THREE.Raycaster();
  private nameTextures: THREE.Texture[] = [];
  private clock = 0;

  /** `from` and `to` (inclusive) should be white keys. */
  constructor(readonly from: number, readonly to: number, showNames: boolean) {
    let w = 0;
    for (let m = from; m <= to; m++) if (!isBlackKey(m)) this.whiteIndex.set(m, w++);
    this.whiteCount = w;
    this.width = w;

    const whiteGeo = new THREE.BoxGeometry(0.94, 0.6, KEY_DEPTH);
    const blackGeo = new THREE.BoxGeometry(0.58, 0.5, BLACK_DEPTH);
    const nameGeo = new THREE.PlaneGeometry(0.46, 0.46);
    const nameTex = new Map<string, THREE.Texture>();
    /** Flat text on top of a white key, `z` towards the player. */
    const print = (midi: number, text: string, z: number) => {
      let tex = nameTex.get(text);
      if (!tex) {
        tex = keyName(text);
        nameTex.set(text, tex);
        this.nameTextures.push(tex);
      }
      const plane = new THREE.Mesh(nameGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(this.xOf(midi), 0.01, z);
      plane.userData.parentKey = midi;
      this.group.add(plane);
    };

    for (let m = from; m <= to; m++) {
      const black = isBlackKey(m);
      const base = black ? BLACK : WHITE;
      const material = new THREE.MeshStandardMaterial({ color: base.clone(), roughness: black ? 0.35 : 0.55 });
      const mesh = new THREE.Mesh(black ? blackGeo : whiteGeo, material);
      const baseY = black ? 0.25 : -0.3;
      mesh.position.set(this.xOf(m), baseY, black ? -KEY_DEPTH / 2 + BLACK_DEPTH / 2 : 0);
      mesh.userData.midi = m;
      this.group.add(mesh);
      this.keys.set(m, { midi: m, mesh, material, baseY, base: base.clone(), glow: null, pulse: false, flash: null, flashAge: 0, down: 0 });

      if (showNames && !black) {
        print(m, noteName(m), KEY_DEPTH / 2 - 0.8);
        print(m, midiToName(m), KEY_DEPTH / 2 - 0.32);
      }
    }

    // The case around the keys.
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x23272f, roughness: 0.8 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 1.4, 0.7), caseMat);
    back.position.set(0, 0.1, -KEY_DEPTH / 2 - 0.35);
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.5, KEY_DEPTH + 0.3), caseMat);
    base.position.set(0, -0.85, 0);
    this.group.add(back, base);
  }

  /** World x of the middle of a key. */
  xOf(midi: number): number {
    const centre = (this.whiteCount - 1) / 2;
    if (isBlackKey(midi)) return this.xOf(midi - 1) + 0.5;
    return (this.whiteIndex.get(midi) ?? 0) - centre;
  }

  /** World position just above the top of a key, near its front edge. */
  above(midi: number, lift = 0.4): THREE.Vector3 {
    return new THREE.Vector3(this.xOf(midi), (isBlackKey(midi) ? 0.5 : 0) + lift, isBlackKey(midi) ? -1.2 : 1.2);
  }

  has(midi: number): boolean {
    return this.keys.has(midi);
  }

  /** Keep a key lit (or stop with null). `pulse` makes it breathe, to catch the eye. */
  setGlow(midi: number, color: number | null, pulse = false): void {
    const k = this.keys.get(midi);
    if (!k) return;
    k.glow = color === null ? null : new THREE.Color(color);
    k.pulse = pulse;
  }

  clearGlow(): void {
    this.keys.forEach((k) => (k.glow = null));
  }

  /** A short coloured flash, e.g. green for right and red for wrong. */
  flash(midi: number, color: number): void {
    const k = this.keys.get(midi);
    if (!k) return;
    k.flash = new THREE.Color(color);
    k.flashAge = 0;
  }

  /** Push the key down for a moment. */
  press(midi: number): void {
    const k = this.keys.get(midi);
    if (k) k.down = 1;
  }

  update(dt: number): void {
    this.clock += dt;
    for (const k of this.keys.values()) {
      k.down = Math.max(0, k.down - dt / 0.22);
      k.mesh.position.y = k.baseY - 0.14 * k.down;
      k.flashAge += dt;

      let tint: THREE.Color | null = null;
      let amount = 0;
      if (k.flash && k.flashAge < FLASH_S) {
        tint = k.flash;
        amount = 1 - k.flashAge / FLASH_S;
      } else if (k.glow) {
        tint = k.glow;
        amount = k.pulse ? 0.55 + 0.35 * Math.sin(this.clock * 7) : 0.9;
      }
      k.material.color.copy(k.base);
      if (tint) k.material.color.lerp(tint, amount);
      k.material.emissive.copy(tint ?? BLACK).multiplyScalar(tint ? 0.35 * amount : 0);
    }
  }

  /** Which key is under a point of the screen, given in normalised device coordinates (-1 to 1). */
  pick(ndc: THREE.Vector2, camera: THREE.Camera): number | null {
    this.raycaster.setFromCamera(ndc, camera);
    const hits = this.raycaster.intersectObjects([...this.keys.values()].map((k) => k.mesh), false);
    return hits.length ? (hits[0].object.userData.midi as number) : null;
  }

  dispose(): void {
    this.nameTextures.forEach((t) => t.dispose());
  }
}
