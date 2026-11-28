/** The landmark trick for each pitch class (0 = C ... 11 = B), in terms of the black-key groups. */
export const LANDMARKS: Record<number, string> = {
  0: 'Do (C) is the white key just LEFT of a pair of black keys.',
  1: 'Do♯ (C#) is the FIRST black key of a pair (just right of Do).',
  2: 'Re (D) is the white key BETWEEN the two black keys of a pair.',
  3: 'Re♯ (D#) is the SECOND black key of a pair.',
  4: 'Mi (E) is the white key just RIGHT of a pair of black keys.',
  5: 'Fa (F) is the white key just LEFT of a group of three black keys.',
  6: 'Fa♯ (F#) is the FIRST black key of a group of three.',
  7: 'Sol (G) is the white key between the first and second black keys of the three.',
  8: 'Sol♯ (G#) is the MIDDLE black key of a group of three.',
  9: 'La (A) is the white key between the second and third black keys of the three.',
  10: 'La♯ (A#) is the LAST black key of a group of three.',
  11: 'Si (B) is the white key just RIGHT of a group of three black keys.',
};
