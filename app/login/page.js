'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PasswordInput from '../../components/PasswordInput'
import Turnstile, { SITE_KEY } from '../../components/Turnstile'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tok, setTok] = useState(null)
  const [ck, setCk] = useState(0)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (SITE_KEY && !tok) return setErr('Please complete the check below.')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: tok || undefined } })
    setBusy(false); setTok(null); setCk(ck + 1)
    if (error) return setErr(error.message)
    router.push('/dashboard')
  }

  return (
    <div className="formbox">
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Turnstile key={ck} onToken={setTok} />
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      <p className="muted"><Link href="/forgot" className="link">Forgot your password?</Link></p>
      <p className="muted">New here? <Link href="/register" className="link">Create an artist account</Link></p>
    </div>
  )
}
