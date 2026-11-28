import { playNow } from '../../audio/sounds';
import { cue } from '../../guide/feedback';
import type { GameResult } from '../types';
import { Piano3D } from './Piano3D';
import { pointerNdc, type SceneHandle, type StageEnv } from './Stage';
import { Effects } from './fx';
import { addStage } from './util';

/** How a scene talks back to its React wrapper (see useSceneGame). */
export interface SceneCallbacks<H> {
  hud(h: H): void;
  finish(r: GameResult): void;
}

/**
 * What every game scene has: the stage floor, a 3D keyboard you can click, the particle effects, and
 * the end of the round. Subclasses build the rest, then call `this.resize()` and push their first HUD.
 *
 * Do not re-declare `piano`, `fx` or `ended` in a subclass: with ES2022 class fields that would reset them.
 */
export abstract class PianoScene<H> implements SceneHandle {
  protected readonly piano: Piano3D;
  protected readonly fx: Effects;
  protected ended = false;
  private readonly onPointer: (e: PointerEvent) => void;

  constructor(
    protected readonly env: StageEnv,
    protected readonly cb: SceneCallbacks<H>,
    keyboard: { from: number; to: number; names: boolean; z?: number },
  ) {
    addStage(env.scene);
    this.piano = new Piano3D(keyboard.from, keyboard.to, keyboard.names);
    if (keyboard.z !== undefined) this.piano.group.position.z = keyboard.z;
    env.scene.add(this.piano.group);
    this.fx = new Effects(env.scene);
    this.onPointer = (e) => {
      const midi = this.piano.pick(pointerNdc(e, env.canvas), env.camera);
      if (midi !== null) this.press(midi, performance.now(), true);
    };
    env.canvas.addEventListener('pointerdown', this.onPointer);
  }

  /** A key was played. `screen`: clicked on the 3D keyboard (then the scene makes the sound itself). */
  abstract press(midi: number, timeMs: number, screen?: boolean): void;
  abstract update(dt: number, nowMs: number): void;
  abstract resize(): void;

  /** Press the 3D key down, and sound it if it was clicked on screen. */
  protected touchKey(midi: number, screen: boolean, seconds = 0.6): void {
    this.piano.press(midi);
    if (screen) playNow(midi, seconds);
  }

  /** End the round once: a chime when it earned stars, then the result screen. */
  protected finishRound(result: GameResult, chime = result.stars > 0): void {
    if (this.ended) return;
    this.ended = true;
    if (chime) cue('done');
    this.cb.finish(result);
  }

  dispose(): void {
    this.env.canvas.removeEventListener('pointerdown', this.onPointer);
    this.fx.dispose();
    this.piano.dispose();
  }
}
