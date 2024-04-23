import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "/src/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HZTetris",
  description: "Tetris Game",
	icons: {
		icon: "/images/favicon.png",
	},
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
