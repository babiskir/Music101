# Music101

A hands-on learning app for a beginner playing a **Casio Casiotone CT-S100** (61 keys, C2–C6). It shows
which key to press and with which finger, teaches reading real sheet music, has a metronome, and can
listen to the piano through the PC's microphone/line-in jack to detect the notes you play.

Built with Vite + React + TypeScript. Everything runs in the browser; nothing is uploaded or recorded.

## Getting started

Requirements: Node.js 20.19+ (developed on Node 24) and Edge or Chrome.

```
npm install
npm run dev        # http://localhost:5173
```

**In VS Code:** press the Run and Debug button (|>, or F5) and pick **Music101 (Edge)**. It starts the dev
server and opens the app in the browser (see `.vscode/launch.json`). Stopping the debug session stops
the server.

Other scripts: `npm run build` (typecheck + production build), `npm run typecheck`, `npm run preview`.

## Lessons

Lessons are **played on your piano**, not clicked on the screen. Each lesson is a guided session: the app tells you what
to play, shows it (keyboard, sheet music, finger numbers), listens, chimes when you are right and moves on by itself.
Playing any key is the "Next" button on read-and-continue screens. Quizzes show a note either as a **letter** (A to G,
with sharps like F#; any octave counts) or on the **staff** (exactly that key), or mixed, and never with octave numbers.
Clicking the on-screen keys still works if no keyboard is connected. The ← → keys on the PC keyboard go back / skip.

Menu bar: **Lessons** (pick a lesson, mark it done), **Keyboard** (connect / disconnect), **Tools** (metronome),
**Settings** (microphone & input, spoken instructions, reset saved data), **Help**. Open a lesson with `?lesson=<id>`.

| # | Lesson (id) | What you do on the piano |
|---|---|---|
| 1 | Meet the keyboard (`keyboard-basics`) | Black-key groups, any C, middle C, the white keys up and down |
| 2 | Find the note (`find-the-key`) | A letter or a staff note appears: play it; ends with mixed prompts |
| 3 | Hand & fingers (`hand-position`) | Five-finger position for both hands, finger drills with and without lit keys |
| 4 | Feel the beat (`rhythm-basics`) | Play any key on each note in time with the metronome; the app grades how steady you are |
| 5 | Reading notes (`reading-notes`) | Read notes on the staff and play them; ends with mixed prompts |
| 6 | Ode to Joy (`ode-to-joy`) | Learn it two bars at a time, then from the sheet music alone |
| 7 | Twinkle, Twinkle (`twinkle-twinkle`) | Same method; one new note for the pinky |

## Connecting your keyboard

The **🎹 Keyboard** bar under the title connects the app to your CT-S100 once; every lesson then reacts to
the keys you really press (quizzes check your answer, finger drills advance, songs wait for you and count
slips, the keyboard on screen lights up what you play). Two ways to connect:

- **USB (MIDI)**: plug the CT-S100's USB port into the PC. Exact notes, no guessing, and the piano's own
  speakers keep working. (Edge/Chrome ask for MIDI permission.)
- **Cable / microphone**: the piano's output into the PC's mic jack (or a microphone near the piano). The
  app detects the pitch of the single note you play, so play one note at a time.

It reconnects automatically next time if the browser already granted permission. Songs in *play along*
mode (metronome) are still just a guide; they don't grade your timing yet.

## Using the microphone / piano cable

**Settings → Microphone & input…** (or the Keyboard menu) can listen to the CT-S100 and show the note it hears (one note at a time).

- **Piano cable into the PC's mic jack:** works well, but plugging into the piano's output jack **mutes
  the piano's own speakers**. Tick **Hear it** to play the signal through the PC's speakers or headphones
  (expect a small delay). Turn the piano volume down to about half so the signal doesn't clip.
- **Noise gate + hum filter:** silences hiss between notes and removes 50 Hz mains hum. Click
  **Auto-set** and stay quiet for 2 seconds to measure your noise floor. These only affect what you
  hear; the level meter and note detection always use the raw signal.
- **Pick the right input.** Windows can list inputs that aren't microphones, such as **Stereo Mix**
  (records what the PC plays) or VR-headset devices. The app labels them and avoids them by default,
  but you can choose any input in the list.
- **Hear it** only comes back on for the input you enabled it on. With a real microphone next to
  speakers it would howl.
- Browser noise suppression, echo cancellation and auto-gain are deliberately off: they are built for speech
  and distort musical notes.

## Tests

```
npm test          # all tests, ~1 second
npm run test:watch
```

Tests are plain Node (Vitest): note detection, rhythm grading, quiz prompts, and every lesson's content (for example:
no octave numbers like "C4" anywhere in what the player sees). There is no browser, audio or real-time waiting in them,
so the whole suite stays fast. Keep it that way: test logic as pure functions, don't script a real browser.

## Saved data

Stored in this browser's localStorage under `music101.*` (never leaves your machine): lesson progress,
mic settings (noise gate, hum filter, "Hear it" volume, chosen input), all-time quiz counts, and per-lesson
settings (hand, tempo, options). **Reset everything** at the bottom of the page clears it. Use
`usePersistentState` (in `src/lib`) for any new setting you want remembered.

## Project structure

```
src/
  main.tsx              entry point
  app/                  App shell: MenuBar (Lessons / Keyboard / Settings / Help), goals, progress, global styles
  pages/                non-lesson screens reached from the menus: microphone & input settings, help
  domain/               pure TS, no React/DOM: notes & MIDI math, Song types, Instrument (CT-S100)
  data/songs/           songs as data (add a file + register it in index.ts)
  input/                PianoInput (shared keyboard connection: USB MIDI or mic), PianoStatus,
                        noteTracker (pitch frames -> key presses), midi parsing
  audio/                Web Audio: click/note sounds, MetronomeEngine, microphone input,
                        YIN pitch detection, noise gate (AudioWorklet), input-device helpers
  lib/                  storage (localStorage wrapper), usePersistentState, lifetime quiz stats
  lessons/              one folder per lesson; registry.ts = menu order; useQuiz = shared quiz loop
  features/             reusable widgets that lessons compose
    keyboard/           clickable Keyboard + range helper
    staff/              StaffNotation (real sheet music via VexFlow)
    metronome/          standalone Metronome UI + useMetronomeEngine hook
    practice/           SongPractice screen, useSongPlayer (step / play-along)
docs/NOTES.md           open design questions (e.g. the lesson folder format)
```

Rule of thumb: `domain`, `lib` and `audio` never import from `features` or `lessons`; `lessons` compose `features`.

## Adding things

- **A song:** create `src/data/songs/<name>.ts` exporting a `Song` (pitches like `"C4"`, length in beats,
  finger 1–5), then add it to the array in `src/data/songs/index.ts`.
- **A page** (settings/help-style screen): add a folder in `src/pages/`, register it in `src/pages/registry.ts`, and
  link to it from a menu in `src/app/App.tsx`. Open one directly with `?page=<id>` (e.g. `?page=mic-settings`).
- **A lesson:** add a folder in `src/lessons/`, export a component, and register it (with title, summary and
  goals) in `src/lessons/registry.ts`. Order in the registry is the order in the Lessons menu.

## Ideas for later

- Grade timing in play-along mode and the rhythm lesson (the key-press events already carry the moment of each note).
- Chords: the microphone path detects one note at a time; USB MIDI already delivers every key.
- Left-hand and two-hand songs, rests, chords.
- Looping a few bars and auto speed-up in song practice.
- Revisit the lesson folder format (see `docs/NOTES.md`).
