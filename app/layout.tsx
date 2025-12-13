import './globals.css'
import { PostHogProvider, ThemeProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfc' },
    { media: '(prefers-color-scheme: dark)', color: '#19191b' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Explorable Research — Transform research into interactive experiences',
    template: '%s · Explorable Research',
  },
  description: 'Create interactive, explorable websites from research articles. Transform complex research papers into engaging experiences that anyone can understand.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://explorable.research'),
  keywords: [
    'Research',
    'AI',
    'Interactive',
    'Visualization',
    'Education',
    'Science',
    'Machine Learning',
    'Data Science',
    'Explorables',
    'WebXR',
  ],
  authors: [{ name: 'Michal Takáč', url: 'https://github.com/michaltakac' }],
  creator: 'Michal Takáč',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://explorable.research',
    siteName: 'Explorable Research',
    title: 'Explorable Research — Transform research into interactive experiences',
    description: 'Create interactive, explorable websites from research articles. Transform complex research papers into engaging experiences that anyone can understand.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Explorable Research - Transform research into interactive experiences',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explorable Research — Transform research into interactive experiences',
    description: 'Create interactive, explorable websites from research articles. Transform complex research papers into engaging experiences that anyone can understand.',
    images: ['/twitter-image.png'],
    creator: '@michaltakac',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster />
          <Analytics />
        </body>
      </PostHogProvider>
    </html>
  )
}
