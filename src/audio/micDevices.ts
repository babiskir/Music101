/**
 * Not every "audio input" is a microphone. Windows also lists inputs that record the PC's own
 * output ("Stereo Mix") or belong to VR headsets, and a browser can pick one of those as default.
 */
export type InputKind = 'microphone' | 'loopback' | 'virtual';

// Greek Windows calls Stereo Mix "Στερεοφωνική μείξη".
const LOOPBACK = /stereo\s*mix|what\s*u\s*hear|loopback|wave\s*out|μείξη|μειξη/i;
const VIRTUAL = /virtual|oculus|steam|vb-?audio|voicemeeter|cable output/i;

export function classifyInput(label: string): InputKind {
  if (LOOPBACK.test(label)) return 'loopback';
  if (VIRTUAL.test(label)) return 'virtual';
  return 'microphone';
}

export function inputHint(kind: InputKind): string {
  if (kind === 'loopback') return 'records the PC\'s own sound, not a microphone';
  if (kind === 'virtual') return 'virtual / VR device';
  return '';
}

/** Lower is better. */
function rank(kind: InputKind): number {
  return kind === 'microphone' ? 0 : kind === 'virtual' ? 1 : 2;
}

/** First real microphone in the list, if the currently open input is something worse. */
export function betterInput(devices: MediaDeviceInfo[], currentId: string | undefined, currentLabel: string) {
  const currentRank = rank(classifyInput(currentLabel));
  if (currentRank === 0) return null;
  return (
    devices.find(
      (d) =>
        d.deviceId !== currentId &&
        d.deviceId !== 'default' && // "default" / "communications" are aliases of other entries
        d.deviceId !== 'communications' &&
        rank(classifyInput(d.label)) < currentRank,
    ) ?? null
  );
}
