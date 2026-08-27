import NavigationHeader from '@/Components/Navigation/NavigationHeader'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast';
import { Viewport } from 'next';
import FooterMainView from '@/Components/Footer/MainView';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/Components/Functions/gtag';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/next';
import ToolUsageTracker from '@/Components/Functions/ToolUsageTracker';

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'DevOven | Online Tool Collection',
  description: 'A collection of JavaScript tools, for your daily work.',
  openGraph: {
    title: 'DevOven',
    description: 'A collection of JavaScript tools, for your daily work',
    url: 'https://www.devoven.com',
    siteName: 'DevOven',
    images: [
      {
        url: 'https://www.devoven.com/images/og.png',
        width: 800,
        height: 600,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  applicationName: 'DevOven',
  keywords: ['Online', 'Tools', 'JavaScript', 'Security', 'UI'],
  creator: 'marduc812',
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div id='overlays'></div>

          {GA_TRACKING_ID && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
              <Script id="google-analytics">
                {`
                  if (window.location.hostname!=='localhost'){
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', '${GA_TRACKING_ID}');
                  }
                `}
              </Script>
            </>
          )}
          <ToolUsageTracker />
          <NavigationHeader />
          {children}
          <FooterMainView />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
