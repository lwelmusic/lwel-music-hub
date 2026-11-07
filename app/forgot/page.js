'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Turnstile, { SITE_KEY } from '../../components/Turnstile'

export default function Forgot() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tok, setTok] = useState(null)
  const [ck, setCk] = useState(0)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (SITE_KEY && !tok) return setErr('Please complete the check below.')
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset', captchaToken: tok || undefined })
    setBusy(false); setTok(null); setCk(ck + 1)
    if (error) return setErr(error.message)
    setMsg('If that email is registered, a reset link is on its way. It can take a few minutes, so check your spam folder too. Use the same email address you registered with, and wait a minute before asking again.')
  }

  return (
    <div className="formbox">
      <h1>Reset your password</h1>
      <p className="muted">Enter your email and we will send you a link to choose a new password.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <Turnstile key={ck} onToken={setTok} />
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      {msg && <p className="ok" role="status">{msg}</p>}
      <p className="muted"><Link href="/login" className="link">Back to sign in</Link></p>
    </div>
  )
}
