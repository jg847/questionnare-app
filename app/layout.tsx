import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import './globals.css';

const headingFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'ToolMatch AI',
  description: 'Implementation-ready skeleton for ToolMatch AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
