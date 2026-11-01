'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import PasswordInput from '../../components/PasswordInput'

export default function Reset() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setReady(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (pw !== pw2) return setErr('The two passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setErr(error.message)
    router.push('/dashboard')
  }

  return (
    <div className="formbox">
      <h1>Choose a new password</h1>
      {!ready ? (
        <p className="muted">Open this page from the link in your reset email. <Link href="/forgot" className="link">Request a new link</Link></p>
      ) : (
        <form onSubmit={submit}>
          <PasswordInput label="New password (at least 8 characters)" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <PasswordInput label="Repeat new password" minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        </form>
      )}
      {err && <p className="error" role="alert">{err}</p>}
    </div>
  )
}
