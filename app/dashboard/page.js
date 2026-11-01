'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import PasswordInput from '../../components/PasswordInput'

async function toSquareJpeg(file, size = 400) {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}

const STATUS = { pending: 'Waiting for review', approved: 'Published', rejected: 'Returned', unpublished: 'Unpublished' }
const TYPES = { solo: 'Solo artist', choir: 'Choir', group: 'Singing group' }
const SONG_COLS = 'id,title,status,views,plays,downloads,rejection_reason,audio_key,cover_key'

export default function Dashboard() {
  const router = useRouter()
  const [uid, setUid] = useState(null)
  const [p, setP] = useState(null)
  const [songs, setSongs] = useState([])
  const [updated, setUpdated] = useState(null)
  const [editing, setEditing] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [picMsg, setPicMsg] = useState('')
  const [pw, setPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) return router.push('/login')
      setUid(user.id)
      const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) setErr('Could not load your profile: ' + error.message)
      else if (prof.role === 'admin') return router.push('/admin')
      else setP(prof)
      const { data: mine } = await supabase.from('songs').select(SONG_COLS).eq('owner_id', user.id).order('created_at', { ascending: false })
      setSongs(mine || [])
    })
  }, [router])

  useEffect(() => {
    if (!uid) return
    const load = () => supabase.from('songs').select(SONG_COLS).eq('owner_id', uid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) { setSongs(data); setUpdated(new Date()) } })
    const t = setInterval(() => { if (!document.hidden) load() }, 10000)
    const vis = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [uid])

  async function save(e) {
    e.preventDefault()
    setMsg(''); setErr('')
    const { error } = await supabase.from('profiles')
      .update({ display_name: p.display_name, profile_type: p.profile_type, bio: p.bio, location: p.location }).eq('id', uid)
    if (error) return setErr(error.message)
    setMsg('Profile saved.')
    setEditing(false)
  }

  async function pickPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPicMsg('')
    if (!file.type.startsWith('image/')) return setPicMsg('Please choose a picture (JPG or PNG).')
    if (file.size > 10 * 1024 * 1024) return setPicMsg('That picture is too large. Choose one under 10 MB.')
    setPicMsg('Uploading…')
    try {
      const blob = await toSquareJpeg(file)
      const path = `${uid}/avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl + '?v=' + Date.now()
      const { error: e2 } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid)
      if (e2) throw e2
      setP({ ...p, avatar_url: url })
      setPicMsg('Photo updated.')
    } catch (x) {
      setPicMsg('Upload failed: ' + (x.message || 'unknown error'))
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return setPwMsg(error.message)
    setPw(''); setPwMsg('Password changed.')
  }

  async function removeSong(s) {
    if (!window.confirm('Permanently remove "' + s.title + '"? Listeners will no longer be able to play or download it.')) return
    if (s.audio_key) await supabase.storage.from('audio').remove([s.audio_key])
    if (s.cover_key) await supabase.storage.from('covers').remove([s.cover_key])
    const { error } = await supabase.from('songs').delete().eq('id', s.id)
    if (error) setErr(error.message)
    else setSongs(songs.filter((x) => x.id !== s.id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (err && !p) return <p className="error">{err}</p>
  if (!p) return <p className="muted">Loading…</p>
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })
  const sum = (k) => songs.reduce((a, s) => a + (s[k] || 0), 0)
  const bio = p.bio ? (p.bio.length > 160 ? p.bio.slice(0, 160) + '…' : p.bio) : ''

  return (
    <div className="dash">
      <div className="profilecard">
        <Avatar profile={p} size={120} />
        <div className="pc-info">
          <h1>{p.display_name}</h1>
          <p className="by">{TYPES[p.profile_type]}{p.location ? ' · ' + p.location : ''}</p>
          {bio && <p className="bio">{bio}</p>}
          <div className="acts">
            <button className="btn ghost" onClick={() => { setEditing(!editing); setMsg('') }}>{editing ? 'Close editor' : 'Edit profile'}</button>
            <Link className="btn ghost" href={`/artist/${uid}`}>View public profile</Link>
            <Link className="btn" href="/upload">Upload a new song</Link>
          </div>
          {msg && <p className="ok" role="status">{msg}</p>}
        </div>
      </div>

      {editing && (
        <div className="item">
          <h3>Edit profile</h3>
          <div className="picrow">
            <Avatar profile={p} size={90} />
            <div>
              <label className="btn ghost filebtn">Change photo<input type="file" accept="image/*" onChange={pickPhoto} hidden /></label>
              <p className="muted small">A square picture works best. It is resized automatically.</p>
              {picMsg && <p className="muted small" role="status">{picMsg}</p>}
            </div>
          </div>
          <form onSubmit={save} className="narrow">
            <label>Artist or group name<input required value={p.display_name || ''} onChange={set('display_name')} /></label>
            <label>I am a
              <select value={p.profile_type} onChange={set('profile_type')}>
                <option value="solo">Solo artist</option><option value="choir">Choir</option><option value="group">Singing group</option>
              </select>
            </label>
            <label>Location<input value={p.location || ''} onChange={set('location')} placeholder="e.g. Kampala, Uganda" /></label>
            <label>Biography<textarea rows={5} value={p.bio || ''} onChange={set('bio')} /></label>
            <div className="acts"><button className="btn">Save profile</button><button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button></div>
          </form>
          {err && <p className="error" role="alert">{err}</p>}
        </div>
      )}

      <h2>My songs</h2>
      <div className="stats">
        <div><b>{songs.length}</b><span>Songs</span></div>
        <div><b>{sum('views')}</b><span>Views</span></div>
        <div><b>{sum('plays')}</b><span>Plays</span></div>
        <div><b>{sum('downloads')}</b><span>Downloads</span></div>
      </div>
      <p className="muted small"><span className="livedot" /> Live, refreshes every 10 seconds{updated ? ' · updated ' + updated.toLocaleTimeString() : ''}</p>
      {songs.length === 0 ? (
        <p className="note">You have no songs yet. Use the Upload button to share your first one.</p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Song</th><th>Status</th><th>Views</th><th>Plays</th><th>Downloads</th><th></th></tr></thead>
            <tbody>
              {songs.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/song/${s.id}`} className="link">{s.title}</Link></td>
                  <td>{STATUS[s.status]}{s.status === 'rejected' && s.rejection_reason ? <div className="muted small">Reason: {s.rejection_reason}</div> : null}</td>
                  <td>{s.views}</td><td>{s.plays}</td><td>{s.downloads}</td>
                  <td className="rowacts"><Link className="mini-btn" href={`/song/${s.id}/edit`}>Edit</Link><button className="mini-btn danger" onClick={() => removeSong(s)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="acct">
        <summary>Account and password</summary>
        <form onSubmit={changePassword} className="narrow">
          <PasswordInput label="New password (at least 8 characters)" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn ghost">Change password</button>
        </form>
        {pwMsg && <p className="muted" role="status">{pwMsg}</p>}
        <p><button className="btn ghost" onClick={signOut}>Sign out</button></p>
      </details>
    </div>
  )
}
