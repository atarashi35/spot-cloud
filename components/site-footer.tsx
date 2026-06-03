import Link from "next/link";
import { LogoHorizontal } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer className="shell py-10">
      <div className="panel px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LogoHorizontal className="h-7 w-auto object-contain opacity-40" />
          <nav className="flex flex-wrap gap-5 text-xs text-ink/55">
            <Link href="/terms" className="transition hover:text-moss">利用規約</Link>
            <Link href="/privacy" className="transition hover:text-moss">プライバシーポリシー</Link>
            <Link href="/law" className="transition hover:text-moss">特定商取引法に基づく表記</Link>
            <a href="mailto:spotcloud2026@gmail.com" className="transition hover:text-moss">お問い合わせ</a>
          </nav>
        </div>
        <p className="mt-4 text-xs text-ink/35">© 2026 SPOT Cloud. All rights reserved.</p>
      </div>
    </footer>
  );
}
