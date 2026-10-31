'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import SongCard from '../components/SongCard'

export default function Home() {
  const [songs, setSongs] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    supabase
      .from('songs')
      .select('id,title,owner_id,profiles(display_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(48)
      .then(({ data }) => setSongs(data || []))
  }, [])

  const list = (songs || []).filter((s) =>
    (s.title + ' ' + (s.profiles?.display_name || '')).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <div className="hero">
        <div className="stage">
          <img src="/logo.jpg" alt="LWEL Music logo" width="700" height="700" />
          <i className="ring" /><i className="ring" /><i className="ring" />
        </div>
        <h1>Let the world hear your song.</h1>
        <p>A home for SDA music: choirs, singing groups and solo artists. Listen, download and share, no account needed.</p>
        <input className="search" type="search" placeholder="Search songs, choirs, artists" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <section>
        <h2>New releases</h2>
        {songs === null && <p className="muted">Loading music…</p>}
        {songs && list.length === 0 && (
          <p className="muted">
            {songs.length === 0 ? 'No songs have been published yet. Artists and choirs can ' : 'No songs match your search.'}
            {songs.length === 0 && <Link href="/register" className="link">register to share the first one</Link>}
          </p>
        )}
        <div className="grid">{list.map((s) => <SongCard key={s.id} song={s} />)}</div>
      </section>
    </>
  )
}
