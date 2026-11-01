'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { DEFAULTS, PAGES } from '../../../lib/defaults'

export default function Page() {
  const { slug } = useParams()
  const page = PAGES.find((p) => p.slug === slug)
  const key = 'page_' + (slug === 'contributor-agreement' ? 'contributor' : slug)
  const [text, setText] = useState(null)

  useEffect(() => {
    supabase.from('site_content').select('value').eq('key', key).maybeSingle()
      .then(({ data }) => setText(data ? data.value : DEFAULTS[key] || ''))
  }, [key])

  if (!page) return <p className="muted">Page not found. <Link href="/" className="link">Back to music</Link></p>
  return (
    <article className="doc">
      <Link href="/" className="back">‹ Home</Link>
      <h1>{page.title}</h1>
      {text === null ? <p className="muted">Loading…</p> : text.split('\n\n').map((b, i) =>
        b.startsWith('## ') ? <h2 key={i}>{b.slice(3)}</h2> : <p key={i}>{b}</p>)}
    </article>
  )
}
