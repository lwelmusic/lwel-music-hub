'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { usePlayer } from '../../../components/PlayerProvider'

const coverUrl = (k) => (k ? supabase.storage.from('covers').getPublicUrl(k).data.publicUrl : null)
const toTrack = (s) => ({ id: s.id, title: s.title, artist: s.profiles?.display_name || 'LWEL', audio_key: s.audio_key, cover: coverUrl(s.cover_key), status: 'approved' })

export default function PlaylistClient() {
  const { id } = useParams()
  const player = usePlayer()
  const [pl, setPl] = useState(undefined)
  const [songs, setSongs] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('playlists').select('id,title,description,published').eq('id', id).maybeSingle().then(({ data }) => setPl(data))
    supabase.from('playlist_songs').select('position,songs(id,title,owner_id,cover_key,audio_key,profiles(display_name))')
      .eq('playlist_id', id).order('position')
      .then(({ data }) => setSongs((data || []).map((r) => r.songs).filter((s) => s && s.audio_key)))
  }, [id])

  if (pl === undefined) return <p className="muted">Loading…</p>
  if (pl === null) return <p className="muted">Playlist not found. <Link href="/" className="link">Back to music</Link></p>

  const tracks = songs.map(toTrack)
  const shuffle = () => {
    const t = [...tracks]
    for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]] }
    player.playQueue(t, 0)
  }
  const share = () => window.open('https://wa.me/?text=' + encodeURIComponent(pl.title + ' on LWEL Music Hub ' + window.location.href))
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch (e) {} }

  return (
    <>
      <Link href="/" className="back">‹ All music</Link>
      <h1>{pl.title}</h1>
      {!pl.published && <p className="note">This playlist is hidden. Only administrators can see it.</p>}
      {pl.description && <p className="by">{pl.description}</p>}
      <p className="muted small">{songs.length} song{songs.length === 1 ? '' : 's'}</p>
      <div className="acts">
        <button className="btn" disabled={!tracks.length} onClick={() => player.playQueue(tracks, 0)}>▶ Play all</button>
        <button className="btn ghost" disabled={tracks.length < 2} onClick={shuffle}>Shuffle</button>
        <button className="btn ghost" onClick={share}>Share on WhatsApp</button>
        <button className="btn ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      </div>
      {songs.length === 0 ? <p className="note">There are no songs in this playlist yet.</p> : (
        <ol className="plist">
          {songs.map((s, i) => {
            const on = player.track?.id === s.id && player.playing
            return (
              <li key={s.id} className={on ? 'on' : ''}>
                <span className="pnum">{i + 1}</span>
                {!player.dataSaver && coverUrl(s.cover_key) ? <img src={coverUrl(s.cover_key)} alt="" /> : <span className="pth" />}
                <span className="ptext">
                  <Link href={`/song/${s.id}`}>{s.title}</Link>
                  <small><Link href={`/artist/${s.owner_id}`}>{s.profiles?.display_name}</Link></small>
                </span>
                <button className="pbtn" onClick={() => player.playQueue(tracks, i)} aria-label={(on ? 'Pause ' : 'Play ') + s.title}>{on ? '❚❚' : '▶'}</button>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}
