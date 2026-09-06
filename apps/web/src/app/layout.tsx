import type { Metadata } from 'next';
import './globals.css';
import { env } from '@/lib/env';
import { Providers } from './providers';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  metadataBase: env.siteUrlObject,
  title: {
    default: 'KasaHouse — rent or buy directly from owners in Ghana',
    template: '%s · KasaHouse',
  },
  description:
    'Browse verified rentals and properties for sale across Ghana. Deal directly with landlords and owners — no agent fees.',
  openGraph: {
    title: 'KasaHouse',
    description:
      'Rent or buy directly from landlords and owners in Ghana. No agent fees.',
    type: 'website',
    locale: 'en_GH',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
