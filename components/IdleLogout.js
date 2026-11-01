'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const LIMIT = 30 * 60 * 1000 // sign out after 30 minutes without activity
const WARN = 60 * 1000       // warn one minute before
const KEY = 'lwel_last_active'

export default function IdleLogout() {
  const [signedIn, setSignedIn] = useState(false)
  const [warn, setWarn] = useState(false)
  const lastWrite = useRef(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setSignedIn(!!s); if (s) touch(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  function touch(force) {
    const now = Date.now()
    if (force || now - lastWrite.current > 5000) {
      lastWrite.current = now
      try { localStorage.setItem(KEY, String(now)) } catch (e) {}
    }
  }

  useEffect(() => {
    if (!signedIn) return
    touch(true)
    const ev = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll']
    const on = () => touch(false)
    ev.forEach((e) => window.addEventListener(e, on, { passive: true }))
    const timer = setInterval(async () => {
      const a = document.querySelector('audio')
      if (a && !a.paused) touch(true) // listening counts as activity
      let last = Date.now()
      try { last = Number(localStorage.getItem(KEY)) || Date.now() } catch (e) {}
      const idle = Date.now() - last
      if (idle >= LIMIT) {
        await supabase.auth.signOut()
        window.location.href = '/login?timeout=1'
      } else setWarn(idle >= LIMIT - WARN)
    }, 15000)
    return () => { ev.forEach((e) => window.removeEventListener(e, on)); clearInterval(timer) }
  }, [signedIn])

  if (!signedIn || !warn) return null
  return (
    <div className="idlewarn" role="alert">
      You will be signed out in about a minute because you have been inactive.
      <button className="mini-btn" onClick={() => { touch(true); setWarn(false) }}>Stay signed in</button>
    </div>
  )
}
