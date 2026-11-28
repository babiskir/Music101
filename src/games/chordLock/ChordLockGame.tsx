import * as THREE from 'three';
import { bothClassNames, bothNames } from '../../domain/notes';
import { cue } from '../../guide/feedback';
import { GameFrame } from '../GameFrame';
import { starHeadline } from '../scoring';
import { PianoScene, type SceneCallbacks } from '../three/PianoScene';
import type { StageEnv } from '../three/Stage';
import { textLabel } from '../three/textures';
import { clamp01, fitCamera } from '../three/util';
import { levelOf, useSceneGame } from '../useSceneGame';
import type { GamePlayProps } from '../types';
import { CHORD_LEVELS, CHORD_ROOTS, ChordRound, TONE_NAMES, chordNotes, chordSequence, type ChordLevel, type ChordName } from './logic';

interface Hud {
  score: number;
  combo: number;
  chord: ChordName;
  index: number;
  total: number;
  found: boolean[];
  /** Share of the time left for this chord, or null when there is no limit. */
  timeFrac: number | null;
  message: string;
}

const RANGE: [number, number] = [55, 79];
const TONE_COLORS = [0xff7a59, 0xffd166, 0x4fc3f7];
const ORB_X = [-3.4, 0, 3.4];
const ORB_Y = 3.6;
const GRACE_S = 1;
const chordTitle = (name: ChordName) => bothNames(CHORD_ROOTS[name]);

/** Three orbs wait to be lit: play the root, middle and top note of the chord, in any order. */
class ChordLockScene extends PianoScene<Hud> {
  private round: ChordRound;
  private orbs: THREE.Mesh[] = [];
  private lit = [0, 0, 0]; // 0..1 how lit each orb is (eases toward its goal)
  private ring: THREE.Mesh;
  private ringPulse = 0;
  private shake = 0;
  private clock = 0;
  private started = false;
  private clearOrbsAt: number | null = null;
  private endAt: number | null = null;
  private message = 'Play the three notes of the chord, in any order. Any octave counts.';
  private lastHudAt = 0;

