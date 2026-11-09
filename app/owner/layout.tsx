import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOTを作る｜サポーター制度を、無料で。",
  description: "クリエイターや団体のためのサポーター制度。無料または月額のサポーターとつながれます。",
  openGraph: {
    title: "SPOTを作る｜サポーター制度を、無料で。",
    description: "クリエイターや団体のためのサポーター制度。無料または月額のサポーターとつながれます。",
  },
  twitter: {
    title: "SPOTを作る｜サポーター制度を、無料で。",
    description: "クリエイターや団体のためのサポーター制度。無料または月額のサポーターとつながれます。",
  },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
