import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/language-context"
import { PrimaryColorProvider } from "@/lib/primary-color-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moments",
  description: "Jiangye's moments",
  icons: {
    icon: [
      {
        url: "/icon-512.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-512.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          <PrimaryColorProvider>
            {children}
          </PrimaryColorProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
