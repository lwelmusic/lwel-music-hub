'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Header() {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!user) { setAdmin(false); setUnread(0); return }
    let t
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle().then(({ data }) => {
      const isAdmin = data?.role === 'admin'
      setAdmin(isAdmin)
      if (isAdmin) return
      const count = () => supabase.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).then(({ count: c }) => setUnread(c || 0))
      count()
      t = setInterval(() => { if (!document.hidden) count() }, 60000)
    })
    return () => clearInterval(t)
  }, [user])
  return (
    <header>
      <Link className="brand" href="/"><img className="mini" src="/logo.jpg" alt="" />LW<b>E</b>L Music</Link>
      <nav>
        {user ? (
          admin ? <Link className="btn ghost" href="/admin">Administrator</Link>
                : <Link className="btn ghost" href="/dashboard">My dashboard{unread > 0 ? <span className="badge">{unread}</span> : null}</Link>
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
