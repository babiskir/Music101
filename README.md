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
Playing any key is the "Next" button on read-and-continue screens. Quizzes show a note either by **name** (Do Re Mi
Fa Sol La Si, with sharps like Fa♯; any octave counts) or on the **staff** (exactly that key), or mixed, and never with
octave numbers.

**Note names** come in two kinds with equal weight: fixed do (Do = C) and the letters. Keys, staff labels, prompts and
texts show both ("Do (C)"); written quiz prompts show one at a time, half of them each. Inside the code, pitches are
written with letters (`"C4"`).
Clicking the on-screen keys still works if no keyboard is connected. The ← → keys on the PC keyboard go back / skip.

Menu bar: **Lessons** (pick a lesson, mark it done), **Practice** (the games below), **Keyboard** (connect / disconnect), **Tools** (metronome),
**Settings** (microphone & input, spoken instructions, reset saved data), **Help**. Open a lesson with `?lesson=<id>`.

| # | Lesson (id) | What you do on the piano |
|---|---|---|
| 1 | Meet the keyboard (`keyboard-basics`) | Black-key groups, any Do (C), middle Do, the white keys up and down |
| 2 | Find the note (`find-the-key`) | A note name or a staff note appears: play it; ends with mixed prompts |
| 3 | Hand & fingers (`hand-position`) | Five-finger position for both hands, finger drills with and without lit keys |
| 4 | Feel the beat (`rhythm-basics`) | Play any key on each note in time with the metronome; the app grades how steady you are |
| 5 | Bars and time signatures (`bars-and-meter`) | 4/4 and 3/4, eighth notes, dotted half and dotted quarter notes |
| 6 | Rests (`rests`) | Quarter, half and whole rests; starting after a rest |
| 7 | Steps, skips and leaps (`steps-and-skips`) | Melodies as shapes, on the keys and on the staff |
| 8–12 | The road into reading (`higher-or-lower` … `read-short-tunes`) | Higher or lower, do re mi, three then five notes on the staff, short tunes |
| 13–17 | Songs and more notes | Mary, Ode to Joy, La Si Do above Sol, Twinkle, Jingle Bells |
| 18–19 | Landmarks, shortcuts and sharps (`staff-landmarks`, `reading-notes`) | Read any note from three anchors; mnemonics; black keys |
| 20–21 | New positions, first chords (`new-positions`, `chords`) | Sol position, the scale with thumb-under, Do / Fa / Sol chords |
| 22 | The bass clef (`bass-clef`) | The left hand's staff: Do Re Mi, then Fa Sol, names fading |
| 23 | Left-hand tunes (`left-hand-tunes`) | Bass-staff landmarks, then four tunes with the left hand |
| 24 | The grand staff (`grand-staff`) | Which hand plays a note; the two hands taking turns |
| 25 | Hands together (`hands-together`) | Thumbs, pinkies, both hands moving together; Mary and Ode to Joy with a left-hand bass note |

## Practice games

The **Practice** menu has short 3D games that revisit the lessons (drawn with three.js, loaded only when you play). Like the
lessons they are played on your piano; clicking the 3D keys works too. Each has levels, 0 to 3 stars and a best score kept in
this browser. Open one directly with `?page=game-<id>`.

| Game (id) | Practises | What you do |
|---|---|---|
| 💎 Note Rain (`note-rain`) | Find the note, do-re-mi, reading the staff, sharps | Gems with a note name or a staff note fall; play the lowest one's key before it lands. 3 lives |
| 🥁 Rhythm Road (`rhythm-road`) | Feel the beat, bars and meter | Orbs roll toward a glowing line; press any key as each one touches it. Graded perfect / good / miss; the game learns your usual delay, so a microphone works |
| 🔓 Chord Lock (`chord-lock`) | Your first chords | A chord name (Do/C, Fa/F, Sol/G) appears: play its three notes in any order and octave, against the clock on later levels |
| 🐸 Hop Along (`hop-along`) | Steps, skips and leaps; higher or lower | A frog sits on a key; "a skip down": play the key it should land on |

The rules of every game are plain TypeScript (`logic.ts` / `judge.ts`, tested without any graphics); the 3D scene only draws them.

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
  pages/                non-lesson screens reached from the menus: microphone & input settings, help, practice list
  games/                practice games: registry, level menu / results screen (GameScreen), best scores,
                        three/ (Stage, Piano3D, effects, textures), one folder per game (rules + 3D scene)
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
- **A practice game:** make a folder in `src/games/` with the rules as a pure class (+ tests) and a 3D scene
  component (default export taking `GamePlayProps`; copy a small one like Hop Along), then add it to `src/games/registry.ts`.
  It appears in the Practice menu and gets its own page `?page=game-<id>`.
- **A lesson:** add a folder in `src/lessons/`, export a component, and register it (with title, summary and
  goals) in `src/lessons/registry.ts`. Order in the registry is the order in the Lessons menu.

## Ideas for later

- Grade timing in play-along mode and the rhythm lesson (the key-press events already carry the moment of each note).
- Chords: the microphone path detects one note at a time; USB MIDI already delivers every key.
- More two-hand songs; block chords in the left hand (USB MIDI hears them, the microphone cannot).
- Looping a few bars and auto speed-up in song practice.
- Revisit the lesson folder format (see `docs/NOTES.md`).
