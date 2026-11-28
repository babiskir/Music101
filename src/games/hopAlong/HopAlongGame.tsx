import * as THREE from 'three';
import { cue } from '../../guide/feedback';
import { GameFrame } from '../GameFrame';
import { starHeadline } from '../scoring';
import { PianoScene, type SceneCallbacks } from '../three/PianoScene';
import type { StageEnv } from '../three/Stage';
import { fitCamera } from '../three/util';
import { levelOf, useSceneGame } from '../useSceneGame';
import type { GamePlayProps } from '../types';
import { HOP_LEVELS, HopRound, POND_RANGE, moveHelp, moveText, type HopLevel, type Move } from './logic';

interface Hud {
  score: number;
  combo: number;
  move: Move;
  hop: number;
  total: number;
  message: string;
}

const HOP_S = 0.42;
const FROG_Z = 1.3;
const FROG_Y = 0.4;
const HINT_AFTER_S = 8;
const GREEN = 0x5ac85a;

function buildFrog(): THREE.Group {
  const frog = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: GREEN, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), skin);
  body.scale.set(1, 0.75, 1.1);
  frog.add(body);
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const black = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), white);
    eye.position.set(side * 0.24, 0.36, -0.22);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), black);
    pupil.position.set(side * 0.24, 0.38, -0.36);
    frog.add(eye, pupil);
  }
  return frog;
}

/** A frog sits on a key and is told how far to hop: a step, a skip, a leap. Play the key it should land on. */
class HopAlongScene extends PianoScene<Hud> {
  private round: HopRound;
  private frog = buildFrog();
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private hopT = 1; // 1 = sitting still
  private wobble = 0;
  private clock = 0;
  private promptAt = 0;
  private glowKey = '';
  private endAt: number | null = null;
  private message = ' ';

  constructor(env: StageEnv, private level: HopLevel, cb: SceneCallbacks<Hud>) {
    super(env, cb, { from: POND_RANGE[0], to: POND_RANGE[1], names: level.names });
    this.round = new HopRound(level);
    this.perch(this.round.frog);
    this.frog.position.copy(this.to);
    env.scene.add(this.frog);

    this.resize();
    this.push();
  }

  /** Where the frog sits on a key. */
  private perch(midi: number): void {
    this.to.set(this.piano.xOf(midi), FROG_Y, FROG_Z);
  }

  resize(): void {
    fitCamera(this.env.camera, { center: new THREE.Vector3(0, 1.4, 0.4), width: this.piano.width + 3, pitchDeg: 38 });
  }

  private push(): void {
    this.cb.hud({
      score: this.round.score,
      combo: this.round.combo,
      move: this.round.move,
      hop: Math.min(this.round.hop + 1, this.round.total),
      total: this.round.total,
      message: this.message,
    });
  }

  press(midi: number, _timeMs: number, screen = false): void {
    if (this.ended) return;
    this.touchKey(midi, screen);
    const res = this.round.press(midi);
    if (res.kind === 'wrong') {
      this.piano.flash(midi, 0xff5d5d);
      this.wobble = 0.5;
      cue('wrong');
      this.message = res.reason;
    } else {
      this.piano.flash(midi, 0x3ddc84);
      this.from.copy(this.frog.position);
      this.perch(midi);
      this.hopT = 0;
      this.promptAt = this.clock;
      this.glowKey = '';
      cue('ok');
      this.fx.burst(new THREE.Vector3(this.to.x, 0.6, this.to.z), 0x3ddc84, 16);
      this.fx.float(`+${res.points}`, new THREE.Vector3(this.to.x, 1.8, this.to.z), '#3ddc84');
      this.message = res.clean ? ' ' : 'Good. Look at the order before you hop next time.';
      if (this.round.finished) this.endAt = this.clock + 1.3;
    }
    this.push();
  }

  update(dt: number): void {
    this.piano.update(dt);
    this.fx.update(dt);
    this.clock += dt;

    // The hop: a parabola from key to key, squashing a little on landing.
    if (this.hopT < 1) {
      this.hopT = Math.min(1, this.hopT + dt / HOP_S);
      const t = this.hopT;
      this.frog.position.lerpVectors(this.from, this.to, t);
      this.frog.position.y = FROG_Y + 2.2 * 4 * t * (1 - t);
      const squash = t > 0.85 ? 1 - Math.sin(((t - 0.85) / 0.15) * Math.PI) * 0.18 : 1;
      this.frog.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    } else {
      this.frog.position.copy(this.to);
      this.frog.scale.set(1, 1, 1);
    }
    this.wobble = Math.max(0, this.wobble - dt);
    this.frog.rotation.z = this.wobble > 0 ? Math.sin(this.wobble * 40) * 0.35 : 0;

    // Show where it may land: always on the first level, otherwise after a pause.
    if (!this.round.finished) {
      const show = this.level.showTargets || this.clock - this.promptAt > HINT_AFTER_S;
      const key = `${this.round.hop}:${show}`;
      if (key !== this.glowKey) {
        this.glowKey = key;
        this.piano.clearGlow();
        if (show) for (const m of this.round.targets()) this.piano.setGlow(m, GREEN, true);
        if (show && !this.level.showTargets) this.message = 'Hint: the glowing keys are where the frog may land.';
        if (show && !this.level.showTargets) this.push();
      }
    } else {
      this.piano.clearGlow();
    }

    if (this.endAt !== null && this.clock >= this.endAt && !this.ended) this.end();
  }

  private end(): void {
    const r = this.round;
    this.finishRound({
      score: r.score,
      stars: r.stars,
      headline: starHeadline(r.stars, ['Keep practising the distances.', 'Getting the distances.', 'Nice hopping!', 'Perfect hopping!']),
      details: [`${r.firstTry} of ${r.total} hops right the first time`, `Longest streak: ${r.bestCombo}`],
    });
  }

}

export default function HopAlongGame({ level, onFinish }: GamePlayProps) {
  const hopLevel = levelOf(HOP_LEVELS, level.id);
  const { hud, stage } = useSceneGame<Hud, HopAlongScene>(
    { score: 0, combo: 0, move: { kind: 'step', dir: 1 }, hop: 1, total: hopLevel.hops, message: ' ' },
    (env, cb) => new HopAlongScene(env, hopLevel, cb),
    onFinish,
  );

  return (
    <GameFrame
      score={hud.score}
      chips={
        <>
          {hud.combo >= 2 && <span className="chip-hot">{hud.combo} in a row</span>}
          <span>hop {hud.hop}/{hud.total}</span>
        </>
      }
      center={
        <>
          <span className="hud-big">{moveText(hud.move)}</span>
          <span className="hud-sub">{moveHelp(hud.move)}</span>
        </>
      }
      caption={hud.message}
    >
      {stage}
    </GameFrame>
  );
}
