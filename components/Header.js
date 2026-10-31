'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Header() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return (
    <header>
      <Link className="brand" href="/"><img className="mini" src="/logo.jpg" alt="" />LW<b>E</b>L Music</Link>
      <nav>
        {user ? <Link className="btn ghost" href="/dashboard">My dashboard</Link> : (
          <>
            <Link href="/login">Sign in</Link>
            <Link className="btn" href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  )
}
