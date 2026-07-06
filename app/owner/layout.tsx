import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOTを作る｜応援会員制度を、無料で。",
  description: "あなたの場所の応援会員制度を無料で作れます。初期費用0円、月額0円。1口100円からの応援会員が、場所を続ける力になります。",
  openGraph: {
    title: "SPOTを作る｜応援会員制度を、無料で。",
    description: "あなたの場所の応援会員制度を無料で作れます。初期費用0円、月額0円。1口100円からの応援会員が、場所を続ける力になります。",
  },
  twitter: {
    title: "SPOTを作る｜応援会員制度を、無料で。",
    description: "あなたの場所の応援会員制度を無料で作れます。初期費用0円、月額0円。1口100円からの応援会員が、場所を続ける力になります。",
  },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
