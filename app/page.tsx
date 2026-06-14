import { TopLanding } from "@/components/landing/top-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOT｜あなたの場所に、応援会員を。",
  description: "街の小さな文化拠点（本屋・ミニシアター・ライブハウス・劇場・ギャラリー・伝統文化・カフェ・バー・文化プロジェクト）のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが月300円から、続ける力になります。",
  openGraph: {
    title: "SPOT｜あなたの場所に、応援会員を。",
    description: "街の小さな文化拠点のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが月300円から、続ける力になります。",
  },
  twitter: {
    title: "SPOT｜あなたの場所に、応援会員を。",
    description: "街の小さな文化拠点のための応援会員制度。初期費用・月額費用0円。ファンや常連さんが月300円から、続ける力になります。",
  },
};

export default function HomePage() {
  return <TopLanding />;
}
