import { storage } from '../lib/storage';

export interface Cleanup {
  gate: boolean;
  thresholdDb: number;
  hum: boolean;
}

export interface MicSettings {
  cleanup: Cleanup;
  /** "Hear it" volume, 0..1. */
  volume: number;
  /**
   * Input that "Hear it" was switched on for. It only comes back on for that same input, because
   * with a real microphone (instead of a cable) it would feed back and howl.
   */
  hearItInput: string | null;
  /** Input the user picked last time. */
  inputLabel: string | null;
}

export const DEFAULT_MIC: MicSettings = {
  cleanup: { gate: true, thresholdDb: -50, hum: true },
  volume: 0.8,
  hearItInput: null,
  inputLabel: null,
};

/** Browsers add "Default - " / "Communications - " aliases in front of the real device name. */
export function normalizeLabel(label: string): string {
  return label.replace(/^(Default|Communications) - /, '');
}

const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fallback;
const str = (v: unknown) => (typeof v === 'string' && v ? v : null);

/** Reads saved settings, field by field, ignoring anything malformed. */
export function loadMicSettings(): MicSettings {
  const raw = storage.get<unknown>('mic', {});
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const c = (typeof obj.cleanup === 'object' && obj.cleanup !== null ? obj.cleanup : {}) as Record<string, unknown>;
  return {
    cleanup: {
      gate: typeof c.gate === 'boolean' ? c.gate : DEFAULT_MIC.cleanup.gate,
      thresholdDb: num(c.thresholdDb, -100, 0, DEFAULT_MIC.cleanup.thresholdDb),
      hum: typeof c.hum === 'boolean' ? c.hum : DEFAULT_MIC.cleanup.hum,
    },
    volume: num(obj.volume, 0, 1, DEFAULT_MIC.volume),
    hearItInput: str(obj.hearItInput),
    inputLabel: str(obj.inputLabel),
  };
}

export function saveMicSettings(patch: Partial<MicSettings>): void {
  storage.set('mic', { ...loadMicSettings(), ...patch });
}
