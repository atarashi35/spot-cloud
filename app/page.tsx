import { HomeClient } from "@/components/landing/home-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOT｜あなたの場所に、サポーターを。",
  description: "街の小さな文化拠点（本屋・ミニシアター・ライブハウス・劇場・ギャラリー・伝統文化・カフェ・バー・文化プロジェクト）のためのサポーター制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
  openGraph: {
    title: "SPOT｜あなたの場所に、サポーターを。",
    description: "街の小さな文化拠点のためのサポーター制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
  },
  twitter: {
    title: "SPOT｜あなたの場所に、サポーターを。",
    description: "街の小さな文化拠点のためのサポーター制度。初期費用・月額費用0円。ファンや常連さんが1口100円から、続ける力になります。",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
