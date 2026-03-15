import './globals.css';
import Providers from './providers';
import AppNav from '@/components/AppNav';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata = {
  title: 'SwiftFund | Community-Powered Creator Yield',
  description:
    'Fund your next project with your community. Automated YouTube revenue sharing via Hedera.',
  openGraph: {
    title: 'SwiftFund | Community-Powered Creator Yield',
    description:
      'Fund your next project with your community. Automated YouTube revenue sharing via Hedera.',
    url: 'https://swiftfund.xyz',
    siteName: 'SwiftFund',
    images: [
      {
        url: 'https://swiftfund.xyz/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SwiftFund Open Graph Image',
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? '';
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <link rel="preconnect" href="https://auth.privy.io" />
        <link rel="dns-prefetch" href="https://auth.privy.io" />
        <link rel="dns-prefetch" href="https://www.freelogovectors.net" />
      </head>
      <body className="bg-neutral-950 text-white antialiased font-sans">
        <Providers appId={appId}>
          <AppNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
