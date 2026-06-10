import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/site-footer";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/site-header";

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
  title: { default: "SPOT｜小さなファンクラブ作成サービス", template: "%s | SPOT" },
  description: "組織・団体・プロジェクトのための小さなファンクラブサービス。月100〜500円でサポーターを集めたり、応援したりできます。初期費用・月額費用は0円。",
  metadataBase: new URL("https://spotcloud.app"),
  openGraph: {
    siteName: "SPOT",
    title: "SPOT｜小さなファンクラブ作成サービス",
    description: "組織・団体・プロジェクトのための小さなファンクラブサービス。月100〜500円でサポーターを集めたり、応援したりできます。初期費用・月額費用は0円。",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SPOT｜小さなファンクラブ作成サービス",
    description: "組織・団体・プロジェクトのための小さなファンクラブサービス。月100〜500円でサポーターを集めたり、応援したりできます。初期費用・月額費用は0円。",
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
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
