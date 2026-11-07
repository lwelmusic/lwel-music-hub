'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PasswordInput from '../../components/PasswordInput'
import Turnstile, { SITE_KEY } from '../../components/Turnstile'

export default function Register() {
  const router = useRouter()
  const [f, setF] = useState({ name: '', type: 'solo', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tok, setTok] = useState(null)
  const [ck, setCk] = useState(0)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (SITE_KEY && !tok) return setErr('Please complete the check below.')
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        data: { display_name: f.name.trim(), profile_type: f.type },
        emailRedirectTo: window.location.origin + '/login',
        captchaToken: tok || undefined
      }
    })
    setBusy(false); setTok(null); setCk(ck + 1)
    if (error) return setErr(error.message)
    if (data.session) return router.push('/dashboard')
    setMsg('Almost done. We sent a confirmation link to ' + f.email + '. Open it, then sign in. If you do not see it within a few minutes, check your spam folder, and make sure the email address is spelled correctly.')
  }

  return (
    <div className="formbox">
      <h1>Create an artist account</h1>
      <p className="muted">For solo artists, choirs and singing groups. Listeners do not need an account.</p>
      <form onSubmit={submit}>
        <label>Artist or group name<input required value={f.name} onChange={set('name')} /></label>
        <label>I am a
          <select value={f.type} onChange={set('type')}>
            <option value="solo">Solo artist</option>
            <option value="choir">Choir</option>
            <option value="group">Singing group</option>
          </select>
        </label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <PasswordInput label="Password (at least 8 characters)" minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} />
        <p className="muted small">By creating an account you agree to the <Link href="/p/terms" className="link">Terms of use</Link>, the <Link href="/p/privacy" className="link">Privacy notice</Link> and the <Link href="/p/contributor-agreement" className="link">Contributor agreement</Link>.</p>
        <Turnstile key={ck} onToken={setTok} />
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      {msg && <p className="ok" role="status">{msg}</p>}
      <p className="muted">Already registered? <Link href="/login" className="link">Sign in</Link></p>
    </div>
  )
}
