
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
// import { TopTabs } from '@/components/layout/TopTabs'; // Removed TopTabs import here
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GitBrew - Your Local Beer Recipe Book',
  description: 'Display and browse your BeerXML recipes from a local GitHub repository.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset>
            <Header />
            {/* <TopTabs /> */} {/* TopTabs is now rendered within Header */}
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
