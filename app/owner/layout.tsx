import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOTを作る｜サポーター制度を、無料で。",
  description: "あなたの場所のサポーター制度を無料で作れます。初期費用0円、月額0円。1口100円からのサポーターが、場所を続ける力になります。",
  openGraph: {
    title: "SPOTを作る｜サポーター制度を、無料で。",
    description: "あなたの場所のサポーター制度を無料で作れます。初期費用0円、月額0円。1口100円からのサポーターが、場所を続ける力になります。",
  },
  twitter: {
    title: "SPOTを作る｜サポーター制度を、無料で。",
    description: "あなたの場所のサポーター制度を無料で作れます。初期費用0円、月額0円。1口100円からのサポーターが、場所を続ける力になります。",
  },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
