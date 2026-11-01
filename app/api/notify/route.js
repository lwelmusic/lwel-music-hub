export const dynamic = 'force-dynamic'

export async function POST(req) {
  if (!process.env.NOTIFY_SECRET || req.headers.get('x-notify-secret') !== process.env.NOTIFY_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }
  const b = await req.json()
  const site = process.env.SITE_URL || 'https://lwel-music-hub.vercel.app'
  let subject, text, link
  if (b.type === 'song') {
    subject = 'New song uploaded'
    text = `"${b.title}" by ${b.artist || 'an artist'} (${b.status === 'approved' ? 'published' : 'waiting for review'}).`
    link = site + '/admin'
  } else {
    subject = 'Copyright concern reported'
    text = `About "${b.song_title || 'a song'}", from ${b.reporter}: ${b.details}`
    link = site + '/admin'
  }
  const sent = []
  if (process.env.NTFY_TOPIC) {
    await fetch('https://ntfy.sh/' + encodeURIComponent(process.env.NTFY_TOPIC), {
      method: 'POST',
      headers: { Title: 'LWEL Music Hub: ' + subject, Click: link, Priority: b.type === 'report' ? '4' : '3' },
      body: text
    }).catch(() => {})
    sent.push('ntfy')
  }
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'LWEL Music Hub <onboarding@resend.dev>', to: [process.env.ADMIN_EMAIL], subject: 'LWEL Music Hub: ' + subject, text: text + '\n\n' + link })
    }).catch(() => {})
    sent.push('email')
  }
  return Response.json({ ok: true, sent })
}
