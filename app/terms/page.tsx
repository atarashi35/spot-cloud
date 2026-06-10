import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function TermsPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        eyebrow="LEGAL"
        title="利用規約"
        subtitle="最終更新日: 2026年6月1日"
      />

      <PageShell>
      <Card className="px-6 py-8 sm:px-8">
        <div className="space-y-8 text-[15px] leading-relaxed text-ink/75">

          <section>
            <h2 className="text-xl font-bold text-ink">第1条（総則）</h2>
            <p className="mt-3">
              本利用規約（以下「本規約」）は、新 諒平（以下「運営者」）が提供するSPOT（以下「本サービス」）の利用条件を定めるものです。
              本サービスを利用することで、本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第2条（サービスの概要）</h2>
            <p className="mt-3">
              本サービスは、場所・コミュニティ（SPOT）と、そこにゆるく所属したいユーザー（ソシオ）をつなぐソシオ型コミュニティプラットフォームです。
              ユーザーは月額サブスクリプションを通じてSPOTに所属し、限定情報・イベント情報などを受け取ることができます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第3条（利用資格）</h2>
            <p className="mt-3">
              本サービスの利用にはGoogleアカウントによるログインが必要です。
              未成年者が本サービスを利用する場合、保護者の同意を得たものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第4条（料金・支払い）</h2>
            <p className="mt-3">
              SPOTへの所属には月額100円・300円・500円（税込）のいずれかのプランを選択します。
              支払いはStripeを通じたクレジットカード決済となります。
              加入手続き完了時に初回課金が発生し、以降は毎月同日に自動更新されます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第5条（解約・返金）</h2>
            <p className="mt-3">
              解約はマイアカウント画面の「支払い管理」からいつでも行えます。
              月途中の解約による日割り返金は行いません。解約後は次回更新日まで引き続き利用可能です。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第6条（禁止事項）</h2>
            <p className="mt-3">ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>法令または本規約に違反する行為</li>
              <li>他のユーザーまたは第三者への誹謗・中傷・嫌がらせ</li>
              <li>不正アクセスやシステムへの干渉</li>
              <li>本サービスを通じた営利目的の勧誘・広告行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第7条（免責事項）</h2>
            <p className="mt-3">
              運営者は、本サービスの内容・品質・継続性について保証しません。
              本サービスの利用によって生じた損害について、運営者の故意または重大な過失がある場合を除き、責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第8条（サービスの変更・停止）</h2>
            <p className="mt-3">
              運営者は、事前の予告なく本サービスの内容を変更・停止することがあります。
              これによりユーザーに損害が生じた場合も、運営者は責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第9条（規約の変更）</h2>
            <p className="mt-3">
              運営者は必要に応じて本規約を変更することがあります。変更後の規約は本サービス上に掲示した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">第10条（準拠法・裁判管轄）</h2>
            <p className="mt-3">
              本規約の解釈には日本法を適用します。本サービスに関する紛争は、さいたま地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section className="rounded-[20px] bg-mist px-5 py-4">
            <p className="text-xs text-ink/68">お問い合わせ: spotcloud2026@gmail.com</p>
          </section>

        </div>
      </Card>
      </PageShell>
    </div>
  );
}
