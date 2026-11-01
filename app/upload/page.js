'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

async function toSquareJpeg(file, size = 600) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}

function checkAudio(file) {
  return new Promise((resolve, reject) => {
    const a = new Audio()
    const url = URL.createObjectURL(file)
    const fail = (m) => { clearTimeout(t); URL.revokeObjectURL(url); reject(new Error(m)) }
    const t = setTimeout(() => fail('This file could not be read as audio.'), 10000)
    a.onloadedmetadata = () => {
      clearTimeout(t); URL.revokeObjectURL(url)
      if (isFinite(a.duration) && a.duration >= 10) resolve()
      else reject(new Error('The audio is too short or damaged.'))
    }
    a.onerror = () => fail('This file could not be read as audio.')
    a.src = url
  })
}

export default function Upload() {
  const router = useRouter()
  const [uid, setUid] = useState(null)
  const [blocked, setBlocked] = useState('')
  const [cats, setCats] = useState([])
  const [f, setF] = useState({ title: '', category_id: '', language: '', release_date: '', description: '', credits: '', rights: false })
  const [audio, setAudio] = useState(null)
  const [cover, setCover] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (!u) return router.push('/login')
      const { data: p } = await supabase.from('profiles').select('role,suspended').eq('id', u.id).single()
      if (p?.role === 'admin') return router.push('/admin')
      if (p?.suspended) setBlocked('Your account is suspended, so you cannot upload songs. Please contact LWEL.')
      setUid(u.id)
    })
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || []))
  }, [router])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (!audio) return setErr('Choose an MP3 file.')
    if (!/\.mp3$/i.test(audio.name)) return setErr('Only MP3 files are accepted.')
    if (audio.size > 20 * 1024 * 1024) return setErr('The audio file is larger than 20 MB.')
    if (!f.rights) return setErr('You must confirm the rights declaration.')
    setBusy(true)
    let audioKey = null, coverKey = null
    try {
      await checkAudio(audio)
      const id = crypto.randomUUID()
      audioKey = `${uid}/${id}.mp3`
      const up = await supabase.storage.from('audio').upload(audioKey, audio, { contentType: 'audio/mpeg' })
      if (up.error) throw up.error
      if (cover) {
        const blob = await toSquareJpeg(cover)
        coverKey = `${uid}/${id}.jpg`
        const cu = await supabase.storage.from('covers').upload(coverKey, blob, { contentType: 'image/jpeg' })
        if (cu.error) throw cu.error
      }
      const { error } = await supabase.from('songs').insert({
        id, owner_id: uid, title: f.title.trim(), category_id: f.category_id || null, language: f.language || null,
        release_date: f.release_date || null, description: f.description || null, credits: f.credits || null,
        audio_key: audioKey, cover_key: coverKey, rights_confirmed: true
      })
      if (error) throw error
      setDone(true)
    } catch (x) {
      if (audioKey) await supabase.storage.from('audio').remove([audioKey])
      if (coverKey) await supabase.storage.from('covers').remove([coverKey])
      setErr(x.message || 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) return (
    <div className="formbox">
      <h1>Song sent for review</h1>
      <p className="ok">Thank you. LWEL will review your song before it is published. You can follow its status on your dashboard.</p>
      <p><Link className="btn" href="/dashboard">Go to my dashboard</Link></p>
    </div>
  )
  return (
    <div className="formbox">
      <Link href="/dashboard" className="back">‹ My dashboard</Link>
      <h1>Upload a song</h1>
      <p className="muted">Your song stays private until LWEL approves it.</p>
      {blocked ? <p className="error">{blocked}</p> : (
        <form onSubmit={submit}>
          <label>Song title<input required value={f.title} onChange={set('title')} /></label>
          <label>Audio file (MP3, up to 20 MB)<input type="file" accept=".mp3,audio/mpeg" required onChange={(e) => setAudio(e.target.files?.[0] || null)} /></label>
          <label>Cover picture (optional, square works best)<input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} /></label>
          <label>Category
            <select value={f.category_id} onChange={set('category_id')} required>
              <option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Language<input value={f.language} onChange={set('language')} placeholder="e.g. English, Luganda" /></label>
          <label>Release date<input type="date" value={f.release_date} onChange={set('release_date')} /></label>
          <label>Description<textarea rows={3} value={f.description} onChange={set('description')} /></label>
          <label>Credits (composer, lyricist, arranger, performers)<textarea rows={3} value={f.credits} onChange={set('credits')} /></label>
          <label className="check">
            <input type="checkbox" checked={f.rights} onChange={(e) => setF({ ...f, rights: e.target.checked })} />
            <span>I confirm that I own this song or have permission to upload and share it, including the recording, music, lyrics, arrangement and artwork. I accept the <Link className="link" href="/p/contributor-agreement" target="_blank">Contributor agreement</Link>.</span>
          </label>
          {err && <p className="error" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Uploading… please keep this page open' : 'Send for review'}</button>
        </form>
      )}
    </div>
  )
}
