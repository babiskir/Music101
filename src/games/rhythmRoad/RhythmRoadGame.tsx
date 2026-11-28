import { useRef } from 'react';
import * as THREE from 'three';
import { getAudioContext } from '../../audio/audioContext';
import { playClick } from '../../audio/sounds';
import { usePiano } from '../../input/PianoInput';
import { GameFrame } from '../GameFrame';
import { starHeadline } from '../scoring';
import { PianoScene, type SceneCallbacks } from '../three/PianoScene';
import type { StageEnv } from '../three/Stage';
import { clamp01, fitCamera } from '../three/util';
import { levelOf, useSceneGame } from '../useSceneGame';
import type { GamePlayProps } from '../types';
import { RHYTHM_LEVELS, RhythmJudge, buildTimeline, hitPoints, type Grade, type RhythmLevel } from './judge';

interface Hud {
  score: number;
  combo: number;
  played: number;
  total: number;
  banner: string;
  message: string;
}

const HIT_Z = 1;
const ROAD_W = 7;
const ROAD_LEN = 22;
const LOOK_BEATS = 3; // how many beats ahead you can see
const COUNT_IN = 4;
const LEAD_MS = 700;
const ORB_Y = 0.55;
const COLORS = { wait: 0x4fc3f7, perfect: 0xffd166, good: 0x3ddc84, miss: 0x6b7280 };

interface Note {
  orb: THREE.Mesh;
  tail: THREE.Mesh;
  grade: Grade | null;
  /** Seconds since it was graded, for the pop / fade. */
  age: number;
}

/** Orbs travel down a road toward a glowing line: play any key exactly when one touches it. */
class RhythmRoadScene extends PianoScene<Hud> {
  private notes: Note[] = [];
  private beatLines: { mesh: THREE.Mesh; beat: number }[] = [];
  private hitLine: THREE.Mesh;
  private judge: RhythmJudge | null = null;
  private started = false;
  private timeline: ReturnType<typeof buildTimeline>;
  private spbMs: number;
  private upb = ROAD_LEN / LOOK_BEATS; // world units per beat
  private t0 = 0; // performance.now() of beat 0 (the first note); set when the first frame is drawn
  private score = 0;
  private combo = 0;
  private bestCombo = 0;
  private banner = '';
  private message = 'Press any key when an orb touches the glowing line.';
  private endAt: number | null = null;

