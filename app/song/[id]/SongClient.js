'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function SongClient() {
  const { id } = useParams()
  const [s, setS] = useState(undefined)
  const [src, setSrc] = useState(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('songs').select('*, profiles(display_name), categories(name)').eq('id', id).maybeSingle()
      .then(({ data }) => setS(data))
  }, [id])

  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return
      supabase.from('songs').select('views,plays,downloads').eq('id', id).maybeSingle()
        .then(({ data }) => { if (data) setS((p) => (p ? { ...p, ...data } : p)) })
    }, 10000)
    return () => clearInterval(t)
  }, [id])

  useEffect(() => {
    if (!s?.audio_key) return
    supabase.storage.from('audio').createSignedUrl(s.audio_key, 3600).then(({ data }) => setSrc(data?.signedUrl || null))
  }, [s?.audio_key])

  useEffect(() => {
    if (!s || s.status !== 'approved') return
    const k = 'viewed:' + id
    if (sessionStorage.getItem(k)) return
    try { sessionStorage.setItem(k, '1') } catch (e) {}
    supabase.rpc('track_song', { p_song: id, p_kind: 'view' }).then(({ error }) => { if (error) console.error('count failed', error.message) })
  }, [s, id])

  if (s === undefined) return <p className="muted">Loading…</p>
  if (s === null) return <p className="muted">Song not found. <Link href="/" className="link">Back to music</Link></p>

  const cover = s.cover_key ? supabase.storage.from('covers').getPublicUrl(s.cover_key).data.publicUrl : null
  const artist = s.profiles?.display_name || 'LWEL'

  function onPlay() {
    if (s.status !== 'approved') return
    const k = 'played:' + id
    if (sessionStorage.getItem(k)) return
    try { sessionStorage.setItem(k, '1') } catch (e) {}
    supabase.rpc('track_song', { p_song: id, p_kind: 'play' }).then(({ error }) => { if (error) console.error('count failed', error.message) })
  }
  async function download() {
    setBusy(true)
    const name = (s.title + ' - ' + artist + '.mp3').replace(/[\\/:*?"<>|]/g, '')
    const { data, error } = await supabase.storage.from('audio').createSignedUrl(s.audio_key, 300, { download: name })
    setBusy(false)
    if (error || !data) return alert('Download is not available right now.')
    if (s.status === 'approved') supabase.rpc('track_song', { p_song: id, p_kind: 'download' }).then(({ error }) => { if (error) console.error('count failed', error.message) })
    window.location.href = data.signedUrl
  }
  const share = () => window.open('https://wa.me/?text=' + encodeURIComponent(s.title + ' on LWEL Music Hub ' + window.location.href))
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch (e) {} }

  return (
    <>
      <Link href="/" className="back">‹ All music</Link>
      <div className="songhead">
        {cover ? <img className="songcover" src={cover} alt="" /> : <div className="songcover ph">{s.title.charAt(0)}</div>}
        <div>
          <h1>{s.title}</h1>
          <p className="by">
            <Link href={`/artist/${s.owner_id}`} className="link">{artist}</Link>
            {s.categories?.name ? ' · ' + s.categories.name : ''}
            {s.language ? ' · ' + s.language : ''}
          </p>
          {s.status !== 'approved' && <p className="note">Status: {s.status}. Only you and LWEL can see this song.{s.rejection_reason ? ' Reason: ' + s.rejection_reason : ''}</p>}
          {src ? <audio className="audioel" controls preload="none" src={src} onPlay={onPlay} /> : <p className="muted">{s.audio_key ? 'Loading audio…' : 'No audio file yet.'}</p>}
          <div className="acts">
            {s.audio_key && <button className="btn" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download MP3'}</button>}
            <button className="btn ghost" onClick={share}>Share on WhatsApp</button>
            <button className="btn ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
          </div>
          <p className="muted">{s.views ?? 0} views · {s.plays ?? 0} plays · {s.downloads ?? 0} downloads</p>
        </div>
      </div>
      {s.description && <p>{s.description}</p>}
      {s.credits && <p className="muted">Credits: {s.credits}</p>}
      <ReportForm songId={s.id} songTitle={s.title} />
    </>
  )
}

function ReportForm({ songId, songTitle }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', email: '', details: '' })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function send(e) {
    e.preventDefault()
    const { error } = await supabase.from('rights_reports').insert({ song_id: songId, song_title: songTitle, reporter_name: f.name, reporter_email: f.email, details: f.details })
    setMsg(error ? 'Could not send: ' + error.message : 'Thank you. LWEL will review your report.')
    if (!error) setOpen(false)
  }
  return (
    <div className="reportbox">
      {msg && <p className="ok" role="status">{msg}</p>}
      {!open ? <button className="mini-btn" onClick={() => setOpen(true)}>Report a copyright concern</button> : (
        <form onSubmit={send} className="narrow">
          <label>Your name<input required value={f.name} onChange={set('name')} /></label>
          <label>Your email<input type="email" required value={f.email} onChange={set('email')} /></label>
          <label>What is the concern?<textarea required rows={4} value={f.details} onChange={set('details')} /></label>
          <button className="btn ghost">Send report</button>
        </form>
      )}
    </div>
  )
}
