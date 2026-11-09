import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export function TopLanding() {
  return <div className="shell mx-auto max-w-4xl pb-24 pt-8 sm:pt-12">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink"><ArrowLeft className="h-4 w-4" />戻る</Link>
    <div className="mt-8 max-w-2xl">
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">サポーターと、<br />つながる。</h1>
      <p className="mt-5 text-base leading-8 text-ink/70">クリエイターや団体と、応援する人をつなぎます。</p>
      <Link href="/owner" className="cta-primary mt-7">SPOTを作る <ArrowUpRight className="h-4 w-4" /></Link>
    </div>
    <section className="mt-14 border-t border-ink/10 pt-8">
      <h2 className="text-xl font-bold">サポーターとのつながり</h2>
      <div className="mt-5 divide-y divide-ink/10 border-y border-ink/10 text-sm sm:text-base">
        <p className="py-4">無料または月額でサポーターに</p>
        <p className="py-4">投稿や投票、募集でつながる</p>
        <p className="py-4">QRコードからその場で登録</p>
      </div>
    </section>
    <section className="mt-12 border-t border-ink/10 pt-8">
      <h2 className="text-xl font-bold">料金</h2>
      <div className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
        <div className="flex items-start justify-between gap-6 py-4"><span>SPOTの登録・公開</span><strong>無料</strong></div>
        <div className="flex items-start justify-between gap-6 py-4"><span>無料サポーターの登録</span><strong>無料</strong></div>
        <div className="flex items-start justify-between gap-6 py-4"><span>月額サポート</span><strong>1口100円から</strong></div>
      </div>
      <p className="mt-5 text-sm leading-7 text-ink/65">月額サポートの決済時には、Stripe決済手数料（標準3.6%）と、決済手数料控除後の金額に対するSPOT利用料10%がかかります。月額サポートの受付には受取設定が必要です。</p>
    </section>
    <Link href="/owner" className="cta-primary mt-10">SPOTを作る <ArrowUpRight className="h-4 w-4" /></Link>
  </div>;
}
