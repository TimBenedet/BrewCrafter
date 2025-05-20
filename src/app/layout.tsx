import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'], // Bebas Neue typically only has a regular weight
  variable: '--font-bebas-neue',
});

export const metadata: Metadata = {
  title: 'BrewCrafter - Your Local Beer Recipe Book',
  description: 'Display and browse your BeerXML recipes from a local Vercel Blob store.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bebasNeue.variable} antialiased font-sans`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}