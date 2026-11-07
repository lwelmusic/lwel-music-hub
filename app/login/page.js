'use client'
import { useEffect, useState } from 'react'
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
  const [timedOut, setTimedOut] = useState(false)
  const [need, setNeed] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  useEffect(() => { setTimedOut(new URLSearchParams(window.location.search).get('timeout') === '1') }, [])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (SITE_KEY && !tok) return setErr('Please complete the check below.')
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: tok || undefined } })
    setBusy(false); setTok(null); setCk(ck + 1)
    if (error) {
      if (/not confirmed/i.test(error.message)) { setNeed(true); return setErr('Please confirm your email first. Open the link we sent you, or ask for a new one below.') }
      return setErr(error.message)
    }
    router.push('/dashboard')
  }

  return (
    <div className="formbox">
      <h1>Sign in</h1>
      {timedOut && <p className="note" role="status">You were signed out because you were inactive. Please sign in again.</p>}
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Turnstile key={ck} onToken={setTok} />
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      {need && (
        <div>
          <p className="muted small">Complete the check above, then press the button.</p>
          <button className="btn ghost" type="button" onClick={async () => {
            setResendMsg('')
            if (SITE_KEY && !tok) return setResendMsg('Please complete the check first.')
            const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin + '/login', captchaToken: tok || undefined } })
            setTok(null); setCk(ck + 1)
            setResendMsg(error ? error.message : 'A new confirmation email is on its way. Check your inbox and spam folder.')
          }}>Send the confirmation email again</button>
          {resendMsg && <p className="muted" role="status">{resendMsg}</p>}
        </div>
      )}
      <p className="muted"><Link href="/forgot" className="link">Forgot your password?</Link></p>
      <p className="muted">New here? <Link href="/register" className="link">Create an artist account</Link></p>
    </div>
  )
}
