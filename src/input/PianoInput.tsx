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
  /** True when a keyboard WAS connected in this session and has disappeared (switched off, unplugged). It reconnects by itself. */
  lost: boolean;
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
const SAME_PRESS_MS = 60;

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

  // One key press can reach us twice: a USB keyboard can show up as two MIDI ports that both send it.
  // Nobody strikes the same key twice within this time, so a repeat that quick is the same press.
  const lastEmit = useRef<{ midi: number; time: number } | null>(null);
  const emit = useCallback((e: NoteEvent) => {
    const prev = lastEmit.current;
    if (e.source === 'midi' && prev && prev.midi === e.midi && e.time - prev.time < SAME_PRESS_MS) return;
    lastEmit.current = { midi: e.midi, time: e.time };
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
  const listening = useRef<Promise<number> | null>(null);
  const listenMidi = useCallback((): Promise<number> => {
    // While the browser's "allow MIDI" question is open, the page regains focus when it closes, which
    // used to start a second, competing connection. Share the one in progress instead.
    if (listening.current) return listening.current;
    const run = async (): Promise<number> => {
      let count = 0;
      try {
        midiRef.current?.dispose();
        midiRef.current = null;
        midiRef.current = await connectMidi(
          (n) => emit({ midi: n.midi, source: 'midi', time: performance.now() }),
          (names) => {
            count = names.length;
            setMidiNames(names);
          },
          setError,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not open MIDI.');
      }
      return count;
    };
    listening.current = run().finally(() => { listening.current = null; });
    return listening.current;
  }, [emit]);

  const connectMidiNow = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'midi');
    if ((await listenMidi()) === 0) setError('No USB MIDI keyboard found. Plug the keyboard in with its USB cable.');
    else mic.stop(); // switching from the microphone: USB gives exact notes, the mic is not needed
  }, [listenMidi, mic]);

  const connectMicNow = useCallback(async () => {
    setError(undefined);
    storage.set(PREF_KEY, 'mic');
    midiRef.current?.dispose(); // switching from USB: otherwise MIDI would keep winning
    midiRef.current = null;
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
      // Try USB MIDI first unless the browser was told to block it. (Only trying when MIDI was already
      // allowed meant a USB-only keyboard silently ended up on the PC's microphone, which hears nothing.)
      const midiPossible = async () => {
        if (!('requestMIDIAccess' in navigator)) return false;
        try {
          return (await navigator.permissions.query({ name: 'midi' as PermissionName })).state !== 'denied';
        } catch {
          return true;
        }
      };
      // Even when the microphone was chosen before, a keyboard plugged in with USB wins: exact notes.
      if (pref === 'midi' || (await midiPossible())) {
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

  // Remember that a keyboard was there, so "it went away" can be told apart from "never connected".
  const [everConnected, setEverConnected] = useState(false);
  useEffect(() => {
    if (source !== 'none') setEverConnected(true);
  }, [source]);
  const lost = everConnected && source === 'none';

  // Coming back to the page (after a class break, the keyboard may have switched itself off and on):
  // if nothing is connected, look again. Switching the keyboard on is detected by the browser too.
  const connectedRef = useRef(false);
  connectedRef.current = source !== 'none';
  useEffect(() => {
    const look = () => {
      if (document.visibilityState === 'hidden' || connectedRef.current) return;
      if (mic.state.status === 'requesting') return;
      const pref = storage.get<'auto' | Source>(PREF_KEY, 'auto', oneOf('auto', 'none', 'midi', 'mic'));
      if (pref !== 'none') void connectOnStartup(pref);
    };
    window.addEventListener('focus', look);
    document.addEventListener('visibilitychange', look);
    return () => {
      window.removeEventListener('focus', look);
      document.removeEventListener('visibilitychange', look);
    };
  }, [connectOnStartup, mic.state.status]);
  const value = useMemo<PianoContextValue>(
    () => ({
      source,
      connected: source !== 'none',
      lost,
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
    [source, lost, midiConnected, midiNames, micListening, mic, error, lastNote, connectAuto, connectMidiNow, connectMicNow, disconnect, subscribe],
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
