import Link from 'next/link'

const COLORS = [['#2f6bff', '#22d3ee'], ['#7ac943', '#22d3ee'], ['#b366ff', '#2f6bff'], ['#22d3ee', '#7ac943']]

export default function SongCard({ song }) {
  const c = COLORS[(song.id.charCodeAt(0) + song.id.charCodeAt(1)) % COLORS.length]
  const artist = song.profiles?.display_name || 'Unknown artist'
  return (
    <article className="card">
      <Link href={`/song/${song.id}`} className="art" style={{ background: `linear-gradient(135deg,${c[0]},${c[1]})` }} aria-label={song.title}>
        {song.title.charAt(0)}
      </Link>
      <div>
        <h3><Link href={`/song/${song.id}`}>{song.title}</Link></h3>
        <small><Link href={`/artist/${song.owner_id}`}>{artist}</Link></small>
      </div>
    </article>
  )
}
