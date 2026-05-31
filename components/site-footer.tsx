import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="shell py-10">
      <div className="panel px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-semibold tracking-[0.18em] text-ink/50">SPOT</div>
          <nav className="flex flex-wrap gap-5 text-xs text-ink/55">
            <Link href="/terms" className="transition hover:text-moss">利用規約</Link>
            <Link href="/privacy" className="transition hover:text-moss">プライバシーポリシー</Link>
            <Link href="/law" className="transition hover:text-moss">特定商取引法に基づく表記</Link>
            <a href="mailto:spotcloud2026@gmail.com" className="transition hover:text-moss">お問い合わせ</a>
          </nav>
        </div>
        <p className="mt-4 text-xs text-ink/35">© 2026 Ryohei Atarashi. All rights reserved.</p>
      </div>
    </footer>
  );
}
