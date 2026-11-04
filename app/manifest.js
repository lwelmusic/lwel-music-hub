export default function manifest() {
  return {
    name: 'LWEL Music Hub',
    short_name: 'LWEL Music',
    description: 'SDA music: choirs, singing groups and solo artists. Listen, download and share.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050b16',
    theme_color: '#050b16',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
