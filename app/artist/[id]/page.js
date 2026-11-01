import { supabase } from '../../../lib/supabase'
import ArtistClient from './ArtistClient'

export async function generateMetadata({ params }) {
  try {
    const { data: p } = await supabase.from('profiles').select('display_name,bio,avatar_url').eq('id', params.id).maybeSingle()
    if (!p) return { title: 'Artist | LWEL Music Hub' }
    const title = `${p.display_name} | LWEL Music Hub`
    const description = p.bio ? p.bio.slice(0, 200) : `Listen to music by ${p.display_name} on LWEL Music Hub.`
    const image = p.avatar_url || '/logo.jpg'
    return {
      title, description,
      openGraph: { title, description, images: [image], siteName: 'LWEL Music Hub', type: 'website' },
      twitter: { card: 'summary', title, description, images: [image] }
    }
  } catch (e) {
    return { title: 'LWEL Music Hub' }
  }
}

export default function Page() {
  return <ArtistClient />
}
