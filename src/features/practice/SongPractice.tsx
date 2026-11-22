import { useMemo, useRef, useState } from 'react';
import { CT_S100 } from '../../domain/instrument';
import { pitchToMidi } from '../../domain/notes';
import { FINGER_NAMES, type Song } from '../../domain/song';
import { usePiano, usePianoNotes } from '../../input/PianoInput';
import { isBoolean, numberBetween } from '../../lib/storage';
import { usePersistentState } from '../../lib/usePersistentState';
import { Keyboard, type KeyHighlight } from '../keyboard/Keyboard';
import { rangeForNotes } from '../keyboard/range';
import { StaffNotation } from '../staff/StaffNotation';
import { useSongPlayer } from './useSongPlayer';

export function SongPractice({ song }: { song: Song }) {
  // Tempo is remembered per song, so each song picks up where you left off.
  const [bpm, setBpm] = usePersistentState(`practice.bpm.${song.id}`, 60, numberBetween(30, 160));
  const [hearNotes, setHearNotes] = usePersistentState('practice.hear', true, isBoolean);
  const [fullKeyboard, setFullKeyboard] = usePersistentState('practice.fullkeys', false, isBoolean);

  const piano = usePiano();
  const [waitForMe, setWaitForMe] = usePersistentState('practice.wait', true, isBoolean);
  const [slips, setSlips] = useState(0);
  const [wrongKey, setWrongKey] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const wrongTimer = useRef<number | undefined>(undefined);

  const player = useSongPlayer(song, { bpm, hearNotes });
  const { notes, activeIndex } = player;

  const [from, to] = useMemo(
    () =>
      fullKeyboard
        ? [CT_S100.lowest, CT_S100.highest]
        : rangeForNotes(notes.map((n) => pitchToMidi(n.pitch)), CT_S100),
    [fullKeyboard, notes],
  );

  const current = notes[activeIndex];
  const upcoming = notes[activeIndex + 1];

  // With a connected keyboard, the song waits for you: the right key moves on, a wrong key counts a slip.
  const waiting = piano.connected && waitForMe && !player.playingAlong;
  usePianoNotes((e) => {
    if (!waiting || finished) return;
    if (e.midi === pitchToMidi(current.pitch)) {
      if (activeIndex >= notes.length - 1) setFinished(true);
      else player.nextSilent();
    } else {
      setSlips((s) => s + 1);
      setWrongKey(e.midi);
      window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setWrongKey(null), 500);
    }
  });

  const restart = () => {
    player.reset();
    setSlips(0);
    setFinished(false);
    setWrongKey(null);
  };

  const highlights: Record<number, KeyHighlight> = {};
  if (upcoming) {
    highlights[pitchToMidi(upcoming.pitch)] = { kind: 'next', label: upcoming.finger?.toString() };
  }
  highlights[pitchToMidi(current.pitch)] = { kind: 'current', label: current.finger?.toString() };
  if (wrongKey !== null) highlights[wrongKey] = { kind: 'wrong' };

  return (
    <section className="card">
      <h2>
        {song.title} <small>{song.composer} · {song.key} · {song.hand} hand</small>
      </h2>
      <p className="hand-position">{song.handPosition}</p>

      {finished && (
        <p className="hint-box win">
          🎉 You played the whole song{slips === 0 ? ' without a single slip!' : ` with ${slips} slip${slips === 1 ? '' : 's'}.`}{' '}
          <button onClick={restart}>Play again</button>
        </p>
      )}
      <div className="now">
        {player.countIn !== null ? (
          <span className="count-in">{player.countIn}</span>
        ) : (
          <>
            Play <strong>{current.pitch}</strong>
            {current.finger && (
              <>
                {' '}with finger <strong>{current.finger}</strong> ({FINGER_NAMES[current.finger]})
              </>
            )}
            <span className="muted"> · hold {current.beats} beat{current.beats === 1 ? '' : 's'}</span>
          </>
        )}
      </div>
      {waiting && !finished && (
        <p className="legend">Waiting for you to play it on your keyboard · slips: {slips}</p>
      )}

      <Keyboard from={from} to={to} highlights={highlights} />
      <p className="legend">
        <span className="swatch current" /> play now <span className="swatch next" /> next · number on key = finger
      </p>

      <StaffNotation
        notes={notes}
        activeIndex={activeIndex}
        beatsPerBar={song.beatsPerBar}
        onSelect={player.goTo}
      />
      <p className="legend">Click any note on the sheet to jump to it. Small number under a note = finger.</p>

      <div className="row">
        <button onClick={player.prev} disabled={player.playingAlong}>◀ Prev</button>
        <button onClick={player.next} disabled={player.playingAlong}>Next ▶</button>
        <button onClick={restart}>Reset</button>
        <button
          className="primary"
          onClick={player.playingAlong ? player.stopPlayAlong : player.startPlayAlong}
        >
          {player.playingAlong ? 'Stop' : 'Play along (1 bar count-in)'}
        </button>
      </div>

      <div className="row">
        <label className="grow">
          Tempo: <strong>{bpm} BPM</strong> <span className="muted">(goal ~{song.targetBpm})</span>
          <input
            type="range"
            min={30}
            max={160}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>
        {piano.connected && (
          <label>
            <input type="checkbox" checked={waitForMe} onChange={(e) => setWaitForMe(e.target.checked)} /> Wait for my playing
          </label>
        )}
        <label>
          <input type="checkbox" checked={hearNotes} onChange={(e) => setHearNotes(e.target.checked)} /> Hear notes
        </label>
        <label>
          <input type="checkbox" checked={fullKeyboard} onChange={(e) => setFullKeyboard(e.target.checked)} /> All 61 keys
        </label>
      </div>

      <h3>Tips</h3>
      <ul>
        {song.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
