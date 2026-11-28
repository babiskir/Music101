import { useEffect, useRef, useState } from 'react';
import {
  Accidental,
  Annotation,
  Barline,
  Beam,
  Dot,
  Formatter,
  GhostNote,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  Voice,
} from 'vexflow';
import { pitchToMidi } from '../../domain/notes';
import type { TimedNote } from '../../domain/song';
import { REST_KEY, WHOLE_REST_KEY, staffFor, type Clef, type StaffClef } from './grand';

interface Props {
  notes: TimedNote[];
  beatsPerBar: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  /** Cap on bars per line (default: as many as fit, up to 4). */
  maxBarsPerLine?: number;
  /** Show the time signature (default). Turn off for a single note. */
  timeSignature?: boolean;
  /** Text printed under each note, by note index (e.g. its names; "\n" starts a new line). Undefined entries print nothing. */
  labels?: (string | undefined)[];
  /** Treble (default), bass, or both joined as a grand staff (each note goes to the staff of its hand). */
  clef?: Clef;
  /** Keys being played right now: notes with that exact pitch light up (without redrawing the sheet). */
  glow?: number[];
}

const LINE_HEIGHT = 140;
/** The sheet music is drawn at this size: readable, but leaves room for the keyboard on screen. */
const SCALE = 0.82;
const GRAND_GAP = 125; // from the top of the treble staff to the top of the bass staff
const GRAND_LINE_HEIGHT = LINE_HEIGHT + GRAND_GAP;
const TOP_MARGIN = 10;
const CLEF_EXTRA = 45;
const TIME_SIG_EXTRA = 30;
/** Space a bar loses to its barlines and edge padding, beyond what its notes need. */
const BAR_PADDING = 30;
/** Size of the names printed under notes, on screen (px). */
const LABEL_PX = 13;
const ACTIVE_COLOR = '#d9820f';
const INK = '#1a1a1a';

/** Beats (quarter = 1) -> VexFlow duration. */
function toDuration(beats: number): { duration: string; dots: number } {
  const table: Record<number, { duration: string; dots: number }> = {
    0.25: { duration: '16', dots: 0 },
    0.5: { duration: '8', dots: 0 },
    0.75: { duration: '8', dots: 1 },
    1: { duration: 'q', dots: 0 },
    1.5: { duration: 'q', dots: 1 },
    2: { duration: 'h', dots: 0 },
    3: { duration: 'h', dots: 1 },
    4: { duration: 'w', dots: 0 },
  };
  const d = table[beats];
  if (!d) throw new Error(`Unsupported note length: ${beats} beats`);
  return d;
}

/** "C#4" -> "c#/4" */
function toKey(pitch: string): string {
  return `${pitch.slice(0, -1).toLowerCase()}/${pitch.slice(-1)}`;
}

/** Every pitch of a note (the main one and the ones sounding with it), low to high. */
const pitchesOf = (note: TimedNote): string[] =>
  [note.pitch, ...(note.also ?? [])].sort((a, b) => pitchToMidi(a) - pitchToMidi(b));

function buildNote(note: TimedNote, staff: StaffClef, label: string | undefined, active: boolean, pitches = pitchesOf(note)): StaveNote {
  const { duration, dots } = toDuration(note.beats);
  const sn = note.rest
    ? new StaveNote({ keys: [duration === 'w' ? WHOLE_REST_KEY[staff] : REST_KEY[staff]], duration: `${duration}r`, clef: staff })
    : new StaveNote({ keys: pitches.map(toKey), duration, clef: staff });
  if (dots) Dot.buildAndAttach([sn], { all: true });
  if (!note.rest) {
    pitches.forEach((p, i) => {
      if (p.includes('#')) sn.addModifier(new Accidental('#'), i);
      else if (/^[A-G]b/.test(p)) sn.addModifier(new Accidental('b'), i);
    });
  }
  const text = label ?? (note.finger ? String(note.finger) : undefined);
  for (const textLine of text?.split('\n') ?? []) {
    sn.addModifier(new Annotation(textLine).setFont('Arial', Math.round(LABEL_PX / SCALE), 'bold').setVerticalJustification(Annotation.VerticalJustify.BOTTOM));
  }
  const color = active ? ACTIVE_COLOR : INK;
  sn.setStyle({ fillStyle: color, strokeStyle: color });
  return sn;
}

