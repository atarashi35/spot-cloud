import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPOTを作る｜小さなファンクラブを、無料で。",
  description: "あなたの組織・団体・プロジェクトのファンクラブを無料で作れます。初期費用0円、月額0円。月100〜500円でサポーターを集めて、活動を継続させましょう。",
  openGraph: {
    title: "SPOTを作る｜小さなファンクラブを、無料で。",
    description: "あなたの組織・団体・プロジェクトのファンクラブを無料で作れます。初期費用0円、月額0円。月100〜500円でサポーターを集めて、活動を継続させましょう。",
  },
  twitter: {
    title: "SPOTを作る｜小さなファンクラブを、無料で。",
    description: "あなたの組織・団体・プロジェクトのファンクラブを無料で作れます。初期費用0円、月額0円。月100〜500円でサポーターを集めて、活動を継続させましょう。",
  },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
