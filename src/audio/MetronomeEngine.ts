import { getAudioContext } from './audioContext';
import { playClick } from './sounds';

export interface Tick {
  /** 0-based count of ticks since start. */
  index: number;
  /** AudioContext time the tick sounds at. */
  time: number;
  /** Position in beats since start (fractional when ticksPerBeat > 1). */
  beat: number;
  isBeat: boolean;
  isDownbeat: boolean;
}

export interface MetronomeConfig {
  bpm: number;
  beatsPerBar: number;
  /** 1 = tick per beat; 2 = also tick on the "and" (needed for half-beat notes). */
  ticksPerBeat: number;
  /** Play the audible click on beats. */
  click: boolean;
  /** Fires ~100ms ahead of time with the exact audio time — use for scheduling sounds. */
  onSchedule?: (tick: Tick) => void;
  /** Fires when the tick is actually audible — use for UI updates. */
  onTick?: (tick: Tick) => void;
}

const LOOKAHEAD_S = 0.1;
const INTERVAL_MS = 25;

/**
 * Drift-free metronome using the Web Audio clock (setInterval alone is far too jittery).
 * Config is read on every tick, so BPM changes apply live.
 */
export class MetronomeEngine {
  private timer: number | null = null;
  private pending = new Set<number>();
  private nextTime = 0;
  private index = 0;

  constructor(private getConfig: () => MetronomeConfig) {}

  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.running) return;
    const ctx = getAudioContext();
    this.index = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.timer = window.setInterval(() => this.pump(), INTERVAL_MS);
    this.pump();
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.pending.forEach((id) => window.clearTimeout(id));
    this.pending.clear();
  }

  private pump(): void {
    const ctx = getAudioContext();
    while (this.running && this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const cfg = this.getConfig();
      const tick = this.makeTick(cfg);
      if (tick.isBeat && cfg.click) playClick(tick.time, tick.isDownbeat);
      cfg.onSchedule?.(tick);
      const delay = Math.max(0, (tick.time - ctx.currentTime) * 1000);
      const id = window.setTimeout(() => {
        this.pending.delete(id);
        this.getConfig().onTick?.(tick);
      }, delay);
      this.pending.add(id);
      this.nextTime += 60 / cfg.bpm / cfg.ticksPerBeat;
      this.index++;
    }
  }

  private makeTick(cfg: MetronomeConfig): Tick {
    const isBeat = this.index % cfg.ticksPerBeat === 0;
    const beat = this.index / cfg.ticksPerBeat;
    return {
      index: this.index,
      time: this.nextTime,
      beat,
      isBeat,
      isDownbeat: isBeat && beat % cfg.beatsPerBar === 0,
    };
  }
}
