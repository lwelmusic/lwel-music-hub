'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

const Ctx = createContext({ track: null, playing: false, play: () => {}, playQueue: () => {}, dataSaver: false, setDataSaver: () => {} })
export const usePlayer = () => useContext(Ctx)

const fmt = (t) => (isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00')

export default function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const trackRef = useRef(null)
  const retries = useRef(0)
  const queueRef = useRef([])
  const idxRef = useRef(0)
  const [track, setTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [qi, setQi] = useState({ i: 0, n: 0 })
  const [dataSaver, setDS] = useState(false)

  useEffect(() => { try { setDS(localStorage.getItem('lwel_datasaver') === '1') } catch (e) {} }, [])
  const setDataSaver = (v) => { setDS(v); try { localStorage.setItem('lwel_datasaver', v ? '1' : '0') } catch (e) {} }

  const close = useCallback(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.removeAttribute('src'); a.load() }
    trackRef.current = null; queueRef.current = []
    setTrack(null); setPlaying(false); setTime(0); setDur(0); setQi({ i: 0, n: 0 })
  }, [])

  const startTrack = useCallback(async (t) => {
    const a = audioRef.current
    const { data } = await supabase.storage.from('audio').createSignedUrl(t.audio_key, 3600)
    if (!data?.signedUrl) return alert('This song cannot be played right now.')
    trackRef.current = t
    retries.current = 0
    setTrack(t); setTime(0); setDur(0)
    setQi({ i: idxRef.current, n: queueRef.current.length })
    a.src = data.signedUrl
    a.play().catch(() => {})
  }, [])

  const togglePause = () => { const a = audioRef.current; if (a.paused) a.play().catch(() => {}); else a.pause() }

  const playQueue = useCallback((tracks, i) => {
    const t = tracks[i]
    if (!t) return
    queueRef.current = tracks; idxRef.current = i
    if (trackRef.current && trackRef.current.id === t.id) { setQi({ i, n: tracks.length }); togglePause(); return }
    startTrack(t)
  }, [startTrack])

  const play = useCallback((t) => playQueue([t], 0), [playQueue])

  const step = useCallback((d) => {
    const n = idxRef.current + d
    if (n < 0 || n >= queueRef.current.length) return
    idxRef.current = n
    startTrack(queueRef.current[n])
  }, [startTrack])

  function onPlay() {
    setPlaying(true)
    const t = trackRef.current
    if (!t || t.status !== 'approved') return
    const k = 'played:' + t.id
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1') } catch (e) {}
    supabase.rpc('track_song', { p_song: t.id, p_kind: 'play' }).then(({ error }) => { if (error) console.error('count failed', error.message) })
  }

  async function onError() {
    const t = trackRef.current, a = audioRef.current
    if (!t || retries.current >= 2) return
    retries.current++
    const pos = a.currentTime
    const { data } = await supabase.storage.from('audio').createSignedUrl(t.audio_key, 3600)
    if (!data?.signedUrl) return
    a.src = data.signedUrl
    a.addEventListener('loadedmetadata', () => { a.currentTime = pos; a.play().catch(() => {}) }, { once: true })
  }

  useEffect(() => {
    document.body.classList.toggle('hasplayer', !!track)
    if (!track || !('mediaSession' in navigator)) return
    const a = audioRef.current
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title, artist: track.artist, album: 'LWEL Music Hub',
      artwork: [{ src: track.cover || location.origin + '/icon-512.png', sizes: '512x512', type: 'image/png' }]
    })
    const set = (n, f) => { try { navigator.mediaSession.setActionHandler(n, f) } catch (e) {} }
    set('play', () => a.play()); set('pause', () => a.pause())
    set('seekto', (d) => { a.currentTime = d.seekTime }); set('stop', close)
    set('nexttrack', () => step(1)); set('previoustrack', () => step(-1))
  }, [track, close, step])

  return (
    <Ctx.Provider value={{ track, playing, play, playQueue, dataSaver, setDataSaver }}>
      {children}
      <audio ref={audioRef} preload="none"
        onPlay={onPlay} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); step(1) }} onError={onError}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
      {track && (
        <div className="pbar" role="region" aria-label="Music player">
          {track.cover && !dataSaver ? <img src={track.cover} alt="" /> : <div className="pth" />}
          <div className="pinfo">
            <Link href={`/song/${track.id}`}><b>{track.title}</b></Link>
            <small className="muted">{track.artist}{qi.n > 1 ? ` · ${qi.i + 1} of ${qi.n}` : ''}</small>
            <input type="range" min={0} max={dur || 0} step="1" value={Math.min(time, dur || 0)} aria-label="Seek"
              onChange={(e) => { audioRef.current.currentTime = Number(e.target.value) }} />
            <small className="muted">{fmt(time)} / {fmt(dur)}</small>
          </div>
          <button className="pskip" onClick={() => step(-1)} disabled={qi.i <= 0} aria-label="Previous song">⏮</button>
          <button className="pbtn" onClick={togglePause} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
          <button className="pskip" onClick={() => step(1)} disabled={qi.i >= qi.n - 1} aria-label="Next song">⏭</button>
          <button className="pclose" onClick={close} aria-label="Close player">✕</button>
        </div>
      )}
    </Ctx.Provider>
  )
}
