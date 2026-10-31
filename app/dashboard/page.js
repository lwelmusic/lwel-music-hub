'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [uid, setUid] = useState(null)
  const [p, setP] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user
      if (!user) return router.push('/login')
      setUid(user.id)
      const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) setErr('Could not load your profile: ' + error.message)
      else setP(prof)
    })
  }, [router])

  async function save(e) {
    e.preventDefault()
    setMsg(''); setErr('')
    const { error } = await supabase.from('profiles')
      .update({ display_name: p.display_name, profile_type: p.profile_type, bio: p.bio, location: p.location })
      .eq('id', uid)
    if (error) setErr(error.message)
    else setMsg('Profile saved.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (err && !p) return <p className="error">{err}</p>
  if (!p) return <p className="muted">Loading…</p>
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })

  return (
    <div className="formbox">
      <h1>My dashboard</h1>
      <p className="muted">
        Signed in as {p.display_name}{p.role === 'admin' ? ' (LWEL administrator)' : ''}.{' '}
        <Link href={`/artist/${uid}`} className="link">View my public profile</Link>
      </p>
      <form onSubmit={save}>
        <label>Artist or group name<input required value={p.display_name || ''} onChange={set('display_name')} /></label>
        <label>I am a
          <select value={p.profile_type} onChange={set('profile_type')}>
            <option value="solo">Solo artist</option>
            <option value="choir">Choir</option>
            <option value="group">Singing group</option>
          </select>
        </label>
        <label>Location<input value={p.location || ''} onChange={set('location')} placeholder="e.g. Kampala, Uganda" /></label>
        <label>Biography<textarea rows={5} value={p.bio || ''} onChange={set('bio')} /></label>
        <button className="btn">Save profile</button>
      </form>
      {msg && <p className="ok" role="status">{msg}</p>}
      {err && <p className="error" role="alert">{err}</p>}
      <div className="note">Song uploads are coming in the next stage.</div>
      <button className="btn ghost" onClick={signOut}>Sign out</button>
    </div>
  )
}
