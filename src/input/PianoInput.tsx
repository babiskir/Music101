import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { useMicrophone, type MicFrame } from '../audio/useMicrophone';
import { storage, oneOf } from '../lib/storage';
import { connectMidi, type MidiConnection } from './midi';
import { createNoteTracker } from './noteTracker';

/** A key press on the connected keyboard. */
export interface NoteEvent {
  midi: number;
  source: 'midi' | 'mic';
}

type Source = 'none' | 'midi' | 'mic';
type Mic = ReturnType<typeof useMicrophone>;

interface PianoContextValue {
  /** Where notes currently come from. MIDI wins if both are connected. */
  source: Source;
  connected: boolean;
  /** Human-readable name of the connected device(s). */
  deviceName?: string;
  error?: string;
  /** Most recent key press (for the status bar). */
  lastNote: (NoteEvent & { n: number }) | null;
  connectMidi(): Promise<void>;
  connectMic(): Promise<void>;
  disconnect(): void;
  subscribe(handler: (e: NoteEvent) => void): () => void;
  /** The shared microphone (used by the Microphone & input settings page for levels and settings). */
  mic: Mic;
}

const PianoContext = createContext<PianoContextValue | null>(null);
const PREF_KEY = 'input.source';

/**
 * One shared connection to the player's keyboard, so every lesson can react to real key presses.
 * Two ways in: USB MIDI (exact notes) or the microphone / line-in jack (pitch detection).
 */
export function PianoInputProvider({ children }: { children: ReactNode }) {
  const subscribers = useRef(new Set<(e: NoteEvent) => void>());
  const midiRef = useRef<MidiConnection | null>(null);
  const [midiNames, setMidiNames] = useState<string[]>([]);
  const midiConnected = midiNames.length > 0;
  const midiConnectedRef = useRef(false);
  midiConnectedRef.current = midiConnected;
  const [error, setError] = useState<string | undefined>();
  const [lastNote, setLastNote] = useState<PianoContextValue['lastNote']>(null);
  const counter = useRef(0);

  const emit = useCallback((e: NoteEvent) => {
    setLastNote({ ...e, n: ++counter.current });
    subscribers.current.forEach((h) => h(e));
  }, []);

  // Microphone path: pitch frames -> key-press events (ignored while MIDI is connected).
  const tracker = useRef(createNoteTracker());
  const onFrame = useCallback(
    (f: MicFrame) => {
      const midi = tracker.current.push(f.db, f.midi, f.now);
      if (midi !== null && !midiConnectedRef.current) emit({ midi, source: 'mic' });
    },
    [emit],
  );
  const mic = useMicrophone({ onFrame });
  const micListening = mic.state.status === 'listening';
  useEffect(() => {
    if (!micListening) tracker.current.reset();
  }, [micListening]);

  const connectMidiNow = useCallback(async () => {
    setError(undefined);
    try {
      midiRef.current?.dispose();
      midiRef.current = await connectMidi((n) => emit({ midi: n.midi, source: 'midi' }), setMidiNames);
      storage.set(PREF_KEY, 'midi');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open MIDI.');
    }
  }, [emit]);

  const connectMicNow = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'mic');
    await mic.start();
  }, [mic]);

  const disconnect = useCallback(() => {
    midiRef.current?.dispose();
    midiRef.current = null;
    mic.stop();
    storage.set(PREF_KEY, 'none');
  }, [mic]);

  // Reconnect automatically next time, if the browser already granted the permission.
  useEffect(() => {
    const pref = storage.get<Source>(PREF_KEY, 'none', oneOf('none', 'midi', 'mic'));
    if (pref === 'none') return;
    const permission = pref === 'mic' ? 'microphone' : 'midi';
    navigator.permissions
      ?.query({ name: permission as PermissionName })
      .then((p) => {
        if (p.state === 'granted') void (pref === 'mic' ? connectMicNow() : connectMidiNow());
      })
      .catch(() => { /* permission API unavailable: user connects manually */ });
    // run once on startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => midiRef.current?.dispose(), []);

  const subscribe = useCallback((h: (e: NoteEvent) => void) => {
    subscribers.current.add(h);
    return () => { subscribers.current.delete(h); };
  }, []);

  const source: Source = midiConnected ? 'midi' : micListening ? 'mic' : 'none';
  const value = useMemo<PianoContextValue>(
    () => ({
      source,
      connected: source !== 'none',
      deviceName: midiConnected ? midiNames.join(', ') : micListening ? mic.state.deviceLabel : undefined,
      error,
      lastNote,
      connectMidi: connectMidiNow,
      connectMic: connectMicNow,
      disconnect,
      subscribe,
      mic,
    }),
    [source, midiConnected, midiNames, micListening, mic, error, lastNote, connectMidiNow, connectMicNow, disconnect, subscribe],
  );

  return <PianoContext.Provider value={value}>{children}</PianoContext.Provider>;
}

export function usePiano(): PianoContextValue {
  const ctx = useContext(PianoContext);
  if (!ctx) throw new Error('usePiano must be used inside <PianoInputProvider>');
  return ctx;
}

/** The key most recently played on the connected keyboard, for a short time (to flash it on screen). */
export function usePlayedKey(ms = 700): number | null {
  const [midi, setMidi] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  usePianoNotes((e) => {
    setMidi(e.midi);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMidi(null), ms);
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return midi;
}

/** Call `handler` for every key press on the connected keyboard (always the latest handler). */
export function usePianoNotes(handler: (e: NoteEvent) => void): void {
  const { subscribe } = usePiano();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe]);
}
