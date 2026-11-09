"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";

export function SiteFooter() {
  const { authReady, user } = useAuth();
  if (!authReady || (user && !user.isAnonymous)) return null;
  return (
    <footer className="shell pb-28 pt-10 sm:pb-10">
      <nav aria-label="利用情報" className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-ink/68">
        <Link href="/terms" className="transition hover:text-moss">利用規約</Link>
        <Link href="/privacy" className="transition hover:text-moss">プライバシーポリシー</Link>
        <Link href="/law" className="transition hover:text-moss">特定商取引法に基づく表記</Link>
        <a href="mailto:spotcloud2026@gmail.com" className="transition hover:text-moss">お問い合わせ</a>
      </nav>
    </footer>
  );
}
