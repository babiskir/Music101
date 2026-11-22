# Project notes

## TODO: revisit the lesson folder format

Lessons currently live in `src/lessons/<lesson-id>/<LessonName>.tsx` and are registered by hand in
`src/lessons/registry.ts` (dropdown order = learning order). Each lesson is a React component that owns
its layout and composes widgets from `src/features/`. This was a first guess; things to reconsider:

- Should lessons be pure data (lesson text + exercises) rendered by a few shared layouts, instead of
  one hand-written component per lesson? Cheaper to add many lessons, less layout freedom.
- Where do per-lesson content (explanations, exercise lists) and progress tracking live?
- Grouping: levels/units (e.g. "Prep", "First songs") once there are more than ~6 lessons.
- `src/features/practice` (SongPractice) is really the body of the "First songs" lesson; maybe it
  should move under `src/lessons/first-songs/`.
- Songs (`src/data/songs`) vs. exercises (rhythm patterns are currently inline in RhythmBasics).
