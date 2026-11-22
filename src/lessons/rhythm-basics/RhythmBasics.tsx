import { useState } from 'react';
import type { Song, SongNote } from '../../domain/song';
import { Metronome } from '../../features/metronome/Metronome';
import { isBoolean, numberBetween, oneOf } from '../../lib/storage';
import { usePersistentState } from '../../lib/usePersistentState';
import { StaffNotation } from '../../features/staff/StaffNotation';
import { useSongPlayer } from '../../features/practice/useSongPlayer';

interface Pattern {
  id: string;
  title: string;
  beats: number[];
}

const PATTERNS: Pattern[] = [
  { id: 'quarters', title: 'Steady quarters', beats: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: 'halves', title: 'Half notes', beats: [2, 2, 2, 2] },
  { id: 'mix', title: 'Mix of 1s and 2s', beats: [1, 1, 2, 2, 1, 1] },
  { id: 'whole', title: 'Whole notes', beats: [4, 4] },
  { id: 'eighths', title: 'Eighth notes', beats: [0.5, 0.5, 0.5, 0.5, 1, 2, 1, 1, 1, 1] },
];

const REFERENCE = [
  { name: 'Whole note', beats: '4 beats', count: '1 – 2 – 3 – 4' },
  { name: 'Half note', beats: '2 beats', count: '1 – 2' },
  { name: 'Quarter note', beats: '1 beat', count: '1' },
  { name: 'Eighth note', beats: '½ beat', count: '1 &' },
];

function toSong(p: Pattern): Song {
  // Rhythm is shown on a single pitch; B4 is the staff's middle line, the usual spot for rhythm drills.
  const notes: SongNote[] = p.beats.map((beats) => ({ pitch: 'B4', beats }));
  return {
    id: `rhythm-${p.id}`,
    title: p.title,
    key: 'C major',
    beatsPerBar: 4,
    targetBpm: 90,
    hand: 'right',
    handPosition: '',
    tips: [],
    notes,
  };
}

/** Layout: pattern + staff + controls on the left; reference table and plain metronome on the right. */
export function RhythmBasics() {
  const [patternId, setPatternId] = usePersistentState('rhythm.pattern', PATTERNS[0].id, oneOf(...PATTERNS.map((p) => p.id)));
  const [bpm, setBpm] = usePersistentState('rhythm.bpm', 60, numberBetween(30, 120));
  const [hearNotes, setHearNotes] = usePersistentState('rhythm.hear', true, isBoolean);
  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0];
  const [song, setSong] = useState(() => toSong(pattern));

  const player = useSongPlayer(song, { bpm, hearNotes });

  const choose = (id: string) => {
    player.reset();
    setPatternId(id);
    setSong(toSong(PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]));
  };

  return (
    <div className="rhythm-layout">
      <section className="card">
        <h2>Feel the beat <small>count out loud: "1 2 3 4"</small></h2>
        <div className="tabs">
          {PATTERNS.map((p) => (
            <button key={p.id} className={p.id === patternId ? 'selected' : ''} onClick={() => choose(p.id)}>
              {p.title}
            </button>
          ))}
        </div>

        <div className="now">
          {player.countIn !== null ? (
            <span className="count-in">{player.countIn}</span>
          ) : (
            <span className="muted hint">One bar of count-in, then say or clap each note as it lights up.</span>
          )}
        </div>

        <StaffNotation
          notes={player.notes}
          beatsPerBar={song.beatsPerBar}
          activeIndex={player.playingAlong ? player.activeIndex : -1}
          maxBarsPerLine={2}
        />

        <div className="row">
          <button className="primary" onClick={player.playingAlong ? player.stopPlayAlong : player.startPlayAlong}>
            {player.playingAlong ? 'Stop' : 'Start'}
          </button>
          <label className="grow">
            Tempo: <strong>{bpm} BPM</strong>
            <input type="range" min={30} max={120} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <label>
            <input type="checkbox" checked={hearNotes} onChange={(e) => setHearNotes(e.target.checked)} /> Hear the rhythm
          </label>
        </div>
      </section>

      <div className="rhythm-side">
        <section className="card">
          <h3>Note lengths</h3>
          <table className="ref">
            <tbody>
              {REFERENCE.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.beats}</td>
                  <td className="muted">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <Metronome />
      </div>
    </div>
  );
}
