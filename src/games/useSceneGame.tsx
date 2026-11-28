import { useRef, useState, type ReactElement } from 'react';
import { Stage, type StageEnv } from './three/Stage';
import type { PianoScene, SceneCallbacks } from './three/PianoScene';
import type { GameResult } from './types';
import { useGameKeys } from './useGameKeys';

/**
 * The React side of a game: the HUD state, piano keys sent to the scene, and the 3D stage.
 * Returns the current HUD and the stage element to put inside a GameFrame.
 */
export function useSceneGame<H, S extends PianoScene<H>>(
  initialHud: H | (() => H),
  create: (env: StageEnv, cb: SceneCallbacks<H>) => S,
  onFinish: (r: GameResult) => void,
  opts: { ignoreOwnSounds?: boolean } = {},
): { hud: H; stage: ReactElement } {
  const scene = useRef<S | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [hud, setHud] = useState<H>(initialHud);

  useGameKeys((midi, time) => scene.current?.press(midi, time), opts.ignoreOwnSounds ?? true);

  const stage = (
    <Stage
      create={(env) => create(env, { hud: setHud, finish: (r) => finishRef.current(r) })}
      onReady={(h) => { scene.current = h as S | null; }}
    />
  );
  return { hud, stage };
}

/** The game's own settings for the level picked on the menu (the first level if unknown). */
export const levelOf = <L extends { id: string }>(levels: L[], id: string): L => levels.find((l) => l.id === id) ?? levels[0];
