import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { normalizeLabel } from '../audio/micSettings';
import { useMicrophone, type MicFrame } from '../audio/useMicrophone';
import { storage, oneOf } from '../lib/storage';
import { connectMidi, type MidiConnection } from './midi';
import { createNoteTracker } from './noteTracker';

/** A key press on the connected keyboard. */
export interface NoteEvent {
  midi: number;
  source: 'midi' | 'mic';
  /** performance.now() when the press was detected. */
  time: number;
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
  /** Connect automatically: a MIDI keyboard if there is one, otherwise the microphone / line-in. */
  connect(): Promise<void>;
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
      if (midi !== null && !midiConnectedRef.current) emit({ midi, source: 'mic', time: performance.now() });
    },
    [emit],
  );
  const mic = useMicrophone({ onFrame });
  const micListening = mic.state.status === 'listening';
  useEffect(() => {
    if (!micListening) tracker.current.reset();
  }, [micListening]);

  /** Listens to MIDI (also for keyboards plugged in later). Resolves to how many inputs exist right now. */
  const listenMidi = useCallback(async (): Promise<number> => {
    let count = 0;
    try {
      midiRef.current?.dispose();
      midiRef.current = await connectMidi(
        (n) => emit({ midi: n.midi, source: 'midi', time: performance.now() }),
        (names) => {
          count = names.length;
          setMidiNames(names);
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open MIDI.');
    }
    return count;
  }, [emit]);

  const connectMidiNow = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'midi');
    if ((await listenMidi()) === 0) setError('No USB MIDI keyboard found. Plug the keyboard in with its USB cable.');
  }, [listenMidi]);

  const connectMicNow = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'mic');
    await mic.start();
  }, [mic]);

  const connectAuto = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'auto');
    if ((await listenMidi()) > 0) return; // a USB MIDI keyboard: exact notes, nothing else needed
    await mic.start(); // otherwise listen through the input (the cable into the mic jack)
  }, [listenMidi, mic]);

  /** Start-up version of "automatic": only asks for MIDI if the browser already allowed it (MIDI is rare). */
  const connectOnStartup = useCallback(
    async (pref: 'auto' | 'midi' | 'mic') => {
      const midiAllowed = async () => {
        try {
          return (await navigator.permissions.query({ name: 'midi' as PermissionName })).state === 'granted';
        } catch {
          return false;
        }
      };
      if (pref === 'mic') return mic.start();
      if (pref === 'midi' || (await midiAllowed())) {
        if ((await listenMidi()) > 0) return undefined;
      }
      return mic.start(); // the browser shows its one-time "allow microphone" question the first time
    },
    [listenMidi, mic],
  );

  const disconnect = useCallback(() => {
    midiRef.current?.dispose();
    midiRef.current = null;
    mic.stop();
    storage.set(PREF_KEY, 'none');
  }, [mic]);

  // On startup: connect by itself. Only a deliberate "Disconnect" in an earlier session stops this.
  const startedUp = useRef(false);
  useEffect(() => {
    if (startedUp.current) return; // React's development mode runs effects twice: connect only once
    startedUp.current = true;
    const pref = storage.get<'auto' | Source>(PREF_KEY, 'auto', oneOf('auto', 'none', 'midi', 'mic'));
    if (pref === 'none') return;
    void connectOnStartup(pref);
  }, [connectOnStartup]);

  useEffect(() => () => midiRef.current?.dispose(), []);

  // Development only: lets automated tests play notes without a real keyboard (window.__piano.emit(60)).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __piano?: { emit(midi: number): void } }).__piano = {
      emit: (midi) => emit({ midi, source: 'midi', time: performance.now() }),
    };
  }, [emit]);

  const subscribe = useCallback((h: (e: NoteEvent) => void) => {
    subscribers.current.add(h);
    return () => { subscribers.current.delete(h); };
  }, []);

  const source: Source = midiConnected ? 'midi' : micListening ? 'mic' : 'none';
  const value = useMemo<PianoContextValue>(
    () => ({
      source,
      connected: source !== 'none',
      deviceName: midiConnected
        ? midiNames.join(', ')
        : micListening && mic.state.deviceLabel
          ? normalizeLabel(mic.state.deviceLabel)
          : undefined,
      error,
      lastNote,
      connect: connectAuto,
      connectMidi: connectMidiNow,
      connectMic: connectMicNow,
      disconnect,
      subscribe,
      mic,
    }),
    [source, midiConnected, midiNames, micListening, mic, error, lastNote, connectAuto, connectMidiNow, connectMicNow, disconnect, subscribe],
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
