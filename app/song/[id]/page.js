'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function Song() {
  const { id } = useParams()
  const [s, setS] = useState(undefined)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('songs').select('*, profiles(display_name), categories(name)').eq('id', id).maybeSingle()
      .then(({ data }) => setS(data))
  }, [id])

  useEffect(() => {
    if (!s || s.status !== 'approved') return
    const k = 'viewed:' + id
    if (sessionStorage.getItem(k)) return
    try { sessionStorage.setItem(k, '1') } catch (e) {}
    supabase.rpc('track_song', { p_song: id, p_kind: 'view' })
  }, [s, id])

  if (s === undefined) return <p className="muted">Loading…</p>
  if (s === null) return <p className="muted">Song not found. <Link href="/" className="link">Back to music</Link></p>

  const share = () => window.open('https://wa.me/?text=' + encodeURIComponent(s.title + ' on LWEL Music Hub ' + window.location.href))
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch (e) {} }

  return (
    <>
      <Link href="/" className="back">‹ All music</Link>
      <h1>{s.title}</h1>
      <p className="by">
        <Link href={`/artist/${s.owner_id}`} className="link">{s.profiles?.display_name}</Link>
        {s.categories?.name ? ' · ' + s.categories.name : ''}
        {s.status !== 'approved' ? ' · ' + s.status + ' (only you and LWEL can see this)' : ''}
      </p>
      <p className="muted">{s.views ?? 0} views · {s.plays ?? 0} plays · {s.downloads ?? 0} downloads</p>
      <p className="note">Audio playback and downloads are coming in the next stage.</p>
      <div className="acts">
        <button className="btn ghost" onClick={share}>Share on WhatsApp</button>
        <button className="btn ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      </div>
      {s.description && <p>{s.description}</p>}
      {s.credits && <p className="muted">Credits: {s.credits}</p>}
      <ReportForm songId={s.id} />
    </>
  )
}

function ReportForm({ songId }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', email: '', details: '' })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function send(e) {
    e.preventDefault()
    const { error } = await supabase.from('rights_reports').insert({ song_id: songId, reporter_name: f.name, reporter_email: f.email, details: f.details })
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
