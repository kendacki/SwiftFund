import './globals.css';
import Providers from './providers';

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
    <html lang="en">
      <body className="bg-neutral-950 text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}