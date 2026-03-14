import './globals.css';

export const metadata = {
  title: 'SwiftFund',
  description: 'Trustless Yield for Digital Creators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-white">{children}</body>
    </html>
  );
}