/** Real sheet music for the notes, with the current note highlighted. */
export function StaffNotation({
  notes,
  beatsPerBar,
  activeIndex,
  onSelect,
  maxBarsPerLine = 4,
  timeSignature = true,
  labels,
  clef = 'treble',
  glow = [],
}: Props) {
  /** Every drawn note and the keys it stands for, so they can light up when one of them is played. */
  const noteEls = useRef<{ midis: number[]; el: SVGElement }[]>([]);
  const glowRef = useRef(glow);
  glowRef.current = glow;
  const applyGlow = () => {
    for (const { midis, el } of noteEls.current) el.classList.toggle('glow', midis.some((m) => glowRef.current.includes(m)));
  };
  const labelsKey = labels?.map((l) => l ?? '').join('|') ?? '';
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || width === 0) return;
    el.innerHTML = '';
    const grand = clef === 'grand';
    const pageWidth = width / SCALE; // lay out at full size, then draw smaller
    const left = grand ? 12 : 1; // room for the brace

    // Group notes into bars.
    const bars: { note: TimedNote; index: number }[][] = [];
    notes.forEach((note, index) => {
      (bars[Math.floor(note.startBeat / beatsPerBar)] ??= []).push({ note, index });
    });

    type Clickable = { sn: StaveNote; index: number; midis: number[] };
    /** A bar's notes as voices (one per staff), ready to format. */
    const buildBar = (bar: { note: TimedNote; index: number }[]) => {
      const clicks: Clickable[] = [];
      if (!grand) {
        const staffClef = clef as StaffClef;
        const staveNotes = bar.map(({ note, index }) => {
          const sn = buildNote(note, staffClef, labels?.[index], index === activeIndex);
          if (!note.rest) clicks.push({ sn, index, midis: pitchesOf(note).map(pitchToMidi) });
          return sn;
        });
        const voice = new Voice({ numBeats: beatsPerBar, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(staveNotes);
        return { voices: [voice], staveNotes, clicks };
      }
      // Grand staff: every note goes on its hand's staff; the other staff gets an invisible note of the
      // same length, so both stay in time with each other.
      const top: (StaveNote | GhostNote)[] = [];
      const bottom: (StaveNote | GhostNote)[] = [];
      for (const { note, index } of bar) {
        const { duration, dots } = toDuration(note.beats);
        const ghost = () => new GhostNote({ duration, dots });
        if (note.rest) {
          top.push(buildNote(note, 'treble', labels?.[index], index === activeIndex));
          bottom.push(ghost());
          continue;
        }
        // Split the pitches between the hands; the names go under the main note, on its staff.
        const mainStaff = staffFor(pitchToMidi(note.pitch), 'grand');
        for (const staff of ['treble', 'bass'] as const) {
          const mine = pitchesOf(note).filter((p) => staffFor(pitchToMidi(p), 'grand') === staff);
          const list = staff === 'treble' ? top : bottom;
          if (!mine.length) {
            list.push(ghost());
            continue;
          }
          const sn = buildNote(note, staff, staff === mainStaff ? labels?.[index] : undefined, index === activeIndex, mine);
          clicks.push({ sn, index, midis: mine.map(pitchToMidi) });
          list.push(sn);
        }
      }
      const tv = new Voice({ numBeats: beatsPerBar, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(top);
      const bv = new Voice({ numBeats: beatsPerBar, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(bottom);
      return { voices: [tv, bv], staveNotes: [] as StaveNote[], clicks };
    };
    const formatterFor = (voices: Voice[]) => {
      const f = new Formatter();
      voices.forEach((v) => f.joinVoices([v]));
      return f;
    };

    // Fewer bars per line when a bar needs more room than it would get (e.g. many notes with names
    // under them), so notes and names never spill past the end of the staff.
    const minBarWidth = Math.max(
      0,
      ...bars.map((bar) => {
        const { voices } = buildBar(bar);
        return formatterFor(voices).preCalculateMinTotalWidth(voices);
      }),
    );
    const roomPerBar = (n: number) =>
      (pageWidth - 12 - left - CLEF_EXTRA - (timeSignature ? TIME_SIG_EXTRA : 0)) / n - BAR_PADDING;
    let barsPerLine = Math.min(maxBarsPerLine, width >= 640 ? 4 : width >= 360 ? 2 : 1);
    while (barsPerLine > 1 && roomPerBar(barsPerLine) < minBarWidth) barsPerLine--;
    const lines = Math.ceil(bars.length / barsPerLine);
    const lineHeight = grand ? GRAND_LINE_HEIGHT : LINE_HEIGHT;
    const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, (lines * lineHeight + TOP_MARGIN) * SCALE);
    const ctx = renderer.getContext();
    ctx.scale(SCALE, SCALE);
    const clickable: Clickable[] = [];

    const makeStave = (x: number, y: number, w: number, staffClef: StaffClef, firstOnLine: boolean, firstEver: boolean, last: boolean) => {
      const stave = new Stave(x, y, w);
      if (firstOnLine) stave.addClef(staffClef);
      if (firstEver && timeSignature) stave.addTimeSignature(`${beatsPerBar}/4`);
      if (last) stave.setEndBarType(Barline.type.END);
      stave.setStyle({ strokeStyle: INK, fillStyle: INK });
      stave.setContext(ctx).draw();
      return stave;
    };

    bars.forEach((bar, barIdx) => {
      const line = Math.floor(barIdx / barsPerLine);
      const col = barIdx % barsPerLine;
      const firstOnLine = col === 0;
      const firstEver = barIdx === 0;
      const last = barIdx === bars.length - 1;

      // Equal-width bars; the clef (and time signature on line 1) add width to the first bar.
      const lineExtra = CLEF_EXTRA + (line === 0 && timeSignature ? TIME_SIG_EXTRA : 0);
      const baseWidth = (pageWidth - 12 - left - lineExtra) / barsPerLine;
      const staveWidth = baseWidth + (firstOnLine ? lineExtra : 0);
      const x = firstOnLine ? left : left + lineExtra + col * baseWidth;
      const y = TOP_MARGIN + line * lineHeight;

      const { voices, staveNotes, clicks } = buildBar(bar);
      clickable.push(...clicks);

      if (!grand) {
        const [voice] = voices;
        const stave = makeStave(x, y, staveWidth, clef as StaffClef, firstOnLine, firstEver, last);
        const beams = Beam.generateBeams(staveNotes);
        const formatWidth = stave.getNoteEndX() - stave.getNoteStartX() - 12;
        formatterFor(voices).format(voices, Math.max(formatWidth, 40));
        voice.draw(ctx, stave);
        beams.forEach((b) => b.setContext(ctx).draw());
        return;
      }

      const treble = makeStave(x, y, staveWidth, 'treble', firstOnLine, firstEver, last);
      const bass = makeStave(x, y + GRAND_GAP, staveWidth, 'bass', firstOnLine, firstEver, last);
      if (firstOnLine) {
        new StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
        new StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
      }
      new StaveConnector(treble, bass).setType(last ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();

      const [tv, bv] = voices;
      tv.setStave(treble);
      bv.setStave(bass);
      const formatWidth = treble.getNoteEndX() - treble.getNoteStartX() - 12;
      formatterFor(voices).format(voices, Math.max(formatWidth, 40));
      tv.draw(ctx, treble);
      bv.draw(ctx, bass);
    });

    // Click a note to jump to it.
    noteEls.current = [];
    clickable.forEach(({ sn, index, midis }) => {
      const svg = sn.getSVGElement();
      if (!svg) return;
      noteEls.current.push({ midis, el: svg });
      if (!onSelectRef.current) return;
      svg.style.cursor = 'pointer';
      svg.addEventListener('click', () => onSelectRef.current?.(index));
    });
    applyGlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, beatsPerBar, activeIndex, width, maxBarsPerLine, timeSignature, labelsKey, clef]);

  const glowKey = glow.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(applyGlow, [glowKey]);

  return <div className="staff" ref={containerRef} aria-label="Sheet music" />;
}
