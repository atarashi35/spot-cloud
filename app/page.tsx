import { HomeClient } from "@/components/landing/home-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOT｜サポーターと、つながる。",
  description: "SPOTは、クリエイターや団体が無料・月額のサポーターとつながる場所です。",
  openGraph: {
    title: "SPOT｜サポーターと、つながる。",
    description: "クリエイターや団体が、無料・月額のサポーターとつながる場所。",
  },
  twitter: {
    title: "SPOT｜サポーターと、つながる。",
    description: "クリエイターや団体が、無料・月額のサポーターとつながる場所。",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
