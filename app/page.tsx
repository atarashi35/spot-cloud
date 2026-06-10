import { SpotMapPage } from "@/components/spots/spot-map-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOT｜好きな活動を、まるごと応援。",
  description: "好きな組織・団体・プロジェクトのサポーターになろう。月100〜500円で参加でき、限定コンテンツや投票に参加できます。",
  openGraph: {
    title: "SPOT｜好きな活動を、まるごと応援。",
    description: "好きな組織・団体・プロジェクトのサポーターになろう。月100〜500円で参加でき、限定コンテンツや投票に参加できます。",
  },
  twitter: {
    title: "SPOT｜好きな活動を、まるごと応援。",
    description: "好きな組織・団体・プロジェクトのサポーターになろう。月100〜500円で参加でき、限定コンテンツや投票に参加できます。",
  },
};

export default function HomePage() {
  return <SpotMapPage />;
}
