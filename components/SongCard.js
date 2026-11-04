'use client'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { usePlayer } from './PlayerProvider'

const COLORS = [['#2f6bff', '#22d3ee'], ['#7ac943', '#22d3ee'], ['#b366ff', '#2f6bff'], ['#22d3ee', '#7ac943']]
const coverUrl = (k) => (k ? supabase.storage.from('covers').getPublicUrl(k).data.publicUrl : null)
const toTrack = (s) => ({ id: s.id, title: s.title, artist: s.profiles?.display_name || 'LWEL', audio_key: s.audio_key, cover: coverUrl(s.cover_key), status: 'approved' })

export default function SongCard({ song, queue }) {
  const player = usePlayer()
  const c = COLORS[(song.id.charCodeAt(0) + song.id.charCodeAt(1)) % COLORS.length]
  const artist = song.profiles?.display_name || 'Unknown artist'
  const cover = player.dataSaver ? null : coverUrl(song.cover_key)
  const canPlay = !!song.audio_key && !!queue
  const on = player.track?.id === song.id && player.playing

  function onPlay() {
    const list = queue.filter((q) => q.audio_key)
    player.playQueue(list.map(toTrack), list.findIndex((q) => q.id === song.id))
  }

  return (
    <article className="card">
      <div className="artwrap">
        <Link href={`/song/${song.id}`} className="art" style={{ background: `linear-gradient(135deg,${c[0]},${c[1]})` }} aria-label={song.title}>
          {cover ? <img src={cover} alt="" className="coverimg" /> : song.title.charAt(0)}
        </Link>
        {canPlay && <button className="cardplay" onClick={onPlay} aria-label={(on ? 'Pause ' : 'Play ') + song.title}>{on ? '❚❚' : '▶'}</button>}
      </div>
      <div>
        <h3><Link href={`/song/${song.id}`}>{song.title}</Link></h3>
        <small><Link href={`/artist/${song.owner_id}`}>{artist}</Link></small>
      </div>
    </article>
  )
}
