'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Header() {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!user) return setAdmin(false)
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle().then(({ data }) => setAdmin(data?.role === 'admin'))
  }, [user])
  return (
    <header>
      <Link className="brand" href="/"><img className="mini" src="/logo.jpg" alt="" />LW<b>E</b>L Music</Link>
      <nav>
        {user ? (
          admin ? <Link className="btn ghost" href="/admin">Administrator</Link>
                : <Link className="btn ghost" href="/dashboard">My dashboard</Link>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link className="btn" href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}
