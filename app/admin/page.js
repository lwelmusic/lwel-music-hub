'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PasswordInput from '../../components/PasswordInput'
import StatsChart from '../../components/StatsChart'
import { DEFAULTS, PAGES } from '../../lib/defaults'

const TABS = ['Overview', 'Review queue', 'Songs', 'Users', 'Reports', 'Categories', 'Site content', 'Activity', 'Backup', 'Account']

async function writeLog(me, songId, decision, reason) {
  await supabase.from('moderation_logs').insert({ song_id: songId, reviewer_id: me.id, decision, reason: reason || null })
}

export default function Admin() {
  const router = useRouter()
  const [me, setMe] = useState(null)
  const [tab, setTab] = useState('Overview')
  const [stale, setStale] = useState(false)
  useEffect(() => {
    try { const l = localStorage.getItem('lwel_last_backup'); setStale(!l || Date.now() - new Date(l).getTime() > 7 * 864e5) } catch (e) {}
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (!u) return router.push('/login')
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (!p || p.role !== 'admin') return router.push('/dashboard')
      setMe(p)
    })
  }, [router])

  if (!me) return <p className="muted">Loading…</p>
  return (
    <div className="dash wide">
      <h1>Administrator</h1>
      <p className="muted">LWEL Music Hub control room. Signed in as {me.display_name}.</p>
      {stale && <div className="note">No backup downloaded in the last 7 days. <button className="mini-btn" onClick={() => setTab('Backup')}>Back up now</button></div>}
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={'tab' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <Overview go={setTab} />}
      {tab === 'Review queue' && <Queue me={me} />}
      {tab === 'Songs' && <Songs me={me} />}
      {tab === 'Users' && <Users me={me} />}
      {tab === 'Reports' && <Reports />}
      {tab === 'Categories' && <Categories />}
      {tab === 'Site content' && <SiteContent me={me} />}
      {tab === 'Activity' && <Activity />}
      {tab === 'Backup' && <Backup onDone={() => setStale(false)} />}
      {tab === 'Account' && <Account />}
    </div>
  )
}

function Overview({ go }) {
  const [s, setS] = useState(null)
  useEffect(() => {
    const run = () => {
    const head = { count: 'exact', head: true }
    const c = (q) => q.then((r) => r.count || 0)
    Promise.all([
      c(supabase.from('songs').select('id', head).eq('status', 'pending')),
      c(supabase.from('songs').select('id', head).eq('status', 'approved')),
      c(supabase.from('profiles').select('id', head).neq('role', 'admin')),
      c(supabase.from('rights_reports').select('id', head).eq('status', 'open')),
      c(supabase.from('songs').select('id', head).gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString())),
      supabase.from('songs').select('views,plays,downloads').eq('status', 'approved').then((r) => r.data || [])
    ]).then(([pending, approved, users, reports, recent, rows]) => {
      const sum = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0)
      setS({ pending, approved, users, reports, recent, views: sum('views'), plays: sum('plays'), downloads: sum('downloads') })
    })
    }
    run()
    const t = setInterval(() => { if (!document.hidden) run() }, 10000)
    return () => clearInterval(t)
  }, [])
  if (!s) return <p className="muted">Loading…</p>
  const Card = ({ n, label, to }) => (
    <button className="statbtn" onClick={() => to && go(to)} disabled={!to}><b>{n}</b><span>{label}</span></button>
  )
  return (
    <>
    <div className="stats four">
      <Card n={s.pending} label="Waiting for review" to="Review queue" />
      <Card n={s.reports} label="Open copyright reports" to="Reports" />
      <Card n={s.recent} label="New songs this week" to="Songs" />
      <Card n={s.approved} label="Published songs" to="Songs" />
      <Card n={s.users} label="Artist accounts" to="Users" />
      <Card n={s.views} label="Views" />
      <Card n={s.plays} label="Plays" />
      <Card n={s.downloads} label="Downloads" />
    </div>
    <h3 className="charttitle">Last 14 days, all songs</h3>
    <StatsChart />
    </>
  )
}

