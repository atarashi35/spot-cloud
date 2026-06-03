import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";

const steps = [
  {
    title: "SPOTを作成",
    body: "場所や団体の紹介、カテゴリ、カバー画像を登録して公開ページの土台を作ります。"
  },
  {
    title: "受取設定を完了",
    body: "Stripe Connectで受取口座を設定すると、ソシオ募集の準備が整います。"
  },
  {
    title: "ソシオ募集を開始",
    body: "月額100円・300円・500円のプランでサポーターを集め、お知らせや限定イベントを届けます。"
  }
];

const audiences = [
  "地域団体・自治会",
  "カフェ・個人店",
  "文化施設・アートスペース",
  "スポーツ団体・コミュニティ"
];

export default function OwnerPage() {
  return (
    <PageShell className="space-y-8">
      <Card className="overflow-hidden px-6 py-8 sm:px-8">
        <span className="chip">FOR OWNERS</span>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">場所や団体の運営ページをつくる</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-ink/68 sm:text-base">
              SPOTは、場所や団体が月額100円・300円・500円のソシオを募り、
              お知らせや限定イベントを届けられる運営基盤です。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/owner/spots/new" className="cta-primary">
                SPOTを登録する
              </Link>
              <Link href="/manage" className="cta-secondary">
                運営中のSPOTを見る
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-ink/10 bg-mist/85 p-5">
            <div className="text-xs font-semibold tracking-[0.18em] text-ink/45">こんな方に</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {audiences.map((item) => (
                <span key={item} className="rounded-full border border-ink/10 bg-white/75 px-3 py-1.5 text-sm text-ink/68">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-[20px] bg-white/80 px-4 py-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-ink/45">できること</div>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-ink/68">
                <li>公開ページの作成と更新</li>
                <li>ソシオ向けのお知らせ投稿</li>
                <li>限定イベントの作成</li>
                <li>月額サポーター募集と受取管理</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.title} className="px-6 py-6 sm:px-7">
            <div className="text-xs font-semibold tracking-[0.18em] text-ink/42">STEP {index + 1}</div>
            <h2 className="mt-3 text-xl font-bold text-ink">{step.title}</h2>
            <p className="mt-3 text-sm leading-7 text-ink/68">{step.body}</p>
          </Card>
        ))}
      </section>

      <Card className="px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] text-ink/42">START</div>
            <h2 className="mt-2 text-2xl font-bold text-ink">まずは公開ページをひとつ作成</h2>
            <p className="mt-3 text-sm leading-7 text-ink/68">
              登録後に受取設定を済ませると、ソシオ募集を本番公開できます。
            </p>
          </div>
          <Link href="/owner/spots/new" className="cta-primary">
            無料で始める
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
