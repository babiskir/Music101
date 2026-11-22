/** The landmark trick for each pitch class (0 = C ... 11 = B), in terms of the black-key groups. */
export const LANDMARKS: Record<number, string> = {
  0: 'C is the white key just LEFT of a pair of black keys.',
  1: 'C# is the FIRST black key of a pair (just right of C).',
  2: 'D is the white key BETWEEN the two black keys of a pair.',
  3: 'D# is the SECOND black key of a pair.',
  4: 'E is the white key just RIGHT of a pair of black keys.',
  5: 'F is the white key just LEFT of a group of three black keys.',
  6: 'F# is the FIRST black key of a group of three.',
  7: 'G is the white key between the 1st and 2nd black keys of the three.',
  8: 'G# is the MIDDLE black key of a group of three.',
  9: 'A is the white key between the 2nd and 3rd black keys of the three.',
  10: 'A# is the LAST black key of a group of three.',
  11: 'B is the white key just RIGHT of a group of three black keys.',
};
