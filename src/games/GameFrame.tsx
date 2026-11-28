import type { ReactNode } from 'react';

interface Props {
  score: number;
  /** Small facts in the top right corner: lives, streak, round number. */
  chips?: ReactNode;
  /** Big text in the middle of the stage: a count-in, the chord to play. */
  center?: ReactNode;
  /** One line under the stage: what just happened, or what to do. */
  caption?: ReactNode;
  children: ReactNode;
}

/** The 3D stage with the score and messages laid over it. Shared by every game. */
export function GameFrame({ score, chips, center, caption, children }: Props) {
  return (
    <div className="game-frame">
      <div className="stage-wrap">
        {children}
        <div className="hud" aria-live="polite">
          <div className="hud-top">
            <span className="hud-score">{score}<small> points</small></span>
            <span className="hud-chips">{chips}</span>
          </div>
          {center && <div className="hud-center">{center}</div>}
        </div>
      </div>
      <p className="game-caption" aria-live="polite">{caption ?? ' '}</p>
    </div>
  );
}
