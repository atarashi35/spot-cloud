"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { loadUserProfileCache } from "@/lib/user-profile-cache";

// ─── FAQ データ ────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "メンバーとは何ですか？",
    a: "メンバー（ソシオ）とは、SPOT（お気に入りの場所・コミュニティ）に月100円から参加できる新しい応援のかたちです。加入すると限定のお知らせ・イベント・アンケートなどに参加できるようになります。金額に関わらず、すべてのメンバーが1票を持ちます。"
  },
  {
    q: "支払い方法を教えてください。",
    a: "クレジットカード・デビットカード・Apple Pay・Google Pay・PayPayによる月額自動引き落としです。決済は Stripe を通じて安全に処理されます。カード情報は SPOT のサーバーには保存されません。"
  },
  {
    q: "解約はどうすればできますか？",
    a: "設定内の「メンバーシップ管理」から「支払い・解約を管理」ボタンを押して手続きできます。解約後は次回更新日まで引き続き利用できます。月途中の日割り返金はありません。"
  },
  {
    q: "メールリンクが届きません。",
    a: "迷惑メールフォルダをご確認ください。それでも届かない場合は、数分待ってから再送信をお試しください。noreply@spot-cloud-27aaf.firebaseapp.com からの受信を許可する設定も有効です。"
  },
  {
    q: "複数のSPOTに同時に加入できますか？",
    a: "はい、いくつでも同時に加入できます。加入済みのSPOTは「応援中のSPOT」にまとめて表示されます。"
  },
  {
    q: "居場所（SPOT）を登録するにはどうすればよいですか？",
    a: "ヘッダーメニューの「SPOTを作る」から登録できます。登録は無料で、受取設定を完了するとメンバー募集を開始できます。"
  }
] as const;

const CATEGORIES = ["加入・解約", "支払い・請求", "ログイン・アカウント", "その他"] as const;
type Category = (typeof CATEGORIES)[number];
type FormStatus = "idle" | "sending" | "done" | "error";

// ─── FAQ アコーディオン ─────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ink/8 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-ink">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <p className="pb-4 text-sm leading-7 text-ink/65">{a}</p>
      ) : null}
    </div>
  );
}

// ─── お問い合わせフォーム ────────────────────────────────────────────────────
export function SupportSection() {
  const { user } = useAuth();

  const cachedName = loadUserProfileCache()?.name ?? "";
  const defaultName = user?.displayName || cachedName || "";

  const [category, setCategory] = useState<Category | "">("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState(defaultName);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user) {
      setErrorMsg("ログインが必要です。");
      return;
    }

    if (!category) {
      setErrorMsg("お問い合わせ種別を選択してください。");
      return;
    }

    if (message.trim().length < 10) {
      setErrorMsg("お問い合わせ内容を10文字以上入力してください。");
      return;
    }

    setFormStatus("sending");
    setErrorMsg(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ category, message: message.trim(), name: name.trim() })
      });

      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? "送信に失敗しました。");
      }

      setFormStatus("done");
      setMessage("");
      setCategory("");
    } catch (cause) {
      setErrorMsg(cause instanceof Error ? cause.message : "送信に失敗しました。もう一度お試しください。");
      setFormStatus("error");
    }
  }

  return (
    <section className="panel px-6 py-8 sm:px-8">
      <span className="chip">SUPPORT</span>
      <h2 className="mt-4 text-2xl font-bold text-ink">サポート</h2>

      {/* FAQ */}
      <div className="mt-6 rounded-[20px] bg-mist px-5">
        <p className="pt-5 text-xs font-semibold tracking-[0.18em] text-ink/50">よくある質問</p>
        <div className="mt-2">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* お問い合わせフォーム */}
      <div className="mt-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-ink/50">お問い合わせ</p>

        {formStatus === "done" ? (
          <div className="mt-4 rounded-[20px] bg-mist px-5 py-6 text-sm leading-7 text-ink/65">
            お問い合わせを受け付けました。内容を確認のうえ、登録メールアドレスへご連絡いたします。
            <button
              type="button"
              className="mt-3 block text-sm font-medium text-ink underline"
              onClick={() => setFormStatus("idle")}
            >
              別の問い合わせをする
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!user ? (
              <p className="rounded-[20px] bg-mist px-4 py-4 text-sm text-ink/62">
                お問い合わせにはログインが必要です。
              </p>
            ) : (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink/62">お名前</span>
                  <input
                    className="field h-12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink/62">種別</span>
                  <select
                    className="field h-12"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    <option value="">選択してください</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink/62">内容</span>
                  <textarea
                    className="field min-h-[120px] resize-y py-3"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="お問い合わせ内容を入力してください"
                  />
                </label>

                {errorMsg ? (
                  <p className="text-sm font-medium text-red-700">{errorMsg}</p>
                ) : null}

                <button
                  type="button"
                  className="cta-primary w-full"
                  onClick={() => void handleSubmit()}
                  disabled={formStatus === "sending"}
                >
                  {formStatus === "sending" ? "送信中..." : "送信する"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
