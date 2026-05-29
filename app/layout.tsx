import type { Metadata } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "SPOT MVP",
  description: "場所と人のゆるやかな所属をつなぐソシオ型コミュニティ基盤"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AppProviders>
          <SiteHeader />
          <main className="pb-20">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
