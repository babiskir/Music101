export type Stars = 0 | 1 | 2 | 3;

/** 0 to 3 stars from an accuracy between 0 and 1. */
export function starsFor(accuracy: number): Stars {
  if (!Number.isFinite(accuracy)) return 0;
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= 0.4) return 1;
  return 0;
}

/** Extra points for a streak: +10 per hit in a row, up to +100. */
export function comboBonus(combo: number): number {
  return Math.min(Math.max(combo, 0), 10) * 10;
}

/** "★★☆" for the result screen and the level buttons. */
export function starText(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
}

/** The headline for a result: `lines` are for 0, 1, 2 and 3 stars. */
export const starHeadline = (stars: Stars, lines: [string, string, string, string]): string => lines[stars];
