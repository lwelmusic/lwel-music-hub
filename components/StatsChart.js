'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = 14
const METRICS = { views: ['Views', 'var(--cyan)'], plays: ['Plays', 'var(--green)'], downloads: ['Downloads', 'var(--purple)'] }
const kampala = (ms) => new Date(ms + 3 * 3600 * 1000).toISOString().slice(0, 10)

export default function StatsChart({ ownerId }) {
  const [rows, setRows] = useState(null)
  const [all, setAll] = useState(null)
  const [metric, setMetric] = useState('views')

  useEffect(() => {
    const load = () => {
      supabase.from('song_daily_stats').select('day,views,plays,downloads')
        .gte('day', kampala(Date.now() - (DAYS - 1) * 864e5)).then(({ data }) => setRows(data || []))
      let q = supabase.from('songs').select('views,plays,downloads')
      if (ownerId) q = q.eq('owner_id', ownerId)
      q.then(({ data }) => setAll(data || []))
    }
    load()
    const t = setInterval(() => { if (!document.hidden) load() }, 30000)
    return () => clearInterval(t)
  }, [ownerId])

  if (!rows || !all) return null
  const days = Array.from({ length: DAYS }, (_, i) => kampala(Date.now() - (DAYS - 1 - i) * 864e5))
  const vals = days.map((d) => rows.filter((r) => r.day === d).reduce((a, r) => a + (r[metric] || 0), 0))
  const max = Math.max(1, ...vals)
  const total = vals.reduce((a, b) => a + b, 0)
  const allTotal = all.reduce((a, r) => a + (r[metric] || 0), 0)
  const earlier = Math.max(0, allTotal - total)
  const W = 600, H = 190, P = 12, base = H - 24, top = 22
  const bw = (W - P * 2) / DAYS

  return (
    <div className="chartbox">
      <div className="chips" role="group" aria-label="Choose what to show">
        {Object.entries(METRICS).map(([k, [label]]) => (
          <button key={k} className="chip" aria-pressed={metric === k} onClick={() => setMetric(k)}>{label}</button>
        ))}
      </div>
      <p className="muted small">{METRICS[metric][0]} in the last {DAYS} days: <b>{total}</b> · All time: <b>{allTotal}</b> · Counted earlier (no daily breakdown exists): <b>{earlier}</b></p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${METRICS[metric][0]} per day for the last ${DAYS} days, total ${total}`} className="chart">
        <line x1={P} x2={W - P} y1={base} y2={base} style={{ stroke: 'var(--line)' }} />
        {vals.map((v, i) => {
          const h = (v / max) * (base - top)
          const x = P + i * bw + 4
          return (
            <g key={days[i]}>
              <rect x={x} y={base - h} width={bw - 8} height={Math.max(h, v > 0 ? 2 : 0)} rx="3" style={{ fill: METRICS[metric][1] }} />
              {v > 0 && <text x={x + (bw - 8) / 2} y={base - h - 4} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>{v}</text>}
              <text x={x + (bw - 8) / 2} y={H - 8} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>{Number(days[i].slice(8))}</text>
            </g>
          )
        })}
      </svg>
      <p className="muted small">Numbers along the bottom are the day of the month. The daily bars only include counts recorded since the graph feature was installed. Earlier counts are included in the all-time and earlier totals above.</p>
    </div>
  )
}
