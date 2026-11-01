import { supabase } from '../../../lib/supabase'
import SongClient from './SongClient'

export async function generateMetadata({ params }) {
  try {
    const { data: s } = await supabase.from('songs').select('title,description,cover_key,profiles(display_name)')
      .eq('id', params.id).eq('status', 'approved').maybeSingle()
    if (!s) return { title: 'Song | LWEL Music Hub' }
    const artist = s.profiles?.display_name || 'LWEL'
    const title = `${s.title} – ${artist}`
    const description = s.description || `Listen to and download ${s.title} by ${artist} on LWEL Music Hub.`
    const image = s.cover_key ? supabase.storage.from('covers').getPublicUrl(s.cover_key).data.publicUrl : '/logo.jpg'
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
  return <SongClient />
}
