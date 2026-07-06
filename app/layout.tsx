import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/site-header";
import { AddToHomeScreenBanner } from "@/components/add-to-home-screen-banner";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

const GA_ID = "G-ZD364VFSW5";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale を設定しない → ユーザーが自由にズームできる（アクセシビリティ改善）
};

export const metadata: Metadata = {
  title: { default: "SPOT｜あなたの場所に、応援会員を。", template: "%s | SPOT" },
  description: "街の小さな文化拠点（本屋・ミニシアター・ライブハウス・劇場・ギャラリー・伝統文化・カフェ・バー・文化プロジェクト）のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
  metadataBase: new URL("https://spotcloud.app"),
  openGraph: {
    siteName: "SPOT",
    title: "SPOT｜あなたの場所に、応援会員を。",
    description: "街の小さな文化拠点のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SPOT｜あなたの場所に、応援会員を。",
    description: "街の小さな文化拠点のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${outfit.variable} ${notoSansJP.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Firebase Storage 画像の接続を事前確立（LCP改善） */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
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
            <AddToHomeScreenBanner />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
