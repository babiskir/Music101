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

Pick a lesson from the dropdown (top right). Each one lists what you can do afterwards, and you can tick it
as done. Open one directly with `?lesson=<id>`, e.g. `http://localhost:5173/?lesson=reading-notes`.

| # | Lesson (id) | What you do |
|---|---|---|
| 1 | Meet the keyboard (`keyboard-basics`) | Black-key groups, middle C, find every C/D/E…; click keys to hear them |
| 2 | Find the key (`find-the-key`) | Note name → key and key → name quizzes with landmark hints |
| 3 | Hand & fingers (`hand-position`) | Five-finger position for both hands, "which finger?" quiz, finger drills |
| 4 | Feel the beat (`rhythm-basics`) | Count along with the metronome; rhythm patterns on a real staff |
| 5 | Reading notes (`reading-notes`) | A note appears on the staff, click the matching key |
| 6 | First songs (`first-songs`) | Ode to Joy and Twinkle Twinkle: step through or play along with sheet music, fingering and count-in |
| 7 | Mic check (`mic-check`) | Test the input, see the level, and see which note the app hears |

Lessons 1, 2, 3, 5 and 6 work with your connected keyboard (see below): answer, drill and play on the real piano.

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

The **Mic check** lesson can listen to the CT-S100 and show the note it hears (one note at a time).

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

## Saved data

Stored in this browser's localStorage under `music101.*` (never leaves your machine): lesson progress,
mic settings (noise gate, hum filter, "Hear it" volume, chosen input), all-time quiz counts, and per-lesson
settings (hand, tempo, options). **Reset everything** at the bottom of the page clears it. Use
`usePersistentState` (in `src/lib`) for any new setting you want remembered.

## Project structure

```
src/
  main.tsx              entry point
  app/                  App shell (lesson dropdown, goals, progress) + global styles
  domain/               pure TS, no React/DOM: notes & MIDI math, Song types, Instrument (CT-S100)
  data/songs/           songs as data (add a file + register it in index.ts)
  input/                PianoInput (shared keyboard connection: USB MIDI or mic), PianoBar,
                        noteTracker (pitch frames -> key presses), midi parsing
  audio/                Web Audio: click/note sounds, MetronomeEngine, microphone input,
                        YIN pitch detection, noise gate (AudioWorklet), input-device helpers
  lib/                  storage (localStorage wrapper), usePersistentState, lifetime quiz stats
  lessons/              one folder per lesson; registry.ts = dropdown order; useQuiz = shared quiz loop
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
- **A lesson:** add a folder in `src/lessons/`, export a component, and register it (with title, summary and
  goals) in `src/lessons/registry.ts`. Order in the registry is the order in the dropdown.

## Ideas for later

- Grade timing in play-along mode and the rhythm lesson (the key-press events already carry the moment of each note).
- Chords: the microphone path detects one note at a time; USB MIDI already delivers every key.
- Left-hand and two-hand songs, rests, chords.
- Looping a few bars and auto speed-up in song practice.
- Revisit the lesson folder format (see `docs/NOTES.md`).
