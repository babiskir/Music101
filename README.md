# Music101

A practical learning tool for playing songs on a Casio CT-S100 (61 keys, C2–C6): shows which key to
press, with which finger, plus a metronome. Built with Vite + React + TypeScript.

```
npm install
npm run dev
```

## Structure

```
src/
  main.tsx              entry point
  app/                  App shell + global styles
  domain/               pure TS, no React/DOM: notes & MIDI math, Song types, Instrument definition
  data/songs/           songs as data (add a file + register it in index.ts)
  audio/                Web Audio: AudioContext, click/note sounds, drift-free MetronomeEngine
  lessons/              one folder per lesson; registry.ts = dropdown order
  features/             reusable widgets that lessons compose
    keyboard/           clickable Keyboard + range helper
    staff/              StaffNotation (real sheet music via VexFlow)
    metronome/          standalone Metronome UI + useMetronomeEngine hook
    practice/           SongPractice screen, useSongPlayer (step / play-along)
```

Lessons (dropdown, top right): Meet the keyboard, Find the key, Hand & fingers, Feel the beat, Reading notes, First songs. Each lesson lists its goals and can be ticked as done.
Open one directly with `?lesson=<id>`, e.g. `http://localhost:5173/?lesson=reading-notes`.
See [docs/NOTES.md](docs/NOTES.md) for open design questions (lesson folder format).

Rule of thumb: `domain` and `audio` never import from `features`/`lessons`; `lessons` compose `features`.

## Adding a song

Create `src/data/songs/<name>.ts` exporting a `Song` (pitches like `"C4"`, length in beats, finger 1–5),
then add it to the array in `src/data/songs/index.ts`.

## Ideas for later

- Web MIDI: the CT-S100 sends notes over USB, so the app could detect which key you pressed and check it live.
- Left hand / two-hand songs, rests, chords.
- Progress tracking (loop a few bars, auto-speed-up).
