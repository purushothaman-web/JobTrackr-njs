import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Header from '@/components/Header';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL || 'http://localhost:3000'),
  title: {
    default: 'JobTrackr - Career Management & Application Tracking',
    template: '%s | JobTrackr',
  },
  description: 'Streamline your job search with JobTrackr. Manage applications, track interviews, and organize company data in one place.',
  keywords: ['job tracker', 'career management', 'application tracking system', 'interview preparation', 'job search organizer'],
  authors: [{ name: 'JobTrackr Team' }],
  creator: 'JobTrackr',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'JobTrackr - Your Personal Career Assistant',
    description: 'Track every job application, interview, and offer in one secure dashboard.',
    siteName: 'JobTrackr',
    images: [
      {
        url: '/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'JobTrackr Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobTrackr - Career Management',
    description: 'Track every job application, interview, and offer in one secure dashboard.',
    images: ['/web-app-manifest-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/icon0.svg', type: 'image/svg+xml' },
      { url: '/icon1.png', type: 'image/png', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow page-shell">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