function Queue({ me }) {
  const [rows, setRows] = useState(null)
  const [reason, setReason] = useState({})
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    supabase.from('songs')
      .select('id,title,description,credits,language,created_at,rights_confirmed,owner_id,audio_key,cover_key,profiles(display_name),categories(name)')
      .eq('status', 'pending').order('created_at').then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load])

  async function decide(s, status) {
    setErr('')
    const r = (reason[s.id] || '').trim()
    if (status === 'rejected' && !r) return setErr('Write a reason first, so the artist knows what to fix.')
    const { error } = await supabase.from('songs').update({ status, rejection_reason: status === 'rejected' ? r : null }).eq('id', s.id)
    if (error) return setErr(error.message)
    await writeLog(me, s.id, status, r)
    load()
  }

  if (!rows) return <p className="muted">Loading…</p>
  if (rows.length === 0) return <p className="note">Nothing is waiting for review.</p>
  return (
    <div>
      <p className="muted">Check the audio, details, artwork and rights before approving.</p>
      {err && <p className="error" role="alert">{err}</p>}
      {rows.map((s) => (
        <div className="item" key={s.id}>
          <h3>{s.title}</h3>
          <p className="muted small">
            by <Link className="link" href={`/artist/${s.owner_id}`}>{s.profiles?.display_name}</Link> · {s.categories?.name || 'No category'} · {s.language || 'Language not set'} · sent {new Date(s.created_at).toLocaleDateString()}
          </p>
          {s.audio_key && <AudioPreview path={s.audio_key} />}
          <p>{s.description || 'No description.'}</p>
          {s.credits && <p className="muted small">Credits: {s.credits}</p>}
          <p className="small">{s.rights_confirmed ? 'Rights declaration confirmed by the artist.' : 'No rights declaration!'}</p>
          <textarea rows={2} placeholder="Reason (required only if you reject)" value={reason[s.id] || ''} onChange={(e) => setReason({ ...reason, [s.id]: e.target.value })} />
          <div className="acts">
            <button className="btn" onClick={() => decide(s, 'approved')}>Approve and publish</button>
            <button className="btn ghost" onClick={() => decide(s, 'rejected')}>Return to artist</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Songs({ me }) {
  const [filter, setFilter] = useState('approved')
  const [editing, setEditing] = useState(null)
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    setRows(null)
    supabase.from('songs').select('*,profiles(display_name)')
      .eq('status', filter).order('created_at', { ascending: false }).limit(100).then(({ data }) => setRows(data || []))
  }, [filter])
  useEffect(() => { load() }, [load])

  async function setStatus(s, status) {
    setErr('')
    const { error } = await supabase.from('songs').update({ status }).eq('id', s.id)
    if (error) return setErr(error.message)
    await writeLog(me, s.id, status, null)
    load()
  }
  async function toggleFeatured(s) {
    setErr('')
    const { error } = await supabase.from('songs').update({ featured: !s.featured }).eq('id', s.id)
    if (error) return setErr(error.message)
    await writeLog(me, s.id, s.featured ? 'unfeatured' : 'featured', null)
    load()
  }
  async function remove(s) {
    if (!window.confirm('Permanently delete "' + s.title + '"? This cannot be undone.')) return
    if (s.audio_key) await supabase.storage.from('audio').remove([s.audio_key])
    if (s.cover_key) await supabase.storage.from('covers').remove([s.cover_key])
    const { error } = await supabase.from('songs').delete().eq('id', s.id)
    if (error) setErr(error.message)
    else load()
  }

  return (
    <div>
      <label className="inline">Show
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="approved">Published</option>
          <option value="pending">Waiting for review</option>
          <option value="rejected">Returned</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </label>
      {err && <p className="error" role="alert">{err}</p>}
      {editing && <SongEditor me={me} song={editing} onDone={() => { setEditing(null); load() }} />}
      {!rows ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="note">No songs here.</p> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Song</th><th>Artist</th><th>Views</th><th>Plays</th><th>Downloads</th><th></th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id}>
              <td>{s.featured ? '★ ' : ''}<Link className="link" href={`/song/${s.id}`}>{s.title}</Link></td>
              <td>{s.profiles?.display_name}</td><td>{s.views}</td><td>{s.plays}</td><td>{s.downloads}</td>
              <td className="rowacts">
                <button className="mini-btn" onClick={() => { setEditing(s); window.scrollTo(0, 0) }}>Edit</button>
                {s.status === 'approved' && <button className="mini-btn" onClick={() => toggleFeatured(s)}>{s.featured ? 'Unfeature' : 'Feature'}</button>}
                {s.status === 'approved' && <button className="mini-btn" onClick={() => setStatus(s, 'unpublished')}>Unpublish</button>}
                {s.status === 'unpublished' && <button className="mini-btn" onClick={() => setStatus(s, 'approved')}>Republish</button>}
                <button className="mini-btn danger" onClick={() => remove(s)}>Delete</button>
              </td>
            </tr>))}
          </tbody></table></div>
      )}
    </div>
  )
}

