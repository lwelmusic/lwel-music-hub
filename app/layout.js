import './globals.css'
import Header from '../components/Header'
import PlayerProvider from '../components/PlayerProvider'
import IdleLogout from '../components/IdleLogout'
import FooterTools from '../components/FooterTools'

export const metadata = {
  metadataBase: new URL('https://lwel-music-hub.vercel.app'),
  openGraph: { siteName: 'LWEL Music Hub', images: ['/logo.jpg'], type: 'website' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'LWEL Music', statusBarStyle: 'black-translucent' },
  title: 'LWEL Music Hub',
  description: 'A home for SDA music: choirs, singing groups and solo artists. Listen, download and share.'
}

export const viewport = { themeColor: '#050b16' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <IdleLogout />
          <div className="wrap">
            <Header />
            <main>{children}</main>
            <footer>
              <p>LWEL Music Hub · One Faith. One Voice. One Music Family.</p>
              <p className="flinks"><a href="/p/about">About</a><a href="/p/terms">Terms</a><a href="/p/privacy">Privacy</a><a href="/p/copyright">Copyright</a><a href="/p/contributor-agreement">Contributor agreement</a><a href="/p/contact">Contact</a></p>
              <FooterTools />
            </footer>
          </div>
        </PlayerProvider>
      </body>
    </html>
  )
}
