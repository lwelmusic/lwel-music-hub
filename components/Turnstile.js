'use client'
import { useEffect, useRef } from 'react'

export const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function Turnstile({ onToken }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!SITE_KEY) return
    let widget
    const render = () => {
      if (window.turnstile && ref.current && widget === undefined) {
        widget = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          callback: (t) => onToken(t),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null)
        })
      }
    }
    if (window.turnstile) render()
    else {
      let s = document.querySelector('script[data-turnstile]')
      if (!s) {
        s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        s.async = true
        s.dataset.turnstile = '1'
        document.head.appendChild(s)
      }
      s.addEventListener('load', render)
    }
    return () => { if (widget !== undefined && window.turnstile) window.turnstile.remove(widget) }
  }, [])
  return SITE_KEY ? <div ref={ref} className="turnstile" /> : null
}
