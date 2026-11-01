'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Forgot() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset' })
    setBusy(false)
    if (error) return setErr(error.message)
    setMsg('If that email is registered, a reset link is on its way. Check your inbox and spam folder.')
  }

  return (
    <div className="formbox">
      <h1>Reset your password</h1>
      <p className="muted">Enter your email and we will send you a link to choose a new password.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      {msg && <p className="ok" role="status">{msg}</p>}
      <p className="muted"><Link href="/login" className="link">Back to sign in</Link></p>
    </div>
  )
}
