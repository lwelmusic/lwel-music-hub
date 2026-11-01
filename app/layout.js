import './globals.css'
import Header from '../components/Header'

export const metadata = {
  metadataBase: new URL('https://lwel-music-hub.vercel.app'),
  openGraph: { siteName: 'LWEL Music Hub', images: ['/logo.jpg'], type: 'website' },
  title: 'LWEL Music Hub',
  description: 'A home for SDA music: choirs, singing groups and solo artists. Listen, download and share.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <Header />
          <main>{children}</main>
          <footer>
            <p>LWEL Music Hub · One Faith. One Voice. One Music Family.</p>
            <p className="flinks"><a href="/p/about">About</a><a href="/p/terms">Terms</a><a href="/p/privacy">Privacy</a><a href="/p/copyright">Copyright</a><a href="/p/contributor-agreement">Contributor agreement</a><a href="/p/contact">Contact</a></p>
          </footer>
        </div>
      </body>
    </html>
  )
}
