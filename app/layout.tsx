import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Dancing_Script, Playfair_Display } from 'next/font/google'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const dancingScript = Dancing_Script({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-script',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Thiệp Mời Tốt Nghiệp | Web Thiệp Mời Cá Nhân Hoá',
  description:
    'Hệ thống thiệp mời cá nhân hoá tên khách mời, cập nhật lịch trình linh hoạt và gửi lời chúc trực tiếp tới chủ thiệp.',
  icons: {
    icon: '/hcmut-logo.png',
    shortcut: '/hcmut-logo.png',
    apple: '/hcmut-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${playfairDisplay.variable} ${dancingScript.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
