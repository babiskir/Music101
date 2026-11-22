import type { Song } from '../../domain/song';
import { odeToJoy } from './odeToJoy';
import { twinkleTwinkle } from './twinkleTwinkle';

/** Add new songs here; the UI picks them up automatically. */
export const songs: Song[] = [odeToJoy, twinkleTwinkle];
