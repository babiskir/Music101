import { useEffect, useRef, useState } from 'react';
import {
  Accidental,
  Annotation,
  Barline,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow';
import type { TimedNote } from '../../domain/song';

interface Props {
  notes: TimedNote[];
  beatsPerBar: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  /** Cap on bars per line (default: as many as fit, up to 4). */
  maxBarsPerLine?: number;
  /** Show the time signature (default). Turn off for a single note. */
  timeSignature?: boolean;
  /** Text printed under each note, by note index (e.g. its letter). Undefined entries print nothing. */
  labels?: (string | undefined)[];
}

const LINE_HEIGHT = 150;
const TOP_MARGIN = 20;
const CLEF_EXTRA = 45;
const TIME_SIG_EXTRA = 30;
const ACTIVE_COLOR = '#ff8c00';
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

/** Real sheet music (treble clef) for the song, with the current note highlighted. */
export function StaffNotation({
  notes,
  beatsPerBar,
  activeIndex,
  onSelect,
  maxBarsPerLine = 4,
  timeSignature = true,
  labels,
}: Props) {
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

    // Group notes into bars.
    const bars: { note: TimedNote; index: number }[][] = [];
    notes.forEach((note, index) => {
      (bars[Math.floor(note.startBeat / beatsPerBar)] ??= []).push({ note, index });
    });

    const barsPerLine = Math.min(maxBarsPerLine, width >= 720 ? 4 : width >= 420 ? 2 : 1);
    const lines = Math.ceil(bars.length / barsPerLine);
    const renderer = new Renderer(el as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, lines * LINE_HEIGHT + TOP_MARGIN);
    const ctx = renderer.getContext();

    bars.forEach((bar, barIdx) => {
      const line = Math.floor(barIdx / barsPerLine);
      const col = barIdx % barsPerLine;
      const firstOnLine = col === 0;
      const firstEver = barIdx === 0;

      // Equal-width bars; the clef (and time signature on line 1) add width to the first bar.
      const lineExtra = CLEF_EXTRA + (line === 0 && timeSignature ? TIME_SIG_EXTRA : 0);
      const baseWidth = (width - 12 - lineExtra) / barsPerLine;
      const staveWidth = baseWidth + (firstOnLine ? lineExtra : 0);
      const x = firstOnLine ? 1 : 1 + lineExtra + col * baseWidth;
      const y = TOP_MARGIN + line * LINE_HEIGHT;

      const stave = new Stave(x, y, staveWidth);
      if (firstOnLine) stave.addClef('treble');
      if (firstEver && timeSignature) stave.addTimeSignature(`${beatsPerBar}/4`);
      if (barIdx === bars.length - 1) stave.setEndBarType(Barline.type.END);
      stave.setStyle({ strokeStyle: INK, fillStyle: INK });
      stave.setContext(ctx).draw();

      const staveNotes = bar.map(({ note, index }) => {
        const { duration, dots } = toDuration(note.beats);
        const sn = new StaveNote({ keys: [toKey(note.pitch)], duration, clef: 'treble' });
        if (dots) Dot.buildAndAttach([sn], { all: true });
        if (note.pitch.includes('#')) sn.addModifier(new Accidental('#'));
        else if (/^[A-G]b/.test(note.pitch)) sn.addModifier(new Accidental('b'));
        const text = labels?.[index] ?? (note.finger ? String(note.finger) : undefined);
        if (text) {
          sn.addModifier(
            new Annotation(text).setFont('Arial', 16, 'bold').setVerticalJustification(Annotation.VerticalJustify.BOTTOM),
          );
        }
        const color = index === activeIndex ? ACTIVE_COLOR : INK;
        sn.setStyle({ fillStyle: color, strokeStyle: color });
        return { sn, index };
      });

      const voice = new Voice({ numBeats: beatsPerBar, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(staveNotes.map((s) => s.sn));
      const beams = Beam.generateBeams(staveNotes.map((s) => s.sn));
      const formatWidth = stave.getNoteEndX() - stave.getNoteStartX() - 12;
      new Formatter().joinVoices([voice]).format([voice], Math.max(formatWidth, 40));
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());

      // Click a note to jump to it.
      staveNotes.forEach(({ sn, index }) => {
        const svg = sn.getSVGElement();
        if (!svg) return;
        svg.style.cursor = 'pointer';
        svg.addEventListener('click', () => onSelectRef.current?.(index));
      });
    });
  }, [notes, beatsPerBar, activeIndex, width, maxBarsPerLine, timeSignature, labelsKey]);

  return <div className="staff" ref={containerRef} aria-label="Sheet music" />;
}
