'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import SongCard from '../../../components/SongCard'
import Avatar from '../../../components/Avatar'

const TYPES = { solo: 'Solo artist', choir: 'Choir', group: 'Singing group' }

export default function ArtistClient() {
  const { id } = useParams()
  const [p, setP] = useState(undefined)
  const [songs, setSongs] = useState([])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('songs').select('id,title,owner_id,cover_key,profiles(display_name)').eq('owner_id', id).eq('status', 'approved')
      .order('created_at', { ascending: false }).then(({ data }) => setSongs(data || []))
  }, [id])

  if (p === undefined) return <p className="muted">Loading…</p>
  if (p === null) return <p className="muted">Profile not found. <Link href="/" className="link">Back to music</Link></p>

  return (
    <>
      <Link href="/" className="back">‹ All music</Link>
      <div className="ap">
        <Avatar profile={p} size={140} />
        <div>
          <h1>{p.display_name}</h1>
          <p className="by">{TYPES[p.profile_type]}{p.location ? ' · ' + p.location : ''}</p>
          <p>{p.bio || 'This artist has not added a biography yet.'}</p>
        </div>
      </div>
      <h2>Songs ({songs.length})</h2>
      {songs.length === 0 && <p className="muted">No published songs yet.</p>}
      <div className="grid">{songs.map((s) => <SongCard key={s.id} song={s} />)}</div>
    </>
  )
}
