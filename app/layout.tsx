import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/site-header";

const GA_ID = "G-ZD364VFSW5";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: { default: "SPOT", template: "%s | SPOT" },
  description: "場所と人のゆるやかな所属をつなぐソシオ型コミュニティ基盤",
  metadataBase: new URL("https://spotcloud.app"),
  openGraph: {
    siteName: "SPOT",
    title: "SPOT",
    description: "場所と人のゆるやかな所属をつなぐソシオ型コミュニティ基盤",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SPOT",
    description: "場所と人のゆるやかな所属をつなぐソシオ型コミュニティ基盤",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </head>
      <body>
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
