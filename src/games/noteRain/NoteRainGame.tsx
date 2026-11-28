import * as THREE from 'three';
import { bothClassNames, bothNames } from '../../domain/notes';
import { cue } from '../../guide/feedback';
import { keysAccepting } from '../../guide/targets';
import type { Target } from '../../guide/types';
import { GameFrame } from '../GameFrame';
import { starHeadline } from '../scoring';
import { PianoScene, type SceneCallbacks } from '../three/PianoScene';
import type { StageEnv } from '../three/Stage';
import { STAFF_ASPECT, staffCard, textCard } from '../three/textures';
import { fitCamera } from '../three/util';
import { levelOf, useSceneGame } from '../useSceneGame';
import type { GamePlayProps } from '../types';
import { HELP_FROM, MAX_LIVES, RAIN_LEVELS, RainRound, rainTargets, type Gem, type RainLevel } from './logic';

interface Hud {
  score: number;
  combo: number;
  lives: number;
  played: number;
  total: number;
  message: string;
}

const SPAWN_Y = 9.5;
const LAND_Y = 2.5;
const LAND_Z = 0.8;
const LANES = [-5.2, -2.6, 0, 2.6, 5.2];
const AMBER = '#ffb347';

interface View {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  w: number;
  h: number;
  x: number;
  shake: number;
}

interface Dying {
  view: View;
  age: number;
  kind: 'hit' | 'lost';
}

/** Gems with a note on them fall toward the keyboard; play the lowest one's key before it lands. */
class NoteRainScene extends PianoScene<Hud> {
  private round: RainRound;
  private views = new Map<number, View>();
  private dying: Dying[] = [];
  private textures = new Map<string, THREE.Texture>();
  private ready = false;
  private clock = 0;
  private endAt: number | null = null;
  private glowFor: number | null = null;
  private lastLane = -1;
  private message = ' ';
  private disposed = false;

