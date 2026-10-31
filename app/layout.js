import './globals.css'
import Header from '../components/Header'

export const metadata = {
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
          <footer>LWEL Music Hub · One Faith. One Voice. One Music Family.</footer>
        </div>
      </body>
    </html>
  )
}
