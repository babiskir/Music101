import { useCallback, useMemo, useState } from 'react';
import { playNote } from '../../audio/sounds';
import { getAudioContext } from '../../audio/audioContext';
import type { Tick } from '../../audio/MetronomeEngine';
import { pitchToMidi } from '../../domain/notes';
import { totalBeats, withTiming, type Song } from '../../domain/song';
import { useMetronomeEngine } from '../metronome/useMetronomeEngine';

const TICKS_PER_BEAT = 2; // lets us land on half-beat notes

interface Options {
  bpm: number;
  hearNotes: boolean;
}

/**
 * Tracks which note you should be playing. Two ways to move through the song:
 *  - step manually (next / prev) — no pressure, great for learning finger positions
 *  - play along — one bar of count-in, then the highlight advances in time with the click
 */
export function useSongPlayer(song: Song, { bpm, hearNotes }: Options) {
  const notes = useMemo(() => withTiming(song), [song]);
  const length = useMemo(() => totalBeats(song), [song]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [countIn, setCountIn] = useState<number | null>(null);

  const countInTicks = song.beatsPerBar * TICKS_PER_BEAT;
  const secondsPerBeat = 60 / bpm;

  const { running, start, stop } = useMetronomeEngine({
    bpm,
    beatsPerBar: song.beatsPerBar,
    ticksPerBeat: TICKS_PER_BEAT,
    onSchedule: (tick: Tick) => {
      if (!hearNotes || tick.index < countInTicks) return;
      const songBeat = (tick.index - countInTicks) / TICKS_PER_BEAT;
      const note = notes.find((n) => n.startBeat === songBeat);
      if (note) playNote(pitchToMidi(note.pitch), tick.time, note.beats * secondsPerBeat * 0.95);
    },
    onTick: (tick: Tick) => {
      if (tick.index < countInTicks) {
        if (tick.isBeat) setCountIn(song.beatsPerBar - tick.beat);
        return;
      }
      setCountIn(null);
      const songBeat = (tick.index - countInTicks) / TICKS_PER_BEAT;
      if (songBeat >= length) {
        stop();
        setActiveIndex(0);
        return;
      }
      const idx = notes.findIndex((n) => songBeat >= n.startBeat && songBeat < n.startBeat + n.beats);
      if (idx >= 0) setActiveIndex(idx);
    },
  });

  const preview = useCallback(
    (index: number) => {
      if (!hearNotes) return;
      const note = notes[index];
      playNote(pitchToMidi(note.pitch), getAudioContext().currentTime, 0.6);
    },
    [hearNotes, notes],
  );

  const goTo = useCallback(
    (index: number, silent = false) => {
      const clamped = Math.min(notes.length - 1, Math.max(0, index));
      setActiveIndex(clamped);
      if (!silent) preview(clamped);
    },
    [notes.length, preview],
  );

  const startPlayAlong = useCallback(() => {
    setActiveIndex(0);
    start();
  }, [start]);

  const stopPlayAlong = useCallback(() => {
    stop();
    setCountIn(null);
  }, [stop]);

  return {
    notes,
    activeIndex,
    countIn,
    playingAlong: running,
    next: () => goTo(activeIndex + 1),
    prev: () => goTo(activeIndex - 1),
    /** Step forward without playing the reference sound (used when the real keyboard made the sound). */
    nextSilent: () => goTo(activeIndex + 1, true),
    goTo,
    reset: () => {
      stopPlayAlong();
      setActiveIndex(0);
    },
    startPlayAlong,
    stopPlayAlong,
  };
}