function Users({ me }) {
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    supabase.from('profiles').select('id,display_name,profile_type,role,suspended,created_at,bio,location,avatar_url')
      .order('created_at', { ascending: false }).limit(200).then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load])

  async function change(u, patch, question) {
    if (!window.confirm(question)) return
    setErr('')
    const { error } = await supabase.from('profiles').update(patch).eq('id', u.id)
    if (error) setErr(error.message)
    else load()
  }
  if (!rows) return <p className="muted">Loading…</p>
  const TYPES = { solo: 'Solo artist', choir: 'Choir', group: 'Singing group' }
  return (
    <div>
      <p className="muted">Suspended accounts cannot submit new songs. Administrators cannot submit songs either.</p>
      {err && <p className="error" role="alert">{err}</p>}
      {editing && <ProfileEditor me={me} profile={editing} onDone={() => { setEditing(null); load() }} />}
      <div className="tablewrap"><table>
        <thead><tr><th>Name</th><th>Type</th><th>Joined</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows.map((u) => (
          <tr key={u.id}>
            <td><Link className="link" href={`/artist/${u.id}`}>{u.display_name}</Link></td>
            <td>{u.role === 'admin' ? 'Administrator' : TYPES[u.profile_type]}</td>
            <td>{new Date(u.created_at).toLocaleDateString()}</td>
            <td>{u.suspended ? 'Suspended' : 'Active'}</td>
            <td className="rowacts">
              <button className="mini-btn" onClick={() => { setEditing(u); window.scrollTo(0, 0) }}>Edit</button>
              {u.id !== me.id && u.role !== 'admin' && (
                <button className="mini-btn" onClick={() => change(u, { suspended: !u.suspended }, (u.suspended ? 'Reactivate ' : 'Suspend ') + u.display_name + '?')}>
                  {u.suspended ? 'Reactivate' : 'Suspend'}
                </button>)}
              {u.id !== me.id && (
                <button className="mini-btn" onClick={() => change(u, { role: u.role === 'admin' ? 'contributor' : 'admin' }, u.role === 'admin' ? 'Remove administrator rights from ' + u.display_name + '?' : 'Make ' + u.display_name + ' an administrator? They will be able to publish, delete and manage accounts.')}>
                  {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                </button>)}
            </td>
          </tr>))}
        </tbody></table></div>
    </div>
  )
}

function Reports() {
  const [rows, setRows] = useState(null)
  const load = useCallback(() => {
    supabase.from('rights_reports').select('*, songs(title)').order('created_at', { ascending: false }).limit(100).then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load])
  async function setStatus(r, status) {
    await supabase.from('rights_reports').update({ status }).eq('id', r.id)
    load()
  }
  if (!rows) return <p className="muted">Loading…</p>
  if (rows.length === 0) return <p className="note">No copyright reports.</p>
  return (
    <div>{rows.map((r) => (
      <div className="item" key={r.id}>
        <h3>{r.songs?.title ? <Link className="link" href={`/song/${r.song_id}`}>{r.songs.title}</Link> : (r.song_title ? r.song_title + ' (removed)' : 'Song removed')}</h3>
        <p className="muted small">From {r.reporter_name} ({r.reporter_email}) · {new Date(r.created_at).toLocaleDateString()}</p>
        <p>{r.details}</p>
        <label className="inline">Status
          <select value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
            <option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option>
          </select>
        </label>
        <p className="muted small">To take the song down, use Songs, then Unpublish.</p>
      </div>))}
    </div>
  )
}

function Categories() {
  const [rows, setRows] = useState(null)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const load = useCallback(() => { supabase.from('categories').select('*').order('name').then(({ data }) => setRows(data || [])) }, [])
  useEffect(() => { load() }, [load])
  async function add(e) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.from('categories').insert({ name: name.trim() })
    if (error) return setErr(error.message)
    setName(''); load()
  }
  async function remove(c) {
    if (!window.confirm('Delete category "' + c.name + '"?')) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) setErr('Could not delete (it may be in use): ' + error.message)
    else load()
  }
  if (!rows) return <p className="muted">Loading…</p>
  return (
    <div>
      <form onSubmit={add} className="inlineform">
        <input required placeholder="New category" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">Add</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      <ul className="plain">{rows.map((c) => (
        <li key={c.id}>{c.name} <button className="mini-btn danger" onClick={() => remove(c)}>Delete</button></li>))}
      </ul>
    </div>
  )
}

