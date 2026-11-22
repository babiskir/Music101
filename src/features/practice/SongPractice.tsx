import { useMemo, useState } from 'react';
import { CT_S100 } from '../../domain/instrument';
import { pitchToMidi } from '../../domain/notes';
import type { Song } from '../../domain/song';
import { Keyboard, type KeyHighlight } from '../keyboard/Keyboard';
import { rangeForNotes } from '../keyboard/range';
import { StaffNotation } from '../staff/StaffNotation';
import { useSongPlayer } from './useSongPlayer';

const FINGER_NAMES = ['', 'thumb', 'index', 'middle', 'ring', 'pinky'];

export function SongPractice({ song }: { song: Song }) {
  const [bpm, setBpm] = useState(60);
  const [hearNotes, setHearNotes] = useState(true);
  const [fullKeyboard, setFullKeyboard] = useState(false);

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

  const highlights: Record<number, KeyHighlight> = {};
  if (upcoming) {
    highlights[pitchToMidi(upcoming.pitch)] = { kind: 'next', label: upcoming.finger?.toString() };
  }
  highlights[pitchToMidi(current.pitch)] = { kind: 'current', label: current.finger?.toString() };

  return (
    <section className="card">
      <h2>
        {song.title} <small>{song.composer} · {song.key} · {song.hand} hand</small>
      </h2>
      <p className="hand-position">{song.handPosition}</p>

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
        <button onClick={player.reset}>Reset</button>
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
