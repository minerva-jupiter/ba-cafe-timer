import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const NotoSansJPFont400 = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const NotoSansJPFont700 = Noto_Sans_JP({ weight: "700", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Café Timer",
  description: "カフェタイマー",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Café Timer",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`${NotoSansJPFont700.className} ${NotoSansJPFont400.className} h-full`}
      >
        {children}
      </body>
    </html>
  );
}
