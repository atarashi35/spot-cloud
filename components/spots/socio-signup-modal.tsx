"use client";

import { ChevronLeft, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { EMAIL_LINK_STORAGE_KEY, EmailSignInState } from "@/lib/auth/email-link";
import { loadUserProfileCache, saveUserProfileCache } from "@/lib/user-profile-cache";
import {
  PlanAmount,
  SocioAgeRange,
  SocioGender,
  Spot,
  SpotCategory,
  planOptions
} from "@/lib/types";

const ageRangeOptions: SocioAgeRange[] = [
  "10代以下",
  "20代",
  "30代",
  "40代",
  "50代",
  "60代以上"
];

const genderOptions: SocioGender[] = ["女性", "男性", "その他", "回答しない"];

type Step = "login" | "email_sent" | "profile";

const affiliationPlaceholderByCategory: Partial<Record<SpotCategory, string>> = {
  自治会: "例: 3班",
  スポーツ: "例: Aチーム / U-12",
  文化施設: "例: 会員区分A",
  市民団体: "例: 広報チーム",
  商店街: "例: 1区",
  クリエイター: "例: 映像班"
};

export function SocioSignupModal({
  spot,
  open,
  onClose,
  defaultPlan = 100,
  initialStep
}: {
  spot: Spot;
  open: boolean;
  onClose: () => void;
  defaultPlan?: PlanAmount;
  /** emailJoin コールバック後に直接 profile ステップへジャンプする用 */
  initialStep?: Step;
}) {
  const { user, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<Step>(initialStep ?? "login");
  const [planAmount, setPlanAmount] = useState<PlanAmount>(defaultPlan);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (!open) return;

    setPlanAmount(defaultPlan);
    setError(null);

    if (user) {
      // キャッシュがあれば前回入力値を自動入力（2回目以降の加入を楽にする）
      const cached = loadUserProfileCache();
      setName(cached?.name || user.displayName || "");
      setAgeRange(cached?.ageRange ?? "");
      setGender(cached?.gender ?? "");
      setAffiliation("");
      setEmail(user.email ?? "");
      setStep("profile");
    } else {
      setEmail("");
      setName("");
      setAffiliation("");
      setAgeRange("");
      setGender("");
      setStep(initialStep ?? "login");
    }
  }, [open, defaultPlan, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Googleログイン成功後に user が変わったらプロフィール画面へ
  useEffect(() => {
    if (!open || !user) return;

    if (step === "login" || step === "email_sent") {
      setName(user.displayName ?? "");
      setEmail(user.email ?? "");
      setStep("profile");
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  // ─── Googleで続ける ───────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // user が更新されたら useEffect が profile ステップへ移動させる
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google ログインに失敗しました。");
    } finally {
      setGoogleLoading(false);
    }
  }

  // ─── メールリンク送信 ─────────────────────────────────────────────
  async function handleSendEmailLink() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("メールアドレスを入力してください。");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("メールアドレスの形式が正しくありません。");
      return;
    }

    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    const origin = window.location.origin;
    const callbackUrl = `${origin}/auth/email-callback?spotId=${spot.id}&plan=${planAmount}`;

    // localStorage に加入情報を保存（コールバック後に復元するため）
    const state: EmailSignInState = { email: trimmed, spotId: spot.id, planAmount };
    localStorage.setItem(EMAIL_LINK_STORAGE_KEY, JSON.stringify(state));

    try {
      await sendSignInLinkToEmail(auth, trimmed, {
        url: callbackUrl,
        handleCodeInApp: true
      });
      setStep("email_sent");
    } catch (cause) {
      localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      const code = (cause as { code?: string }).code ?? "";
      let msg = "メールの送信に失敗しました。もう一度お試しください。";
      if (code === "auth/invalid-email") msg = "メールアドレスの形式が正しくありません。";
      if (code === "auth/too-many-requests") msg = "送信回数が多すぎます。しばらくしてからお試しください。";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ─── Stripe Checkout へ進む ────────────────────────────────────
  async function startCheckout() {
    if (!user) {
      setError("ログインが必要です。");
      return;
    }

    if (!name.trim()) {
      setError("お名前を入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    // 次回以降のモーダルで自動入力できるようにキャッシュ保存
    saveUserProfileCache({ name: name.trim(), ageRange, gender });

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          spotId: spot.id,
          planAmount,
          name: name.trim(),
          affiliation: affiliation.trim() || undefined,
          ageRange: ageRange || undefined,
          gender: gender || undefined
        })
      });

      const data = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message ?? data.error ?? "Checkout セッションの作成に失敗しました。");
      }

      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加入処理に失敗しました。");
      setLoading(false);
    }
  }

  if (!open) return null;

  const affiliationPlaceholder = affiliationPlaceholderByCategory[spot.category] ?? "例: チームA / 1班";

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink/35 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center px-4 py-6">
      <section className="menu-surface relative z-[141] w-full max-w-4xl overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative p-6 sm:p-8">
            {/* 閉じるボタン */}
            <button type="button" className="icon-button absolute right-6 top-6" onClick={onClose} aria-label="閉じる">
              <X className="h-4 w-4" />
            </button>

            <span className="chip">SOCIO</span>

            {/* ─── Step: login ─────────────────────────────── */}
            {step === "login" ? (
              <>
                <h2 className="mt-5 text-3xl font-bold text-ink">サポーター登録<span className="ml-2 text-base font-normal text-ink/40">（ソシオ）</span></h2>
                <p className="mt-2 text-sm text-ink/58">
                  加入にはアカウントが必要です。ログインまたは新規登録してください。
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    className="cta-secondary w-full"
                    onClick={() => void handleGoogle()}
                    disabled={googleLoading}
                  >
                    {googleLoading ? "接続中..." : "Googleで続ける"}
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-ink/10" />
                  <span className="text-xs text-ink/40">または</span>
                  <div className="h-px flex-1 bg-ink/10" />
                </div>

                <div className="mt-5 space-y-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">メールアドレス</span>
                    <input
                      type="email"
                      className="field h-14"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleSendEmailLink(); }}
                      placeholder="you@email.com"
                      aria-invalid={!!error && !email ? true : undefined}
                    />
                  </label>
                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => void handleSendEmailLink()}
                    disabled={loading}
                  >
                    {loading ? "送信中..." : "メールで続ける"}
                  </button>
                </div>
              </>
            ) : null}

            {/* ─── Step: email_sent ─────────────────────────── */}
            {step === "email_sent" ? (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => { setStep("login"); setError(null); }}
                    aria-label="戻る"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-3xl font-bold text-ink">メールを確認</h2>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4 rounded-[20px] bg-mist p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <Mail className="h-6 w-6 text-ink/70" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{email}</p>
                    <p className="mt-2 text-sm leading-7 text-ink/65">
                      上記のアドレスに認証リンクを送信しました。<br />
                      メール内のリンクをクリックするとログインが完了し、加入手続きに進めます。
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-6 text-ink/45">
                  メールが届かない場合は迷惑メールフォルダをご確認ください。
                  <button
                    type="button"
                    className="ml-1 underline hover:text-ink"
                    onClick={() => { setStep("login"); setError(null); }}
                  >
                    再送信
                  </button>
                </p>
              </>
            ) : null}

            {/* ─── Step: profile ───────────────────────────── */}
            {step === "profile" && user ? (
              <>
                <h2 className="mt-5 text-3xl font-bold text-ink">加入情報</h2>
                <p className="mt-2 text-sm text-ink/55">{user.email}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/62">お名前</span>
                    <input
                      className="field h-14"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="お名前"
                      aria-invalid={!!error && !name ? true : undefined}
                    />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/62">所属（任意）</span>
                    <input
                      className="field h-14"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      placeholder={affiliationPlaceholder}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">年齢（任意）</span>
                    <select
                      className="field h-14"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                    >
                      <option value="">選択しない</option>
                      {ageRangeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">性別（任意）</span>
                    <select
                      className="field h-14"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">選択しない</option>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {planOptions.map((amount) => {
                    const active = amount === planAmount;
                    const benefit = spot.planBenefits?.[amount];
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPlanAmount(amount)}
                        className={`rounded-[20px] border p-5 text-left transition ${
                          active ? "border-ink bg-ink text-white" : "border-ink/10 bg-mist text-ink"
                        }`}
                      >
                        <div className="text-[11px] font-semibold tracking-[0.18em] opacity-65">MONTHLY</div>
                        <div className="mt-2 text-4xl font-bold">¥{amount}</div>
                        {benefit && (
                          <p className={`mt-2.5 text-xs leading-5 ${active ? "text-white/70" : "text-ink/55"}`}>
                            {benefit}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => void startCheckout()}
                    disabled={loading}
                  >
                    {loading ? "移動中..." : "支払いへ進む"}
                  </button>
                </div>
              </>
            ) : null}

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
          </div>

          {/* ─── 右パネル: SPOT情報 ───────────────────────── */}
          <aside className="border-t border-ink/8 bg-mist/75 p-6 md:border-l md:border-t-0 md:p-8">
            <div className="rounded-[28px] border border-ink/8 bg-white/80 p-5 shadow-sm">
              <span className="chip">SPOT</span>
              <h3 className="mt-4 text-2xl font-bold text-ink">{spot.name}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/62">{spot.shortDescription || spot.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4 text-sm text-ink/62">
                <span>月額</span>
                <span className="text-lg font-semibold text-ink">¥{planAmount}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-ink/45">
              「支払いへ進む」をクリックすることで、
              <a href="/terms" className="underline hover:text-moss" target="_blank" rel="noreferrer">利用規約</a>
              および
              <a href="/privacy" className="underline hover:text-moss" target="_blank" rel="noreferrer">プライバシーポリシー</a>
              に同意したものとみなします。
            </p>
          </aside>
        </div>
      </section>
      </div>
    </div>
  );
}