  constructor(env: StageEnv, level: RhythmLevel, private initialOffsetMs: number, cb: SceneCallbacks<Hud>) {
    super(env, cb, { from: 60, to: 72, names: false, z: 4.8 });

    this.timeline = buildTimeline(level.patterns);
    this.spbMs = 60000 / level.bpm;

    // The road.
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_W, 80),
      new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.9 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.02, HIT_Z - 38);
    env.scene.add(road);
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 80), new THREE.MeshBasicMaterial({ color: 0x4f9cff }));
      edge.position.set((side * ROAD_W) / 2, 0, HIT_Z - 38);
      env.scene.add(edge);
    }

    // One line per beat; the first beat of every bar is brighter.
    for (let b = -COUNT_IN; b <= this.timeline.totalBeats; b++) {
      const bar = b % 4 === 0;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_W, 0.02, bar ? 0.12 : 0.05),
        new THREE.MeshBasicMaterial({ color: bar ? 0x7aa2ff : 0x34415c, transparent: true }),
      );
      env.scene.add(mesh);
      this.beatLines.push({ mesh, beat: b });
    }

    // The line to hit.
    this.hitLine = new THREE.Mesh(
      new THREE.BoxGeometry(ROAD_W + 0.4, 0.12, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    this.hitLine.position.set(0, 0.05, HIT_Z);
    env.scene.add(this.hitLine);

    // The notes: an orb, with a thin tail as long as the note.
    const orbGeo = new THREE.SphereGeometry(0.55, 24, 16);
    this.timeline.starts.forEach((_, i) => {
      const orb = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({ color: COLORS.wait, emissive: COLORS.wait, emissiveIntensity: 0.55, transparent: true }));
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.12, 1),
        new THREE.MeshBasicMaterial({ color: COLORS.wait, transparent: true, opacity: 0.55 }),
      );
      tail.scale.z = Math.max(0.1, this.timeline.lengths[i] * this.upb * 0.9);
      env.scene.add(orb, tail);
      this.notes.push({ orb, tail, grade: null, age: 0 });
    });

    this.resize();
    this.push();
  }

  /**
   * Start the clock. Done on the first drawn frame, not in the constructor: React may build a scene and
   * throw it away again at once (development mode), and its clicks must never sound.
   */
  private begin(nowMs: number): void {
    this.started = true;
    this.t0 = nowMs + LEAD_MS + COUNT_IN * this.spbMs;
    this.judge = new RhythmJudge(
      this.timeline.starts.map((b) => this.t0 + b * this.spbMs),
      this.spbMs,
      Math.min(...this.timeline.lengths),
      this.initialOffsetMs,
    );
    // Audible beats: every click is scheduled on the audio clock now, so they never wobble.
    const ctx = getAudioContext();
    for (let b = -COUNT_IN; b <= Math.ceil(this.timeline.totalBeats); b++) {
      const at = ctx.currentTime + (this.t0 + b * this.spbMs - nowMs) / 1000;
      if (at > ctx.currentTime) playClick(at, b % 4 === 0);
    }
  }

  resize(): void {
    fitCamera(this.env.camera, { center: new THREE.Vector3(0, 0, -3.5), width: 12, pitchDeg: 36 });
  }

  private push(): void {
    this.cb.hud({
      score: this.score,
      combo: this.combo,
      played: this.judge?.resolved ?? 0,
      total: this.timeline.starts.length,
      banner: this.banner,
      message: this.message,
    });
  }

  private zOfBeat(beat: number, nowBeat: number): number {
    return HIT_Z - (beat - nowBeat) * this.upb;
  }

  press(midi: number, timeMs: number, screen = false): void {
    if (this.ended || !this.judge) return;
    this.touchKey(midi, screen, 0.4);
    this.piano.flash(midi, 0x4fc3f7);
    if (timeMs < this.t0 - 0.9 * this.spbMs) return; // during the count-in: just a doodle

    const hit = this.judge.press(timeMs);
    if (!hit) {
      this.message = 'That key was between the notes. Wait for the orb to touch the line.';
      this.push();
      return;
    }
    const note = this.notes[hit.index];
    note.grade = hit.grade;
    note.age = 0;
    const colour = hit.grade === 'perfect' ? COLORS.perfect : COLORS.good;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const points = hitPoints(hit.grade, this.combo);
    this.score += points;
    const at = new THREE.Vector3(0, 1.2, HIT_Z);
    this.fx.burst(new THREE.Vector3(0, ORB_Y, HIT_Z), colour, 26);
    const side = hit.errorMs < 0 ? 'early' : 'late';
    this.fx.float(hit.grade === 'perfect' ? 'Perfect!' : `Good (${side})`, at, hit.grade === 'perfect' ? '#ffd166' : '#3ddc84');
    this.message = hit.grade === 'perfect' ? 'Right on the beat.' : `A little ${side}: ${Math.abs(Math.round(hit.errorMs))} ms.`;
    this.push();
  }

  update(dt: number, nowMs: number): void {
    this.piano.update(dt);
    this.fx.update(dt);
    if (!this.started) this.begin(nowMs);
    const judge = this.judge!;
    const nowBeat = (nowMs - this.t0) / this.spbMs;

    // Count-in banner.
    let banner = '';
    if (nowBeat < 0) banner = nowBeat >= -COUNT_IN ? String(Math.floor(nowBeat) + COUNT_IN + 1) : 'Get ready';
    else if (nowBeat < 0.6 && !this.ended) banner = 'Go!';
    if (banner !== this.banner) {
      this.banner = banner;
      this.push();
    }

    // Notes whose window closed are misses.
    for (const i of judge.sweep(nowMs)) {
      const n = this.notes[i];
      n.grade = 'miss';
      n.age = 0;
      this.combo = 0;
      this.fx.float('Miss', new THREE.Vector3(0, 1.2, HIT_Z), '#9aa3b2');
      this.message = 'Missed one. Keep the beat going: the next orb is coming.';
      this.push();
    }

    // Move everything toward the player.
    for (const l of this.beatLines) {
      const z = this.zOfBeat(l.beat, nowBeat);
      l.mesh.position.set(0, 0.005, z);
      (l.mesh.material as THREE.MeshBasicMaterial).opacity = clamp01((z + ROAD_LEN) / 6) * (z > HIT_Z + 6 ? 0 : 1);
    }
    const onBeat = clamp01(1 - ((((nowBeat % 1) + 1) % 1) * 4));
    this.hitLine.scale.set(1, 1 + 1.2 * onBeat, 1 + 1.5 * onBeat);

    this.notes.forEach((n, i) => {
      const z = this.zOfBeat(this.timeline.starts[i], nowBeat);
      const far = clamp01((z + ROAD_LEN - 4) / 5); // fade in at the far end
      let opacity = far;
      let scale = 1;
      if (n.grade === 'perfect' || n.grade === 'good') {
        n.age += dt;
        const t = clamp01(n.age / 0.3);
        scale = 1 + t * 0.8;
        opacity = 1 - t;
        n.orb.position.set(0, ORB_Y, HIT_Z);
      } else {
        n.orb.position.set(0, ORB_Y, z);
        if (n.grade === 'miss') {
          const c = new THREE.Color(COLORS.miss);
          (n.orb.material as THREE.MeshStandardMaterial).color.copy(c);
          (n.orb.material as THREE.MeshStandardMaterial).emissive.copy(c);
          opacity = Math.min(far, 0.6) * clamp01(1 - (z - HIT_Z) / 3); // drifts past the line and fades
        }
      }
      (n.orb.material as THREE.MeshStandardMaterial).opacity = opacity;
      n.orb.scale.setScalar(scale);
      const tailVisible = n.grade === null || n.grade === 'miss';
      n.tail.visible = tailVisible && z > -ROAD_LEN - 5;
      n.tail.position.set(0, 0.1, z - (this.timeline.lengths[i] * this.upb * 0.9) / 2);
      (n.tail.material as THREE.MeshBasicMaterial).opacity = 0.55 * opacity;
    });

    if (judge.resolved === this.notes.length && this.endAt === null) this.endAt = nowMs + 1300;
    if (this.endAt !== null && nowMs >= this.endAt && !this.ended) this.end();
  }

  private end(): void {
    const j = this.judge!;
    this.finishRound({
      score: this.score,
      stars: j.stars,
      headline: starHeadline(j.stars, ['Keep listening to the click.', 'Getting steadier.', 'Solid rhythm.', 'Right on the beat!']),
      details: [
        `${j.count('perfect')} perfect, ${j.count('good')} good, ${j.count('miss')} missed`,
        `Longest streak: ${this.bestCombo}`,
      ],
    });
  }

}

export default function RhythmRoadGame({ level, onFinish }: GamePlayProps) {
  const rhythmLevel = levelOf(RHYTHM_LEVELS, level.id);
  const piano = usePiano();
  const sourceRef = useRef(piano.source);
  sourceRef.current = piano.source;
  const { hud, stage } = useSceneGame<Hud, RhythmRoadScene>(
    { score: 0, combo: 0, played: 0, total: rhythmLevel.patterns.flat().length, banner: '', message: ' ' },
    (env, cb) => new RhythmRoadScene(env, rhythmLevel, sourceRef.current === 'mic' ? 120 : 0, cb),
    onFinish,
    // Rhythm games make no beeps on hits, so there is nothing for the microphone to mistake for a note.
    { ignoreOwnSounds: false },
  );

  return (
    <GameFrame
      score={hud.score}
      chips={
        <>
          {hud.combo >= 2 && <span className="chip-hot">{hud.combo} in a row</span>}
          <span>{hud.played}/{hud.total}</span>
          <span>♩ = {rhythmLevel.bpm}</span>
        </>
      }
      center={hud.banner ? <span className="hud-big">{hud.banner}</span> : undefined}
      caption={hud.message}
    >
      {stage}
    </GameFrame>
  );
}
