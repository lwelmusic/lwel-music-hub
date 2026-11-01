'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

async function toSquareJpeg(file, size = 600) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}

export default function EditSong() {
  const { id } = useParams()
  const router = useRouter()
  const [uid, setUid] = useState(null)
  const [song, setSong] = useState(undefined)
  const [cats, setCats] = useState([])
  const [f, setF] = useState({ title: '', category_id: '', language: '', release_date: '', description: '', credits: '' })
  const [cover, setCover] = useState(null)
  const [resubmit, setResubmit] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (!u) return router.push('/login')
      setUid(u.id)
      const { data: s } = await supabase.from('songs').select('*').eq('id', id).maybeSingle()
      setSong(s)
      if (s) setF({ title: s.title || '', category_id: s.category_id || '', language: s.language || '', release_date: s.release_date || '', description: s.description || '', credits: s.credits || '' })
    })
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || []))
  }, [id, router])

  if (song === undefined) return <p className="muted">Loading…</p>
  if (!song || song.owner_id !== uid) return <p className="muted">You can only edit your own songs. <Link href="/dashboard" className="link">Back to dashboard</Link></p>

  async function save(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      let cover_key = song.cover_key
      if (cover) {
        const blob = await toSquareJpeg(cover)
        const key = `${uid}/${id}-${Date.now()}.jpg`
        const up = await supabase.storage.from('covers').upload(key, blob, { contentType: 'image/jpeg' })
        if (up.error) throw up.error
        if (song.cover_key) await supabase.storage.from('covers').remove([song.cover_key])
        cover_key = key
      }
      const patch = { ...f, title: f.title.trim(), category_id: f.category_id || null, release_date: f.release_date || null, cover_key }
      if (resubmit && song.status === 'rejected') patch.status = 'pending'
      const { error } = await supabase.from('songs').update(patch).eq('id', id)
      if (error) throw error
      router.push(`/song/${id}`)
    } catch (x) {
      setErr(x.message || 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="formbox">
      <Link href="/dashboard" className="back">‹ My dashboard</Link>
      <h1>Edit song</h1>
      <p className="muted">To replace the audio file, remove this song and upload it again.</p>
      <form onSubmit={save}>
        <label>Song title<input required value={f.title} onChange={set('title')} /></label>
        <label>New cover picture (optional)<input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} /></label>
        <label>Category
          <select value={f.category_id} onChange={set('category_id')}><option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label>Language<input value={f.language} onChange={set('language')} /></label>
        <label>Release date<input type="date" value={f.release_date} onChange={set('release_date')} /></label>
        <label>Description<textarea rows={3} value={f.description} onChange={set('description')} /></label>
        <label>Credits<textarea rows={3} value={f.credits} onChange={set('credits')} /></label>
        {song.status === 'rejected' && (
          <label className="check"><input type="checkbox" checked={resubmit} onChange={(e) => setResubmit(e.target.checked)} /><span>Send this song for review again. Reason it was returned: {song.rejection_reason}</span></label>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  )
}
