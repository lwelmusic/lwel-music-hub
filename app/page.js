'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import SongCard from '../components/SongCard'
import { DEFAULTS } from '../lib/defaults'

export default function Home() {
  const [songs, setSongs] = useState(null)
  const [q, setQ] = useState('')
  const [site, setSite] = useState({})
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    supabase
      .from('songs')
      .select('id,title,owner_id,cover_key,profiles(display_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(48)
      .then(({ data }) => setSongs(data || []))
    supabase.from('site_content').select('key,value').in('key', ['home_headline', 'home_intro', 'announcement'])
      .then(({ data }) => { const m = {}; (data || []).forEach((r) => { m[r.key] = r.value }); setSite(m) })
    supabase.from('songs').select('id,title,owner_id,cover_key,profiles(display_name)').eq('status', 'approved').eq('featured', true).limit(8)
      .then(({ data }) => setFeatured(data || []))
  }, [])

  const list = (songs || []).filter((s) =>
    (s.title + ' ' + (s.profiles?.display_name || '')).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <div className="hero">
        {site.announcement && <div className="banner" role="status">{site.announcement}</div>}
        <div className="stage">
          <img src="/logo.jpg" alt="LWEL Music logo" width="700" height="700" />
          <i className="ring" /><i className="ring" /><i className="ring" />
        </div>
        <h1>{site.home_headline || DEFAULTS.home_headline}</h1>
        <p>{site.home_intro || DEFAULTS.home_intro}</p>
        <input className="search" type="search" placeholder="Search songs, choirs, artists" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {featured.length > 0 && (
        <section>
          <h2>Featured</h2>
          <div className="grid">{featured.map((s) => <SongCard key={s.id} song={s} />)}</div>
        </section>
      )}

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
