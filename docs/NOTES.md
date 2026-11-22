# Project notes

## TODO: revisit the class folder format

Classes currently live in `src/classes/<class-id>/<ClassName>.tsx` and are registered by hand in
`src/classes/registry.ts` (dropdown order = learning order). Each class is a React component that owns
its layout and composes widgets from `src/features/`. This was a first guess; things to reconsider:

- Should classes be pure data (lesson text + exercises) rendered by a few shared layouts, instead of
  one hand-written component per class? Cheaper to add many lessons, less layout freedom.
- Where do per-class content (explanations, exercise lists) and progress tracking live?
- Grouping: levels/units (e.g. "Prep", "First songs") once there are more than ~6 classes.
- `src/features/practice` (SongPractice) is really the body of the "First songs" class; maybe it
  should move under `src/classes/first-songs/`.
- Songs (`src/data/songs`) vs. exercises (rhythm patterns are currently inline in RhythmBasics).
