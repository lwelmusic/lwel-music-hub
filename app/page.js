'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import SongCard from '../components/SongCard'
import { DEFAULTS } from '../lib/defaults'
import { usePlayer } from '../components/PlayerProvider'

const PAGE = 24

export default function Home() {
  const [songs, setSongs] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [lang, setLang] = useState('All')
  const [sort, setSort] = useState('new')
  const [shown, setShown] = useState(PAGE)
  const [site, setSite] = useState({})
  const [featured, setFeatured] = useState([])
  const [trending, setTrending] = useState({ real: false, rows: [] })
  const [playlists, setPlaylists] = useState([])
  const { dataSaver } = usePlayer()

  useEffect(() => {
    supabase.from('songs')
      .select('id,title,owner_id,cover_key,audio_key,language,plays,created_at,profiles(display_name),categories(name)')
      .eq('status', 'approved').order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => setSongs(data || []))
    supabase.from('site_content').select('key,value').in('key', ['home_headline', 'home_intro', 'announcement'])
      .then(({ data }) => { const m = {}; (data || []).forEach((r) => { m[r.key] = r.value }); setSite(m) })
    supabase.from('songs').select('id,title,owner_id,cover_key,audio_key,profiles(display_name)').eq('status', 'approved').eq('featured', true).limit(8)
      .then(({ data }) => setFeatured(data || []))
    const SEL = 'id,title,owner_id,cover_key,audio_key,profiles(display_name)'
    supabase.rpc('trending_songs', { p_days: 7, p_limit: 12 }).then(async ({ data }) => {
      const ids = (data || []).map((r) => r.song_id)
      let rows = []
      if (ids.length) {
        const { data: s } = await supabase.from('songs').select(SEL).in('id', ids)
        rows = ids.map((id) => (s || []).find((x) => x.id === id)).filter(Boolean)
      }
      const real = rows.length >= 3
      if (rows.length < 8) {
        const { data: top } = await supabase.from('songs').select(SEL).eq('status', 'approved').gt('plays', 0).order('plays', { ascending: false }).limit(12)
        ;(top || []).forEach((x) => { if (rows.length < 12 && !rows.find((r) => r.id === x.id)) rows.push(x) })
      }
      setTrending({ real, rows })
    })
    supabase.from('playlists').select('id,title,description,position,playlist_songs(position,songs(id,cover_key))')
      .eq('published', true).order('position')
      .then(({ data }) => setPlaylists((data || []).map((p) => {
        const ss = (p.playlist_songs || []).filter((x) => x.songs).sort((a, b) => a.position - b.position)
        return { id: p.id, title: p.title, count: ss.length, cover: ss.map((x) => x.songs.cover_key).find(Boolean) || null }
      }).filter((p) => p.count > 0)))
  }, [])

  const cats = useMemo(() => ['All', ...new Set((songs || []).map((s) => s.categories?.name).filter(Boolean))], [songs])
  const langs = useMemo(() => ['All', ...new Set((songs || []).map((s) => s.language).filter(Boolean))], [songs])
  const list = useMemo(() => {
    const t = q.toLowerCase()
    const r = (songs || []).filter((s) =>
      (cat === 'All' || s.categories?.name === cat) && (lang === 'All' || s.language === lang) &&
      [s.title, s.profiles?.display_name, s.categories?.name, s.language].join(' ').toLowerCase().includes(t))
    if (sort === 'popular') r.sort((a, b) => (b.plays || 0) - (a.plays || 0))
    if (sort === 'az') r.sort((a, b) => a.title.localeCompare(b.title))
    return r
  }, [songs, q, cat, lang, sort])
  const reset = (fn) => (v) => { fn(v); setShown(PAGE) }

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
        <input className="search" type="search" placeholder="Search songs, choirs, artists" aria-label="Search" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
      </div>

      {featured.length > 0 && (
        <section>
          <h2>Featured</h2>
          <div className="grid">{featured.map((s) => <SongCard key={s.id} song={s} queue={featured} />)}</div>
        </section>
      )}

      {playlists.length > 0 && (
        <section>
          <h2>Playlists</h2>
          <div className="grid">
            {playlists.map((p) => (
              <article className="card" key={p.id}>
                <Link href={`/playlist/${p.id}`} className="art plart" aria-label={p.title}>
                  {p.cover && !dataSaver ? <img className="coverimg" alt="" src={supabase.storage.from('covers').getPublicUrl(p.cover).data.publicUrl} /> : '♪'}
                </Link>
                <div>
                  <h3><Link href={`/playlist/${p.id}`}>{p.title}</Link></h3>
                  <small className="muted">{p.count} song{p.count === 1 ? '' : 's'}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {trending.rows.length > 0 && (
        <section>
          <h2>{trending.real ? 'Trending this week' : 'Popular songs'}</h2>
          <div className="grid">{trending.rows.slice(0, 8).map((s) => <SongCard key={s.id} song={s} queue={trending.rows} />)}</div>
        </section>
      )}

      <section>
        <h2>Explore music</h2>
        <div className="chips" role="group" aria-label="Filter by category">
          {cats.map((c) => <button key={c} className="chip" aria-pressed={c === cat} onClick={() => reset(setCat)(c)}>{c}</button>)}
        </div>
        <div className="filters">
          <label className="inline">Language
            <select value={lang} onChange={(e) => reset(setLang)(e.target.value)}>{langs.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label className="inline">Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest</option><option value="popular">Most played</option><option value="az">A to Z</option>
            </select>
          </label>
          {songs && <span className="muted small">{list.length} song{list.length === 1 ? '' : 's'}</span>}
        </div>
        {songs === null && <p className="muted">Loading music…</p>}
        {songs && list.length === 0 && (
          <p className="muted">
            {songs.length === 0 ? 'No songs have been published yet. Artists and choirs can ' : 'No songs match your search or filters.'}
            {songs.length === 0 && <Link href="/register" className="link">register to share the first one</Link>}
          </p>
        )}
        <div className="grid">{list.slice(0, shown).map((s) => <SongCard key={s.id} song={s} queue={list} />)}</div>
        {list.length > shown && <p style={{ textAlign: 'center' }}><button className="btn ghost" onClick={() => setShown(shown + PAGE)}>Show more</button></p>}
      </section>
    </>
  )
}
