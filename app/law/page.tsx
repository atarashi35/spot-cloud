import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const items: { label: string; value: string }[] = [
  { label: "事業者名", value: "新 諒平" },
  { label: "所在地", value: "埼玉県行田市持田2262-7" },
  { label: "電話番号", value: "080-3724-2935（受付時間 10:00〜18:00、土日祝を除く）" },
  { label: "メールアドレス", value: "spotcloud2026@gmail.com" },
  { label: "サービス名", value: "SPOT" },
  {
    label: "サービス内容",
    value:
      "ソシオ型コミュニティプラットフォーム。SPOT（場所・コミュニティ）に月額サブスクリプションで所属し、限定情報・イベントなどを受け取れるサービス。"
  },
  {
    label: "料金",
    value: "月額 100円・300円・500円（税込）。料金はお申し込み時に選択するプランにより異なります。"
  },
  { label: "支払い方法", value: "クレジットカード（Visa・Mastercard・American Express・JCB）、Apple Pay、Google Pay、PayPay" },
  {
    label: "支払い時期",
    value: "加入手続き完了時に初回課金が発生し、以降は毎月同日に自動更新されます。"
  },
  { label: "役務の提供時期", value: "決済完了後、即時にご利用いただけます。" },
  {
    label: "返品・キャンセルについて",
    value:
      "月途中の解約による日割り返金は行っておりません。解約後は次回更新日まで引き続き利用可能です。"
  },
  {
    label: "解約方法",
    value:
      "マイアカウント画面の「支払い管理」ボタンから Stripe Customer Portal にアクセスし、いつでも解約できます。"
  }
];

export default function LawPage() {
  return (
    <div className="space-y-8 pb-20">
      <PageHeader eyebrow="LEGAL" title="特定商取引法に基づく表記" />

      <PageShell>
        <Card className="px-6 py-8 sm:px-8">
          <dl className="divide-y divide-ink/8">
            {items.map((item) => (
              <div key={item.label} className="grid gap-2 py-5 sm:grid-cols-[200px_1fr]">
                <dt className="text-sm font-semibold text-ink">{item.label}</dt>
                <dd className="text-sm leading-7 text-ink/68">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </PageShell>
    </div>
  );
}
