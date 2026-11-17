import type { Metadata } from 'next';
import { Newsreader, Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-display' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-text' });
const sourceSans = Source_Sans_3({ subsets: ['latin'], variable: '--font-ui' });

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Famille Wodie', template: '%s · Famille Wodie' },
  description: "L'histoire, les racines et les grands rendez-vous de la famille Wodie.",
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'Famille Wodie' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${newsreader.variable} ${sourceSerif.variable} ${sourceSans.variable}`}>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