  constructor(env: StageEnv, private level: RainLevel, cb: SceneCallbacks<Hud>) {
    super(env, cb, { from: level.keyboard[0], to: level.keyboard[1], names: level.names, z: 0 });

    // The line the gems must not cross.
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.04, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff5d5d, transparent: true, opacity: 0.45 }),
    );
    line.position.set(0, LAND_Y - 1.5, LAND_Z);
    env.scene.add(line);

    this.round = new RainRound(rainTargets(level), level);
    void this.prepare();
    this.resize();
    this.push();
  }

  /** Draw the card of every gem of this round up front (the sheet music takes a moment). */
  private async prepare(): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const t of this.round.targets) {
      const key = this.keyFor(t);
      if (this.textures.has(key)) continue;
      if (t.present === 'staff' && t.midi !== undefined) {
        jobs.push(staffCard(t.midi, t.clef).then((tex) => void this.textures.set(key, tex)));
        this.textures.set(key, new THREE.Texture()); // placeholder so the same note is drawn once
      } else {
        this.textures.set(key, textCard(t.label ?? '?', AMBER));
      }
    }
    await Promise.all(jobs);
    if (!this.disposed) this.ready = true;
  }

  private keyFor = (t: Target) => (t.present === 'staff' ? `staff:${t.clef}:${t.midi}` : `name:${t.label}`);

  resize(): void {
    fitCamera(this.env.camera, {
      center: new THREE.Vector3(0, 3.6, 0),
      width: Math.max(14, this.piano.width + 3),
      pitchDeg: 20,
    });
  }

  private push(): void {
    this.cb.hud({
      score: this.round.score,
      combo: this.round.combo,
      lives: this.round.lives,
      played: this.round.quick + this.round.slow,
      total: this.round.total,
      message: this.message,
    });
  }

  private say(text: string): void {
    this.message = text;
    this.push();
  }

  private acceptedKeys = (t: Target) => keysAccepting(t, this.level.keyboard[0], this.level.keyboard[1]);

  private spawn(gem: Gem): void {
    let lane = Math.floor(Math.random() * LANES.length);
    if (lane === this.lastLane) lane = (lane + 2) % LANES.length;
    this.lastLane = lane;
    const tex = this.textures.get(this.keyFor(gem.target))!;
    const material = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    const staff = gem.target.present === 'staff';
    const h = staff ? 2.7 : 2.3;
    const w = staff ? h * STAFF_ASPECT : 2.3;
    sprite.scale.set(w, h, 1);
    sprite.position.set(LANES[lane], SPAWN_Y, -2);
    this.env.scene.add(sprite);
    this.views.set(gem.id, { sprite, material, w, h, x: LANES[lane], shake: 0 });
  }

  private retire(gem: Gem, kind: 'hit' | 'lost'): void {
    const view = this.views.get(gem.id);
    if (!view) return;
    this.views.delete(gem.id);
    this.dying.push({ view, age: 0, kind });
    if (kind === 'lost') view.material.color.set(0xff6b6b);
  }

  /** A key was played: `screen` means it was clicked in the 3D keyboard (so we make the sound). */
  press(midi: number, _timeMs: number, screen = false): void {
    if (!this.ready || this.ended) return;
    this.touchKey(midi, screen);
    const res = this.round.press(midi, this.clock);
    if (res.kind === 'hit') {
      const view = this.views.get(res.gem.id);
      const at = view ? view.sprite.position.clone() : this.piano.above(midi, 2);
      this.fx.burst(at, 0x3ddc84);
      this.fx.float(`+${res.points}`, at, '#3ddc84');
      this.piano.flash(midi, 0x3ddc84);
      cue('ok');
      this.retire(res.gem, 'hit');
      this.say(res.quick ? ' ' : 'Quick hits score more.');
    } else if (res.kind === 'wrong') {
      this.piano.flash(midi, 0xff5d5d);
      const view = this.views.get(res.gem.id);
      if (view) view.shake = 0.4;
      cue('wrong');
      this.say(`That was ${bothClassNames(midi % 12)}. Look at the gem again.`);
    }
  }

  update(dt: number): void {
    this.piano.update(dt);
    this.fx.update(dt);
    if (!this.ready) return;
    if (!this.ended) this.clock += dt;

    const { spawned, lost } = this.round.tick(this.clock);
    for (const g of spawned) this.spawn(g);
    for (const g of lost) {
      const view = this.views.get(g.id);
      const at = view ? view.sprite.position.clone() : new THREE.Vector3(0, LAND_Y, LAND_Z);
      this.fx.burst(at, 0xff5d5d);
      this.fx.float('Missed!', at, '#ff6b6b');
      cue('wrong');
      for (const m of this.acceptedKeys(g.target)) this.piano.flash(m, 0xffb020);
      this.retire(g, 'lost');
      this.say(`That one was ${g.target.chip ?? bothNames(g.target.ref ?? 60)}. It lights up when it is close.`);
    }

    const current = this.round.current();
    for (const [id, view] of this.views) {
      const gem = this.round.gems[id];
      const p = this.round.progress(gem, this.clock);
      const isCurrent = current?.id === id;
      view.shake = Math.max(0, view.shake - dt);
      const wobble = view.shake > 0 ? Math.sin(view.shake * 60) * 0.25 : 0;
      view.sprite.position.set(
        view.x + wobble,
        THREE.MathUtils.lerp(SPAWN_Y, LAND_Y, p),
        THREE.MathUtils.lerp(-2, LAND_Z, p),
      );
      const pulse = isCurrent ? 1 + 0.05 * Math.sin(this.clock * 8) : 0.85;
      view.sprite.scale.set(view.w * pulse, view.h * pulse, 1);
      view.material.color.setScalar(isCurrent ? 1 : 0.55);
      view.material.opacity = Math.min(1, p / 0.06);
    }

    for (const d of this.dying) {
      d.age += dt;
      const t = d.age / 0.35;
      if (d.kind === 'hit') {
        d.view.sprite.scale.set(d.view.w * (1 + t), d.view.h * (1 + t), 1);
        d.view.material.opacity = Math.max(0, 1 - t);
      } else {
        d.view.sprite.position.y -= dt * 5;
        d.view.material.opacity = Math.max(0, 1 - t);
      }
    }
    this.dying = this.dying.filter((d) => {
      if (d.age < 0.35) return true;
      this.env.scene.remove(d.view.sprite);
      d.view.material.dispose();
      return false;
    });

    // Near the keys, the right key starts to glow: still counts, but is worth less.
    const near = current && this.round.progress(current, this.clock) >= HELP_FROM ? current : undefined;
    if (near?.id !== this.glowFor) {
      this.piano.clearGlow();
      this.glowFor = near?.id ?? null;
      if (near) for (const m of this.acceptedKeys(near.target)) this.piano.setGlow(m, 0xffb020, true);
    }

    if (this.round.finished && this.endAt === null) {
      this.endAt = this.clock + 1.2;
      this.push();
    }
    if (this.endAt !== null && this.clock >= this.endAt && !this.ended) this.end();
    if (spawned.length || lost.length) this.push();
  }

  private end(): void {
    const r = this.round;
    const played = r.quick + r.slow;
    const out = r.lives <= 0;
    const headline = out
      ? 'Out of lives. Slow down and try again.'
      : starHeadline(r.stars, ['Keep practising.', 'Getting there.', 'Nice work!', 'Superb reading!']);
    this.finishRound({
      score: r.score,
      stars: r.stars,
      headline,
      details: [
        `${played} of ${r.total} played before they landed (${r.quick} quickly)`,
        `Longest streak: ${r.bestCombo}`,
        `Wrong keys: ${r.wrong}`,
      ],
    }, !out && r.stars > 0);
  }

  override dispose(): void {
    this.disposed = true;
    super.dispose();
    this.textures.forEach((t) => t.dispose());
  }
}

export default function NoteRainGame({ level, onFinish }: GamePlayProps) {
  const rainLevel = levelOf(RAIN_LEVELS, level.id);
  const { hud, stage } = useSceneGame<Hud, NoteRainScene>(
    { score: 0, combo: 0, lives: MAX_LIVES, played: 0, total: rainLevel.count, message: ' ' },
    (env, cb) => new NoteRainScene(env, rainLevel, cb),
    onFinish,
  );

  return (
    <GameFrame
      score={hud.score}
      chips={
        <>
          <span aria-label={`${hud.lives} lives left`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(MAX_LIVES - hud.lives)}</span>
          {hud.combo >= 2 && <span className="chip-hot">{hud.combo} in a row</span>}
          <span>{hud.played}/{hud.total}</span>
        </>
      }
      caption={hud.message}
    >
      {stage}
    </GameFrame>
  );
}
