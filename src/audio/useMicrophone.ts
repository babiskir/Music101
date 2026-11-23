import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioContext } from './audioContext';
import { betterInput } from './micDevices';
import { loadMicSettings, normalizeLabel, saveMicSettings, type Cleanup } from './micSettings';
import { loadNoiseGate } from './noiseGate';
import { detectPitch, frequencyToNote, rms } from './pitch';

export type MicStatus = 'idle' | 'requesting' | 'listening' | 'error';

export interface MicState {
  status: MicStatus;
  error?: string;
  /** Name of the input the browser actually opened. */
  deviceLabel?: string;
  /** deviceId of the open input (matches the Input list). */
  deviceId?: string;
  /** True when an input that was working disappeared (e.g. the keyboard switched itself off). We keep trying to get it back. */
  lost?: boolean;
  /** Set when the app skipped a non-microphone default input in favour of a real one. */
  switchedFrom?: string;
  /** Level in dB (about -100 silence .. 0 clipping). */
  db: number;
  /** Highest dB seen since start / reset. */
  peakDb: number;
  /** Detected note, if there is a clear single pitch right now. */
  note: { midi: number; cents: number; freq: number } | null;
}

/** One analysis frame (~20 per second): the level and, if there is a clear single pitch, its MIDI note. */
export interface MicFrame {
  db: number;
  midi: number | null;
  now: number;
}

interface Monitor {
  on: boolean;
  volume: number;
}

const IDLE: MicState = { status: 'idle', db: -100, peakDb: -100, note: null };
const SOUND_GATE_DB = -45; // below this we don't even try to detect a pitch
const UPDATE_MS = 25; // fast enough to catch quick repeated notes
const RETRY_LOST_MS = 2500; // how often to try again while the input is gone
const LOST_MESSAGE =
  'The input disappeared. Is the keyboard switched off (it may have turned itself off)? Switch it on again: the app reconnects by itself.';

function describeError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError') return 'The browser blocked microphone access. Click the lock/camera icon in the address bar, allow the microphone, and press Start again.';
  if (name === 'NotFoundError') return 'No microphone found. Check the plug (headsets need a combo jack or the pink mic jack) and try again.';
  if (name === 'NotReadableError') return 'The microphone is in use by another app. Close it and try again.';
  return e instanceof Error ? e.message : 'Could not start the microphone.';
}

function applyCleanup(
  r: { hp: BiquadFilterNode; notch: BiquadFilterNode; gate: AudioWorkletNode | null },
  c: Cleanup,
) {
  r.hp.frequency.value = c.hum ? 40 : 1;
  r.notch.type = c.hum ? 'notch' : 'allpass';
  if (r.gate) {
    r.gate.parameters.get('enabled')!.value = c.gate ? 1 : 0;
    r.gate.parameters.get('threshold')!.value = c.thresholdDb;
  }
}

/**
 * Opens the microphone and reports level + detected pitch ~20 times per second.
 * Settings (noise gate, hum filter, "Hear it" volume, chosen input) are remembered between visits.
 */
