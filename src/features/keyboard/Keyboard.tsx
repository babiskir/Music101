import { isBlackKey, midiToName, noteName } from '../../domain/notes';

export interface KeyHighlight {
  /** "current" = play now, "next" = coming up, "correct"/"wrong" = quiz feedback. */
  kind: 'current' | 'next' | 'correct' | 'wrong';
  /** Small text on the key, e.g. the finger number. */
  label?: string;
}

interface Props {
  /** First and last key as MIDI numbers (inclusive). Both should be white keys. */
  from: number;
  to: number;
  highlights: Record<number, KeyHighlight>;
  /** If given, keys are clickable (also lets you hear them). */
  onKeyPress?: (midi: number) => void;
  /** Note names on the white keys (turn off when the exercise asks you to find them). Default on. */
  showNames?: boolean;
}

const MIDDLE_C = 60;

export function Keyboard({ from, to, highlights, onKeyPress, showNames = true }: Props) {
  const whites: number[] = [];
  const blacks: number[] = [];
  for (let m = from; m <= to; m++) (isBlackKey(m) ? blacks : whites).push(m);

  const whiteWidth = 100 / whites.length;
  const blackWidth = whiteWidth * 0.6;

  const cls = (m: number) => {
    const h = highlights[m];
    return (h ? ` ${h.kind}` : '') + (onKeyPress ? ' clickable' : '');
  };

  return (
    <div className="keyboard" role="img" aria-label="Piano keyboard">
      <div className="whites">
        {whites.map((m) => (
          <div key={m} className={`white${cls(m)}`} onClick={() => onKeyPress?.(m)}>
            {highlights[m]?.label && <span className="finger">{highlights[m].label}</span>}
            {showNames && (
              <span className="name">
                <b>{noteName(m)}</b>
                <b>{midiToName(m)}</b>
                {m === MIDDLE_C && <em> middle</em>}
              </span>
            )}
          </div>
        ))}
      </div>
      {blacks.map((m) => {
        const leftWhite = whites.indexOf(m - 1);
        return (
          <div
            key={m}
            className={`black${cls(m)}`}
            onClick={() => onKeyPress?.(m)}
            style={{ left: `${(leftWhite + 1) * whiteWidth - blackWidth / 2}%`, width: `${blackWidth}%` }}
          >
            {highlights[m]?.label && <span className="finger">{highlights[m].label}</span>}
          </div>
        );
      })}
    </div>
  );
}
