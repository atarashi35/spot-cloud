import Link from "next/link";

export default function OwnerPage() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-bold text-ink/60">SPOT REGISTRATION</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">登録する種類を選ぶ</h1>
        <p className="mt-3 text-[15px] leading-7 text-ink/70">SPOT会員は、クリエイターと団体の両方を登録できます。それぞれ別のSPOTとして運営します。</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/owner/spots/new?kind=creator" className="panel px-6 py-7 transition hover:border-moss">
            <p className="text-xl font-extrabold text-ink">クリエイター登録</p>
            <p className="mt-2 text-sm leading-6 text-ink/68">個人名や活動名で公開ページを作ります。</p>
            <p className="mt-5 text-sm font-semibold text-moss">登録へ進む →</p>
          </Link>
          <Link href="/owner/spots/new?kind=organization" className="panel px-6 py-7 transition hover:border-moss">
            <p className="text-xl font-extrabold text-ink">団体登録</p>
            <p className="mt-2 text-sm leading-6 text-ink/68">団体、店舗、文化拠点などの公開ページを作ります。</p>
            <p className="mt-5 text-sm font-semibold text-moss">登録へ進む →</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
