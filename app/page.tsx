import { HomeClient } from "@/components/landing/home-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOT｜好きな活動と、つながる。",
  description: "クリエイターや団体を見つけて、無料または月額でサポート。SPOTは活動とサポーターをつなぐ場所です。",
  openGraph: {
    title: "SPOT｜好きな活動と、つながる。",
    description: "クリエイターや団体を見つけて、無料または月額でサポート。",
  },
  twitter: {
    title: "SPOT｜好きな活動と、つながる。",
    description: "クリエイターや団体を見つけて、無料または月額でサポート。",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
