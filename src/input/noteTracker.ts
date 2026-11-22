/**
 * Turns the microphone's stream of "what pitch is sounding right now" frames into discrete
 * "a key was pressed" events, the way a MIDI note-on would arrive.
 *
 * A key press is detected when:
 *  - sound starts after silence, or
 *  - the detected pitch changes to another note, or
 *  - the SAME note is struck again (the level jumps up while the previous note is still fading),
 *    which is what makes repeated notes like E-E in Ode to Joy work.
 */
export interface TrackerConfig {
  /** Below this level (dB) the room counts as silent. */
  gateDb: number;
  /** How much the level must jump to count as a new strike of the same note. */
  reattackDb: number;
  /** After a detected press, ignore re-strikes for this long (the level is still ramping up). */
  holdMs: number;
}

export const DEFAULT_TRACKER: TrackerConfig = { gateDb: -45, reattackDb: 6, holdMs: 200 };

export function createNoteTracker(cfg: TrackerConfig = DEFAULT_TRACKER) {
  let active: number | null = null;
  let floorDb = -100; // lowest level since the last press (follows a fading note down)
  let holdUntil = -Infinity;

  return {
    /** Feed one frame. Returns the MIDI note if a new key press was detected, else null. */
    push(db: number, midi: number | null, nowMs: number): number | null {
      if (db < cfg.gateDb) {
        active = null;
        floorDb = db;
        return null;
      }
      const held = nowMs < holdUntil;
      // While a fresh attack is still ramping up, the reference follows the level; afterwards it
      // only ever moves down, following the fade, so a later jump up means a new strike.
      floorDb = held ? db : Math.min(floorDb, db);
      if (midi === null) return null; // loud but no clear pitch (a transient): keep waiting

      const struckAgain = !held && midi === active && db - floorDb > cfg.reattackDb;
      const isNew = active === null || midi !== active;
      active = midi;

      if (isNew || struckAgain) {
        if (held && !isNew) return null;
        holdUntil = nowMs + cfg.holdMs;
        floorDb = db;
        return midi;
      }
      return null;
    },
    reset() {
      active = null;
      floorDb = -100;
      holdUntil = -Infinity;
    },
  };
}