function Activity() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('moderation_logs').select('id,decision,reason,created_at,songs(title),profiles(display_name)')
      .order('created_at', { ascending: false }).limit(50).then(({ data }) => setRows(data || []))
  }, [])
  if (!rows) return <p className="muted">Loading…</p>
  if (rows.length === 0) return <p className="note">No moderation activity yet.</p>
  return (
    <div className="tablewrap"><table>
      <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Song</th><th>Reason</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.profiles?.display_name}</td><td>{r.decision}</td><td>{r.songs?.title || 'Deleted song'}</td><td>{r.reason || ''}</td></tr>))}
      </tbody></table></div>
  )
}

function Account() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  async function change(e) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Password changed.')
    if (!error) setPw('')
  }
  return (
    <div>
      <form onSubmit={change} className="narrow">
        <PasswordInput label="New password (at least 8 characters)" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn ghost">Change password</button>
      </form>
      {msg && <p className="muted" role="status">{msg}</p>}
      <p><button className="btn ghost" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign out</button></p>
    </div>
  )
}

function SongEditor({ me, song, onDone }) {
  const [f, setF] = useState({ title: song.title || '', language: song.language || '', description: song.description || '', credits: song.credits || '', category_id: song.category_id || '', release_date: song.release_date || '' })
  const [cats, setCats] = useState([])
  const [err, setErr] = useState('')
  useEffect(() => { supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || [])) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save(e) {
    e.preventDefault(); setErr('')
    const { error } = await supabase.from('songs').update({ ...f, category_id: f.category_id || null, release_date: f.release_date || null }).eq('id', song.id)
    if (error) return setErr(error.message)
    await writeLog(me, song.id, 'edited', 'Song details edited by administrator')
    onDone()
  }
  return (
    <form className="item" onSubmit={save}>
      <h3>Edit song</h3>
      <label>Title<input required value={f.title} onChange={set('title')} /></label>
      <label>Category<select value={f.category_id} onChange={set('category_id')}><option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Language<input value={f.language} onChange={set('language')} /></label>
      <label>Release date<input type="date" value={f.release_date} onChange={set('release_date')} /></label>
      <label>Description<textarea rows={3} value={f.description} onChange={set('description')} /></label>
      <label>Credits<textarea rows={2} value={f.credits} onChange={set('credits')} /></label>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="acts"><button className="btn">Save changes</button><button type="button" className="btn ghost" onClick={onDone}>Cancel</button></div>
    </form>
  )
}

function ProfileEditor({ me, profile, onDone }) {
  const [f, setF] = useState({ display_name: profile.display_name || '', profile_type: profile.profile_type, location: profile.location || '', bio: profile.bio || '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function save(patch, note) {
    setErr('')
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
    if (error) return setErr(error.message)
    await writeLog(me, null, 'profile_edited', note + ': ' + profile.display_name)
    onDone()
  }
  return (
    <form className="item" onSubmit={(e) => { e.preventDefault(); save(f, 'Profile edited') }}>
      <h3>Edit profile</h3>
      <label>Name<input required value={f.display_name} onChange={set('display_name')} /></label>
      <label>Type<select value={f.profile_type} onChange={set('profile_type')}><option value="solo">Solo artist</option><option value="choir">Choir</option><option value="group">Singing group</option></select></label>
      <label>Location<input value={f.location} onChange={set('location')} /></label>
      <label>Biography<textarea rows={4} value={f.bio} onChange={set('bio')} /></label>
      {err && <p className="error" role="alert">{err}</p>}
      <div className="acts">
        <button className="btn">Save changes</button>
        {profile.avatar_url && <button type="button" className="btn ghost" onClick={() => save({ avatar_url: null }, 'Photo removed')}>Remove photo</button>}
        <button type="button" className="btn ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

function ContentField({ label, initial, rows, onSave, starter }) {
  const [v, setV] = useState(initial)
  return (
    <div className="item">
      <label>{label}{rows ? <textarea rows={rows} value={v} onChange={(e) => setV(e.target.value)} /> : <input value={v} onChange={(e) => setV(e.target.value)} />}</label>
      <div className="acts">
        <button className="btn" onClick={() => onSave(v)}>Save</button>
        {starter !== undefined && <button className="btn ghost" onClick={() => setV(starter)}>Restore starter text</button>}
      </div>
    </div>
  )
}

function SiteContent({ me }) {
  const [vals, setVals] = useState(null)
  const [page, setPage] = useState('about')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('site_content').select('key,value').then(({ data }) => {
      const m = {}; (data || []).forEach((r) => { m[r.key] = r.value }); setVals(m)
    })
  }, [])
  if (!vals) return <p className="muted">Loading…</p>
  const get = (k) => (vals[k] !== undefined ? vals[k] : DEFAULTS[k] || '')
  const pkey = 'page_' + (page === 'contributor-agreement' ? 'contributor' : page)
  const save = (k) => async (v) => {
    setMsg('')
    const { error } = await supabase.from('site_content').upsert({ key: k, value: v, updated_at: new Date().toISOString(), updated_by: me.id })
    if (error) return setMsg('Could not save: ' + error.message)
    setVals({ ...vals, [k]: v })
    await writeLog(me, null, 'site_content', 'Edited ' + k)
    setMsg('Saved. The public site now shows the new text.')
  }
  return (
    <div>
      <PublishMode me={me} />
      <h2>Homepage</h2>
      <ContentField label="Headline" initial={get('home_headline')} onSave={save('home_headline')} />
      <ContentField label="Introduction" initial={get('home_intro')} rows={3} onSave={save('home_intro')} />
      <ContentField label="Announcement banner (leave empty to hide it)" initial={get('announcement')} onSave={save('announcement')} />
      <h2>Pages</h2>
      <label className="inline">Page
        <select value={page} onChange={(e) => setPage(e.target.value)}>{PAGES.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select>
      </label>
      <p className="muted small">Start a heading with ## and leave a blank line between paragraphs.</p>
      <ContentField key={page} label="Page text" initial={get(pkey)} rows={16} starter={DEFAULTS[pkey]} onSave={save(pkey)} />
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  )
}

function AudioPreview({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => { supabase.storage.from('audio').createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl || null)) }, [path])
  return url ? <audio className="audioel" controls preload="none" src={url} /> : <p className="muted small">Loading audio…</p>
}

