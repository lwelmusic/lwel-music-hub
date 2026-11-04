'use client'
import { useEffect, useState } from 'react'
import { usePlayer } from './PlayerProvider'

export default function FooterTools() {
  const { dataSaver, setDataSaver } = usePlayer()
  const [prompt, setPrompt] = useState(null)
  const [ios, setIos] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
    setInstalled(!!standalone)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone)
    const on = (e) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', on)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])

  async function install() {
    prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
  }

  return (
    <div className="ftools">
      <label className="switch">
        <input type="checkbox" checked={dataSaver} onChange={(e) => setDataSaver(e.target.checked)} />
        <span>Data saver (does not load pictures)</span>
      </label>
      {!installed && prompt && <button className="btn ghost" onClick={install}>Install the app</button>}
      {!installed && ios && <span className="muted small">To install on iPhone: tap Share, then Add to Home Screen.</span>}
    </div>
  )
}
