import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import { midiToPitch } from '../../domain/notes';
import { FINGER_NAMES } from '../../domain/song';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { oneOf } from '../../lib/storage';
import { usePersistentState } from '../../lib/usePersistentState';
import { FingerDrill } from './FingerDrill';
import { FingerQuiz } from './FingerQuiz';
import { FINGERS, POSITIONS, POSTURE_TIPS, type Hand } from './positions';

type Tab = 'place' | 'quiz' | 'drill';

/** Layout: hand + exercise tabs on top; the exercise body below changes per tab. */
export function HandPosition() {
  const [hand, setHand] = usePersistentState<Hand>('hand.hand', 'right', oneOf('right', 'left'));
  const [tab, setTab] = usePersistentState<Tab>('hand.tab', 'place', oneOf('place', 'quiz', 'drill'));
  const pos = POSITIONS[hand];

  return (
    <section className="card">
      <h2>Hand &amp; fingers <small>five-finger "C position"</small></h2>

      <div className="tabs">
        {(['right', 'left'] as Hand[]).map((h) => (
          <button key={h} className={hand === h ? 'selected' : ''} onClick={() => setHand(h)}>
            {POSITIONS[h].label}
          </button>
        ))}
        <span className="tabs-sep" />
        <button className={tab === 'place' ? 'selected' : ''} onClick={() => setTab('place')}>1. Place your hand</button>
        <button className={tab === 'quiz' ? 'selected' : ''} onClick={() => setTab('quiz')}>2. Which finger?</button>
        <button className={tab === 'drill' ? 'selected' : ''} onClick={() => setTab('drill')}>3. Finger drills</button>
      </div>

      {tab === 'place' && <PlaceYourHand hand={hand} />}
      {tab === 'quiz' && <FingerQuiz key={hand} hand={hand} />}
      {tab === 'drill' && <FingerDrill key={hand} hand={hand} />}

      <p className="muted">{pos.description}</p>
    </section>
  );
}

function PlaceYourHand({ hand }: { hand: Hand }) {
  const pos = POSITIONS[hand];
  const highlights: Record<number, KeyHighlight> = {};
  for (const f of FINGERS) highlights[pos.keys[f]] = { kind: 'current', label: String(f) };

  const hear = (midi: number) => playNote(midi, getAudioContext().currentTime, 0.7);

  return (
    <div className="hand-place">
      <p className="explain">
        Put your {hand} hand on the highlighted keys. The number on each key is the finger that rests there.
        Click keys to hear them.
      </p>
      <Keyboard from={pos.range[0]} to={pos.range[1]} highlights={highlights} onKeyPress={hear} />
      <table className="ref finger-table">
        <tbody>
          {(hand === 'right' ? FINGERS : [...FINGERS].reverse()).map((f) => (
            <tr key={f}>
              <td><strong>{f}</strong></td>
              <td>{FINGER_NAMES[f]}</td>
              <td>{midiToPitch(pos.keys[f])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Posture</h3>
      <ul>
        {POSTURE_TIPS.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
}
