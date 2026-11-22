import { useState } from 'react';
import { songs } from '../../data/songs';
import { Metronome } from '../../features/metronome/Metronome';
import { SongPractice } from '../../features/practice/SongPractice';

/** Layout: song picker on top, full practice card, metronome below. */
export function FirstSongs() {
  const [songId, setSongId] = useState(songs[0].id);
  const song = songs.find((s) => s.id === songId) ?? songs[0];

  return (
    <>
      <label>
        Song{' '}
        <select value={songId} onChange={(e) => setSongId(e.target.value)}>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </label>
      {/* key resets practice state when the song changes */}
      <SongPractice key={song.id} song={song} />
      <Metronome />
    </>
  );
}
