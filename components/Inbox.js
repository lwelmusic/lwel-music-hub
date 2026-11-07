'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Inbox() {
  const [rows, setRows] = useState(null)
  const load = useCallback(() => {
    supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(() => { if (!document.hidden) load() }, 60000)
    return () => clearInterval(t)
  }, [load])

  async function read(m) {
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id)
    load()
  }
  async function del(m) {
    await supabase.from('messages').delete().eq('id', m.id)
    load()
  }
  if (!rows || rows.length === 0) return null
  const unread = rows.filter((m) => !m.read_at).length
  return (
    <section>
      <h2>Messages from LWEL {unread > 0 && <span className="badge">{unread} new</span>}</h2>
      {rows.map((m) => (
        <div className={'item' + (m.read_at ? '' : ' unread')} key={m.id}>
          <h3>{m.subject}</h3>
          <p className="muted small">{new Date(m.created_at).toLocaleString()}</p>
          <p style={{ whiteSpace: 'pre-line' }}>{m.body}</p>
          <div className="acts">
            {!m.read_at && <button className="mini-btn" onClick={() => read(m)}>Mark as read</button>}
            <button className="mini-btn danger" onClick={() => del(m)}>Delete</button>
          </div>
        </div>
      ))}
    </section>
  )
}