export function useMicrophone(options: { onFrame?: (frame: MicFrame) => void } = {}) {
  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;
  const [state, setState] = useState<MicState>(IDLE);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const resources = useRef<{
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
    hp: BiquadFilterNode;
    notch: BiquadFilterNode;
    gate: AudioWorkletNode | null;
    monitorGain: GainNode;
    raf: number;
  } | null>(null);
  const deviceLabelRef = useRef<string | undefined>(undefined);
  const startToken = useRef(0); // counts start() calls, so an outdated one can cancel itself
  const lostRef = useRef(false); // an input that was working has disappeared

  // "Hear it": play the input through the PC's speakers/headphones. Starts off, and comes back on only
  // for the same input it was switched on for (a real mic next to speakers would howl).
  const [monitor, setMonitorState] = useState<Monitor>(() => ({ on: false, volume: loadMicSettings().volume }));
  const monitorRef = useRef(monitor);
  monitorRef.current = monitor;
  useEffect(() => {
    const r = resources.current;
    if (r) r.monitorGain.gain.setTargetAtTime(monitor.on ? monitor.volume : 0, r.monitorGain.context.currentTime, 0.02);
  }, [monitor]);

  const setVolume = useCallback((volume: number) => {
    setMonitorState((m) => ({ ...m, volume }));
    saveMicSettings({ volume });
  }, []);

  /** Turn "Hear it" on/off, and remember which input it was for. */
  const setHearIt = useCallback((on: boolean) => {
    setMonitorState((m) => ({ ...m, on }));
    const label = deviceLabelRef.current;
    saveMicSettings({ hearItInput: on && label ? normalizeLabel(label) : null });
  }, []);

  // Cleanup for the "Hear it" path only (the level meter and note detection always see the raw signal).
  //  - gate: silences hiss/noise between notes
  //  - hum: removes rumble below the keyboard's lowest note (C2 = 65 Hz) and the 50 Hz mains hum
  const [cleanup, setCleanupState] = useState<Cleanup>(() => loadMicSettings().cleanup);
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;
  const [calibrating, setCalibrating] = useState(false);
  const calibRef = useRef<{ end: number; maxDb: number } | null>(null);

  const setCleanup = useCallback((update: (c: Cleanup) => Cleanup) => {
    setCleanupState((c) => {
      const next = update(c);
      saveMicSettings({ cleanup: next });
      return next;
    });
  }, []);

  useEffect(() => {
    const r = resources.current;
    if (r) applyCleanup(r, cleanup);
  }, [cleanup]);

  /** Listen to 1.5 s of background noise (don't play!) and set the gate just above it. */
  const calibrate = useCallback(() => {
    calibRef.current = { end: performance.now() + 1500, maxDb: -100 };
    setCalibrating(true);
  }, []);

  /** Forget the remembered input, so the browser's default is used next time. */
  const forgetInput = useCallback(() => saveMicSettings({ inputLabel: null }), []);

  const stop = useCallback(() => {
    const r = resources.current;
    if (r) {
      cancelAnimationFrame(r.raf);
      r.source.disconnect();
      r.hp.disconnect();
      r.notch.disconnect();
      r.gate?.disconnect();
      r.monitorGain.disconnect();
      calibRef.current = null;
      setCalibrating(false);
      r.stream.getTracks().forEach((t) => t.stop());
      resources.current = null;
    }
    setState(IDLE);
  }, []);

  const start = useCallback(
    async (deviceId?: string, switchedFrom?: string, restored = false) => {
      stop();
      const token = ++startToken.current;
      setState({ ...IDLE, status: 'requesting', lost: lostRef.current });
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            // Processing built for speech would mangle musical notes.
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        if (token !== startToken.current) {
          stream.getTracks().forEach((t) => t.stop()); // a newer start() took over
          return;
        }
        // Labels are only available after permission was granted.
        const inputs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
        setDevices(inputs);

        const track = stream.getAudioTracks()[0];
        const saved = loadMicSettings();
        const isAlias = (d: MediaDeviceInfo) => d.deviceId === 'default' || d.deviceId === 'communications';

        // 1. Go back to the input picked last time, if it's still plugged in.
        if (!deviceId && !restored && saved.inputLabel && track && normalizeLabel(track.label) !== saved.inputLabel) {
          const wanted = inputs.find((d) => !isAlias(d) && normalizeLabel(d.label) === saved.inputLabel);
          if (wanted) {
            stream.getTracks().forEach((t) => t.stop());
            void start(wanted.deviceId, undefined, true);
            return;
          }
        }

        // 2. The browser's default may be Stereo Mix or a VR device. If so, switch to a real mic (once),
        //    unless the user deliberately picked this input before.
        const chosenByUser = !!saved.inputLabel && !!track && normalizeLabel(track.label) === saved.inputLabel;
        if (!deviceId && !switchedFrom && !chosenByUser && track) {
          const better = betterInput(inputs, track.getSettings().deviceId, track.label);
          if (better) {
            stream.getTracks().forEach((t) => t.stop());
            void start(better.deviceId, track.label);
            return;
          }
        }

        const label = track?.label;
        deviceLabelRef.current = label;
        const norm = label ? normalizeLabel(label) : null;
        if (deviceId && !switchedFrom && norm) saveMicSettings({ inputLabel: norm }); // an explicit pick

        const ctx = getAudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.Q.value = 0.7;
        const notch = ctx.createBiquadFilter();
        notch.frequency.value = 50; // mains hum (Europe)
        notch.Q.value = 12;
        let tail: AudioNode = source.connect(hp).connect(notch);
        let gate: AudioWorkletNode | null = null;
        try {
          await loadNoiseGate(ctx);
          gate = new AudioWorkletNode(ctx, 'noise-gate');
          tail = tail.connect(gate);
        } catch {
          /* worklets unavailable: monitor works, just without the gate */
        }
        if (token !== startToken.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // "Hear it" is only on for the input it was switched on for.
        const hearIt = !!norm && saved.hearItInput === norm;
        setMonitorState((m) => ({ ...m, on: hearIt }));
        const monitorGain = ctx.createGain();
        monitorGain.gain.value = hearIt ? monitorRef.current.volume : 0;
        tail.connect(monitorGain).connect(ctx.destination);

        const buf = new Float32Array(analyser.fftSize);

        let peak = -100;
        let lastUpdate = 0;
        let lastMidi: number | null = null;
        let stableCount = 0;

        const loop = (now: number) => {
          const r = resources.current;
          if (!r) return;
          r.raf = requestAnimationFrame(loop);
          if (now - lastUpdate < UPDATE_MS) return;
          lastUpdate = now;

          analyser.getFloatTimeDomainData(buf);
          const level = rms(buf);
          const db = level > 0 ? 20 * Math.log10(level) : -100;
          peak = Math.max(peak, db);

          const calib = calibRef.current;
          if (calib) {
            let top = 0;
            for (let i = 0; i < buf.length; i++) top = Math.max(top, Math.abs(buf[i]));
            calib.maxDb = Math.max(calib.maxDb, top > 0 ? 20 * Math.log10(top) : -100);
            if (now >= calib.end) {
              calibRef.current = null;
              const thresholdDb = Math.round(Math.min(-20, Math.max(-80, calib.maxDb + 4)));
              setCleanup((c) => ({ ...c, gate: true, thresholdDb }));
              setCalibrating(false);
            }
          }

          let note: MicState['note'] = null;
          if (db > SOUND_GATE_DB) {
            const freq = detectPitch(buf, ctx.sampleRate);
            if (freq) {
              const n = frequencyToNote(freq);
              // Require the same note twice in a row to avoid flicker.
              stableCount = n.midi === lastMidi ? stableCount + 1 : 1;
              lastMidi = n.midi;
              if (stableCount >= 2) note = { ...n, freq };
            }
          } else {
            lastMidi = null;
            stableCount = 0;
          }
          onFrameRef.current?.({ db, midi: note ? note.midi : null, now });
          setState({
            status: 'listening',
            deviceLabel: label,
            deviceId: track?.getSettings().deviceId,
            switchedFrom,
            db,
            peakDb: peak,
            note,
          });
        };

        resources.current = { stream, source, hp, notch, gate, monitorGain, raf: requestAnimationFrame(loop) };
        applyCleanup(resources.current, cleanupRef.current);
        lostRef.current = false;

        // The input vanished (device unplugged or powered off): say so, and let the retry below reconnect.
        track?.addEventListener('ended', () => {
          if (token !== startToken.current) return; // a newer start() took over
          lostRef.current = true;
          stop();
          setState({ ...IDLE, status: 'error', lost: true, error: LOST_MESSAGE });
        });
      } catch (e) {
        if (lostRef.current) setState({ ...IDLE, status: 'error', lost: true, error: LOST_MESSAGE });
        else setState({ ...IDLE, status: 'error', error: describeError(e) });
      }
    },
    [stop, setCleanup],
  );

  useEffect(() => stop, [stop]);

  // While the input is gone, try to get it back: when the browser reports a device change, and every few seconds.
  const lost = state.lost === true && state.status === 'error';
  useEffect(() => {
    if (!lost) return;
    const retry = () => void start();
    const id = window.setInterval(retry, RETRY_LOST_MS);
    navigator.mediaDevices?.addEventListener('devicechange', retry);
    return () => {
      window.clearInterval(id);
      navigator.mediaDevices?.removeEventListener('devicechange', retry);
    };
  }, [lost, start]);

  return {
    state, devices, start, stop,
    monitor, setVolume, setHearIt,
    cleanup, setCleanup, calibrate, calibrating,
    forgetInput,
  };
}