  constructor(env: StageEnv, private level: ChordLevel, cb: SceneCallbacks<Hud>) {
    super(env, cb, { from: RANGE[0], to: RANGE[1], names: level.names });
    this.round = new ChordRound(chordSequence(level.rounds), level.timeS);

    const orbGeo = new THREE.SphereGeometry(0.9, 32, 20);
    ORB_X.forEach((x, i) => {
      const orb = new THREE.Mesh(
        orbGeo,
        new THREE.MeshStandardMaterial({ color: 0x39414f, emissive: TONE_COLORS[i], emissiveIntensity: 0, roughness: 0.3 }),
      );
      orb.position.set(x, ORB_Y, -1.2);
      env.scene.add(orb);
      this.orbs.push(orb);

      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: textLabel(TONE_NAMES[i], '#c9d1e0'), transparent: true, depthTest: false }));
      label.scale.set(2.4, 0.6, 1);
      label.position.set(x, ORB_Y - 1.5, -1.2);
      env.scene.add(label);
    });

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.3, 0.07, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0x4f5b70, transparent: true }),
    );
    this.ring.position.set(0, ORB_Y, -1.5);
    this.ring.scale.set(1, 0.42, 1); // an ellipse is plenty: it only frames the orbs
    env.scene.add(this.ring);

    this.resize();
    this.refreshKeys();
    this.push();
  }

  resize(): void {
    fitCamera(this.env.camera, { center: new THREE.Vector3(0, 2.4, 0), width: this.piano.width + 3, pitchDeg: 40 });
  }

  private push(): void {
    const left = this.round.timeLeft(this.clock);
    this.cb.hud({
      score: this.round.score,
      combo: this.round.combo,
      chord: this.round.current,
      index: Math.min(this.round.index + 1, this.round.total),
      total: this.round.total,
      found: [...this.round.found],
      timeFrac: left === null || !this.round.timeLimitS ? null : clamp01(left / this.round.timeLimitS),
      message: this.message,
    });
  }

  /** Every key of this chord, in every octave of the keyboard. */
  private chordKeys(name: ChordName): number[][] {
    const tones = chordNotes(name);
    return tones.map((t) => {
      const keys: number[] = [];
      for (let m = RANGE[0]; m <= RANGE[1]; m++) if (m % 12 === t % 12) keys.push(m);
      return keys;
    });
  }

  /** Light the keys to play (on the first level) and the keys already found. */
  private refreshKeys(): void {
    this.piano.clearGlow();
    if (this.round.finished) return;
    this.chordKeys(this.round.current).forEach((keys, tone) => {
      for (const m of keys) {
        if (this.round.found[tone]) this.piano.setGlow(m, 0x3ddc84);
        else if (this.level.lit) this.piano.setGlow(m, 0xffb020, true);
      }
    });
  }

  private clearOrbs(): void {
    this.lit = [0, 0, 0].map((_, i) => (this.round.found[i] ? 1 : 0));
    this.clearOrbsAt = null;
  }

  press(midi: number, _timeMs: number, screen = false): void {
    if (this.ended) return;
    this.touchKey(midi, screen);
    const before = this.round.current;
    const res = this.round.press(midi, this.clock);
    if (res.kind === 'wrong') {
      this.piano.flash(midi, 0xff5d5d);
      this.shake = 0.4;
      cue('wrong');
      this.message = `${bothClassNames(midi % 12)} is not in the ${chordTitle(before)} chord. Skip a key between the notes.`;
    } else if (res.kind === 'again') {
      this.piano.flash(midi, 0x4fc3f7);
      this.message = 'You already have that note. Find the other ones.';
    } else {
      if (this.clearOrbsAt !== null) this.clearOrbs(); // a note of the next chord arrived: the old glow goes
      this.piano.flash(midi, 0x3ddc84);
      this.orbs[res.tone].position.y = ORB_Y + 0.5;
      this.lit[res.tone] = 1;
      this.fx.burst(this.orbs[res.tone].position.clone(), TONE_COLORS[res.tone], 20);
      if (res.complete) {
        this.lit = [1, 1, 1];
        this.ringPulse = 1;
        this.clearOrbsAt = this.clock + 0.9;
        this.fx.float(`+${res.points}`, new THREE.Vector3(0, ORB_Y + 2, -1), '#3ddc84', 1.2);
        cue('done');
        this.message = this.round.finished ? ' ' : `${chordTitle(before)} chord! Now the next one.`;
      } else {
        cue('ok');
        const left = this.round.found.filter((f) => !f).length;
        this.message = `${left} more to go.`;
      }
    }
    this.refreshKeys();
    this.push();
    if (this.round.finished && this.endAt === null) this.endAt = this.clock + 1.4;
  }

  update(dt: number): void {
    this.piano.update(dt);
    this.fx.update(dt);
    this.clock += dt;
    if (!this.started) {
      this.started = true;
      this.round.start(this.clock + GRACE_S);
    }

    if (this.round.tick(this.clock)) {
      const name = this.round.chords[this.round.index - 1];
      const notes = chordNotes(name).map(bothNames).join(', ');
      cue('wrong');
      this.message = `Time is up. The ${chordTitle(name)} chord is ${notes}.`;
      this.clearOrbs();
      this.refreshKeys();
      this.push();
      if (this.round.finished && this.endAt === null) this.endAt = this.clock + 1.4;
    }
    if (this.clearOrbsAt !== null && this.clock >= this.clearOrbsAt) {
      this.clearOrbs();
      this.push();
    }

    // Orbs ease toward lit or dark, and settle back down after a hop.
    this.orbs.forEach((orb, i) => {
      const mat = orb.material as THREE.MeshStandardMaterial;
      this.lit[i] += ((this.round.found[i] || this.clearOrbsAt !== null ? 1 : 0) - this.lit[i]) * Math.min(1, dt * 10);
      mat.emissiveIntensity = this.lit[i] * 0.9;
      mat.color.setHex(0x39414f).lerp(new THREE.Color(TONE_COLORS[i]), this.lit[i]);
      orb.position.y += (ORB_Y - orb.position.y) * Math.min(1, dt * 8);
      orb.rotation.y += dt * (0.6 + this.lit[i] * 2);
    });

    // The ring flashes green when the chord is complete and trembles on a wrong key.
    this.shake = Math.max(0, this.shake - dt);
    this.ringPulse = Math.max(0, this.ringPulse - dt * 1.6);
    const ringMat = this.ring.material as THREE.MeshBasicMaterial;
    ringMat.color.setHex(0x4f5b70).lerp(new THREE.Color(this.shake > 0 ? 0xff5d5d : 0x3ddc84), Math.max(this.ringPulse, this.shake > 0 ? 1 : 0));
    const grow = 1 + this.ringPulse * 0.25;
    this.ring.scale.set(grow, 0.42 * grow, 1);
    this.ring.position.x = this.shake > 0 ? Math.sin(this.shake * 70) * 0.2 : 0;

    // The clock bar needs fresh numbers a few times a second.
    if (this.round.timeLimitS !== null && !this.round.finished && this.clock - this.lastHudAt > 0.1) {
      this.lastHudAt = this.clock;
      this.push();
    }
    if (this.endAt !== null && this.clock >= this.endAt && !this.ended) this.end();
  }

  private end(): void {
    const r = this.round;
    this.finishRound({
      score: r.score,
      stars: r.stars,
      headline: starHeadline(r.stars, ['Keep practising the shapes.', 'Getting the shapes.', 'Nice chords!', 'Chord master!']),
      details: [
        `${r.clean} clean, ${r.slipped} with slips, ${r.timedOut} out of time (of ${r.total})`,
        `Longest streak: ${r.bestCombo}`,
      ],
    });
  }

}

export default function ChordLockGame({ level, onFinish }: GamePlayProps) {
  const chordLevel = levelOf(CHORD_LEVELS, level.id);
  const { hud, stage } = useSceneGame<Hud, ChordLockScene>(
    { score: 0, combo: 0, chord: 'C', index: 1, total: chordLevel.rounds, found: [false, false, false], timeFrac: null, message: ' ' },
    (env, cb) => new ChordLockScene(env, chordLevel, cb),
    onFinish,
  );

  return (
    <GameFrame
      score={hud.score}
      chips={
        <>
          {hud.combo >= 2 && <span className="chip-hot">{hud.combo} in a row</span>}
          <span>chord {hud.index}/{hud.total}</span>
        </>
      }
      center={
        <>
          <span className="hud-big">{chordTitle(hud.chord)} chord</span>
          {hud.timeFrac !== null && (
            <span className="timer-bar" role="img" aria-label="Time left">
              <span className={hud.timeFrac < 0.25 ? 'low' : ''} style={{ width: `${hud.timeFrac * 100}%` }} />
            </span>
          )}
        </>
      }
      caption={hud.message}
    >
      {stage}
    </GameFrame>
  );
}
