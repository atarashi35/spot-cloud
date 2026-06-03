import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] items-center justify-center">
      <div className="panel px-8 py-12 text-center max-w-md w-full">
        <span className="chip">404</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">ページが見つかりません</h1>
        <p className="mt-4 text-sm leading-7 text-ink/65">
          お探しのページは存在しないか、移動または削除された可能性があります。
        </p>
        <Link href="/" className="cta-primary mt-8">
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
