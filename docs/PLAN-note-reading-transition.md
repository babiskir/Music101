# Plan: a gentler road into reading notes

Status: **implemented 2026-11-23** (lessons 1-8 and the engine changes). Not hand-tested on the
CT-S100 yet. Decisions taken: do-re-mi is shown in the transition lessons only (no Settings switch
yet); the left hand / bass clef and notes below middle C are a later chapter; the old combined
lesson stayed as "Shortcuts and sharps" (id `reading-notes`, so saved progress survives).
Code: `src/lessons/content/reading.ts`, `src/guide/ChooseStepView.tsx`, `src/guide/labels.ts`.

## Problem

"Reading notes" jumps from letters to the full treble staff in one lesson: lines and spaces, then
"Every Good Boy Does Fine" and "FACE" mnemonics, up to two octaves. Too much at once. The learner
has to (1) decode a position on the staff, (2) via a mnemonic, (3) to a letter, (4) to a key.
Four mappings to hold in the head. We need a transition that adds ONE new idea at a time.

## Principles

1. One new idea per lesson. Never combine "new notes" with "new way of showing notes".
2. Start from what the hand already knows: the five-finger C position (C D E F G).
3. Teach **direction and distance before names**: higher/lower, step/skip. Position on the staff
   is the same idea as position on the keyboard.
4. **Scaffold, then fade**: letters (and do-re-mi) printed on the staff at first, then only on the
   first note, then nothing.
5. Mnemonics (EGBDF / FACE) become an optional "shortcut", taught LAST, not the entry point.
6. More tapping and playing, less reading text. Short rounds (3-5 prompts).

## New order of the curriculum

Move **Steps, skips and leaps** (already built) BEFORE reading. Then:

| # | Lesson | Idea added | Notes shown |
|---|---|---|---|
| 1 | Higher or lower? | Staff height = keyboard height. No names. | any |
| 2 | Do re mi (optional bridge) | Syllables for the five-finger position | C D E F G |
| 3 | Three notes on the staff | C, D, E with letters under the notes | C D E |
| 4 | Five notes on the staff | Add F, G: it is the hand position you know | C D E F G |
| 5 | Letters fade | Same notes, labels only on the first note, then none | C-G |
| 6 | Reach up and down | A, B, C above; B, A, G below middle C (left hand later) | C-C |
| 7 | Landmark notes | Anchors: middle C, the G the clef curls around, the C above. Read others as steps/skips from them | C-C |
| 8 | Mnemonics (shortcut) | EGBDF, FACE: optional, for finding any note fast | whole staff |
| 9 | Sharps (existing step, moved) | Black keys | C-C |

The existing "Reading notes" lesson is split into lessons 3-9 (its quiz steps are reused).

## Do re mi fa sol la si

- **Fixed do**: do = C always (matches the CT-S100 keys and the letter names). Sequence: do re mi
  fa sol la si do = C D E F G A B C. We use **si** (as requested), not "ti".
- Shown **next to** the letter, never instead of it: the learner sees "do · C".
- Used only in the transition lessons (1-5) as a singable handle: sing the note while playing it.
  Letters remain the main language everywhere else.
- Decision for later: a Settings switch "Show do-re-mi" (default on in the transition, remembered).

## Interactive, simpler exercises (what to build)

Reusing existing step kinds (no engine change):
- **Higher or lower**: "Play any key HIGHER than the lit one": `anyKey(label, match)` already
  supports this with a `match` function.
- **Echo**: a lit note on staff, play it; staff plus lit key, fading to staff only (`show.keys`).
- **Hand-position reading**: notes appear with the finger name (existing `fingerTarget`).
- **Fill the gap**: a four-note tune, one note missing; play the missing one.

Needs small engine additions:
1. **Labels on the staff**: print the letter (and optional do-re-mi) under each notehead.
   `StaffNotation` already imports VexFlow `Annotation`; add `labels?: 'none' | 'first' | 'all'` and
   `solfege?: boolean`. Step field: `show.labels`.
2. **Choice step** (`kind: 'choose'`): big buttons for tapping, mouse or touch:
   "Higher / Lower", "Step / Skip / Leap", "Which letter is this?". Also gives a no-piano fallback.
3. **Solfege notation** in `Notation` (`'name' | 'staff' | 'mixed'` + `'solfege'`), for quiz cards.
4. Optional later: **Ledger-line picture** for notes below the staff (middle C) with a short
   animation of the ledger line.

## Rules for the content tests

Keep the existing tests green: no octave numbers (C4), no digits in practice text. Add:
- every new reading lesson uses only the notes it announces (pool check);
- the label-fade steps appear in order: all, first, none;
- the registry puts Steps and skips before the first reading lesson.

## Order of work

1. Reorder registry (steps-and-skips before reading). 5 minutes.
2. Staff labels + solfege flag (engine change 1 and 3), tests.
3. Lessons 3-5 (C D E, C-G, fade) with labels. These are the heart of the fix.
4. Choice step (engine change 2), then lessons 1, 2, 6, 7.
5. Mnemonic lesson (8) as the last step; sharps (9) moved.
6. Hand-test every lesson on the CT-S100 (no automated browser runs).

## Open questions for the user

- Should "do re mi" be on by default, or only offered in Settings?
- Is the left hand (bass clef) a later chapter? Assumed yes.
- Keep the old combined "Reading notes" lesson as a "Review" at the end? Assumed yes (renamed).