function PublishMode({ me }) {
  const [mode, setMode] = useState(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { supabase.from('site_content').select('value').eq('key', 'auto_publish').maybeSingle().then(({ data }) => setMode(data?.value === 'on' ? 'on' : 'off')) }, [])
  async function change(v) {
    setMsg('')
    const { error } = await supabase.from('site_content').upsert({ key: 'auto_publish', value: v, updated_at: new Date().toISOString(), updated_by: me.id })
    if (error) return setMsg('Could not save: ' + error.message)
    setMode(v)
    await writeLog(me, null, 'site_content', 'Publishing mode: ' + (v === 'on' ? 'publish immediately' : 'review first'))
    setMsg('Saved. New uploads will ' + (v === 'on' ? 'publish immediately.' : 'wait in the Review queue.'))
  }
  if (!mode) return null
  return (
    <div className="item">
      <h3>Publishing mode</h3>
      <label className="inline">New songs
        <select value={mode} onChange={(e) => change(e.target.value)}>
          <option value="on">Publish immediately</option>
          <option value="off">Wait for administrator review</option>
        </select>
      </label>
      <p className="muted small">You can unpublish or delete any song from the Songs tab at any time, whichever mode is chosen.</p>
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  )
}

const BACKUP_TABLES = ['profiles', 'categories', 'songs', 'site_content', 'moderation_logs', 'rights_reports']

function Backup({ onDone }) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  useEffect(() => { try { setLast(localStorage.getItem('lwel_last_backup')) } catch (e) {} }, [])
  async function run() {
    setBusy(true); setMsg('Preparing your backup…')
    try {
      const out = { app: 'LWEL Music Hub', created_at: new Date().toISOString(), tables: {} }
      for (const t of BACKUP_TABLES) {
        let all = [], from = 0
        for (;;) {
          const { data, error } = await supabase.from(t).select('*').range(from, from + 999)
          if (error) throw new Error(t + ': ' + error.message)
          all = all.concat(data)
          if (data.length < 1000) break
          from += 1000
        }
        out.tables[t] = all
      }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'lwel-backup-' + new Date().toISOString().slice(0, 10) + '.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      const now = new Date().toISOString()
      try { localStorage.setItem('lwel_last_backup', now) } catch (e) {}
      setLast(now); onDone()
      setMsg('Backup downloaded. Store the file somewhere safe, away from this computer too (for example Google Drive or a USB drive).')
    } catch (e) {
      setMsg('Backup failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="item">
      <h3>Download a backup</h3>
      <p>This saves all profiles, songs, categories, site text, activity log and copyright reports into one file. Do it at least once a week, and before making big changes.</p>
      <p className="muted small">Last backup on this computer: {last ? new Date(last).toLocaleString() : 'never'}</p>
      <div className="acts"><button className="btn" onClick={run} disabled={busy}>{busy ? 'Working…' : 'Download backup now'}</button></div>
      {msg && <p className="muted" role="status">{msg}</p>}
      <p className="muted small">This file does not include the audio files themselves, nor account passwords (Supabase keeps those separately). Artists should keep their original recordings.</p>
    </div>
  )
}
