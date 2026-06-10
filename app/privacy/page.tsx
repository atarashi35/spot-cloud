import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function PrivacyPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        eyebrow="LEGAL"
        title="プライバシーポリシー"
        subtitle="最終更新日: 2026年6月1日"
      />

      <PageShell>
      <Card className="px-6 py-8 sm:px-8">
        <div className="space-y-8 text-[15px] leading-relaxed text-ink/75">

          <section>
            <h2 className="text-xl font-bold text-ink">1. 事業者</h2>
            <p className="mt-3">
              新 諒平（以下「運営者」）は、SPOT（以下「本サービス」）の運営において、
              ユーザーの個人情報を以下の方針に従って取り扱います。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">2. 収集する情報</h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>氏名・メールアドレス（Googleアカウント連携による取得）</li>
              <li>決済情報（クレジットカード情報はStripeが管理し、運営者は保持しません）</li>
              <li>サービス利用履歴（所属SPOT・加入プラン・加入日時）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">3. 利用目的</h2>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>本サービスの提供・運営・改善</li>
              <li>加入・解約・支払いの管理</li>
              <li>お問い合わせへの対応</li>
              <li>不正利用の防止</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">4. 第三者提供</h2>
            <p className="mt-3">
              運営者は、法令に基づく場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">5. 外部サービスの利用</h2>
            <p className="mt-3">本サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーをご確認ください。</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss underline"
                >
                  Google Firebase（認証・データベース・ストレージ）
                </a>
              </li>
              <li>
                <a
                  href="https://stripe.com/jp/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss underline"
                >
                  Stripe（決済処理）
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">6. 情報の管理</h2>
            <p className="mt-3">
              収集した情報はGoogle Firebaseのセキュリティ機能により保護されます。
              運営者は適切な安全管理措置を講じますが、完全なセキュリティを保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">7. 開示・訂正・削除</h2>
            <p className="mt-3">
              ユーザーは自身の個人情報の開示・訂正・削除を求めることができます。
              ご希望の場合は下記のお問い合わせ先までご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink">8. ポリシーの変更</h2>
            <p className="mt-3">
              本ポリシーは必要に応じて変更することがあります。変更後は本ページに掲示します。
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
