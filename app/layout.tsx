import './globals.css';
import Providers from './providers';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata = {
  title: 'SwiftFund',
  description: 'Fund Your Next Project with your Community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="bg-neutral-950 text-white font-[verdana] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
