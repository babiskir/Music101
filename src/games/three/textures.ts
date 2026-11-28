import * as THREE from 'three';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { midiToPitch } from '../../domain/notes';

const INK = '#1a1a1a';

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A rounded card with big text on it: a note name. Aspect 1:1. */
export function textCard(text: string, bg: string, fg = '#14161a'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  roundRect(ctx, 8, 8, size - 16, size - 16, 36);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = text.length <= 2 ? 128 : text.length <= 3 ? 100 : 52;
  ctx.font = `bold ${fontSize}px system-ui, "Segoe UI", sans-serif`;
  ctx.fillText(text, size / 2, size / 2 + 8);
  return makeTexture(canvas);
}

/** Text with a soft outline, for floating "Perfect!" labels. Aspect 4:1. */
export function textLabel(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 76px system-ui, "Segoe UI", sans-serif';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,12,16,0.85)';
  ctx.strokeText(text, 256, 68);
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 68);
  return makeTexture(canvas);
}

/** A white ring-less "key name" for the top of a key. Aspect 1:1. */
export function keyName(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${text.length <= 1 ? 84 : text.length <= 2 ? 70 : 56}px system-ui, "Segoe UI", sans-serif`;
  ctx.fillText(text, 64, 70);
  return makeTexture(canvas);
}

/** Aspect of a staff card (width / height). */
export const STAFF_ASPECT = 190 / 150;

/**
 * One note on the treble staff, drawn with VexFlow (the same engraver as the lessons) and turned into a
 * texture. Resolves to a plain text card if the browser cannot turn the drawing into an image.
 */
export async function staffCard(midi: number, clef: 'treble' | 'bass' = 'treble'): Promise<THREE.Texture> {
  const W = 190;
  const H = 150;
  try {
    const host = document.createElement('div');
    const renderer = new Renderer(host as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(W, H);
    const ctx = renderer.getContext();
    const stave = new Stave(4, 12, W - 8);
    stave.addClef(clef);
    stave.setStyle({ strokeStyle: INK, fillStyle: INK });
    stave.setContext(ctx).draw();

    const pitch = midiToPitch(midi); // "C#4"
    const note = new StaveNote({ keys: [`${pitch.slice(0, -1).toLowerCase()}/${pitch.slice(-1)}`], duration: 'q', clef });
    if (pitch.includes('#')) note.addModifier(new Accidental('#'));
    note.setStyle({ fillStyle: INK, strokeStyle: INK });
    const voice = new Voice({ numBeats: 1, beatValue: 4 });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], 70);
    voice.draw(ctx, stave);

    const svg = host.querySelector('svg');
    if (!svg) throw new Error('no svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode();

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const c = canvas.getContext('2d')!;
    roundRect(c, 6, 6, canvas.width - 12, canvas.height - 12, 28);
    c.fillStyle = '#fbfaf5';
    c.fill();
    c.lineWidth = 6;
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.stroke();
    c.drawImage(img, 0, 0, canvas.width, canvas.height);
    return makeTexture(canvas);
  } catch {
    return textCard('♪', '#fbfaf5');
  }
}
