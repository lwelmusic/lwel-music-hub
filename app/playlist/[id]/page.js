import { supabase } from '../../../lib/supabase'
import PlaylistClient from './PlaylistClient'

export async function generateMetadata({ params }) {
  try {
    const { data: p } = await supabase.from('playlists').select('title,description,playlist_songs(position,songs(cover_key))')
      .eq('id', params.id).eq('published', true).maybeSingle()
    if (!p) return { title: 'Playlist | LWEL Music Hub' }
    const first = (p.playlist_songs || []).sort((a, b) => a.position - b.position).map((x) => x.songs?.cover_key).find(Boolean)
    const image = first ? supabase.storage.from('covers').getPublicUrl(first).data.publicUrl : '/logo.jpg'
    const title = `${p.title} | LWEL Music Hub`
    const description = p.description || `A playlist of SDA music chosen by LWEL Music Hub.`
    return {
      title, description,
      openGraph: { title, description, images: [image], siteName: 'LWEL Music Hub', type: 'website' },
      twitter: { card: 'summary_large_image', title, description, images: [image] }
    }
  } catch (e) {
    return { title: 'LWEL Music Hub' }
  }
}

export default function Page() {
  return <PlaylistClient />
}
