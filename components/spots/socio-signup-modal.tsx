"use client";

import { ChevronLeft, Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { EMAIL_LINK_STORAGE_KEY, EmailSignInState } from "@/lib/auth/email-link";
import { loadUserProfileCache, saveUserProfileCache } from "@/lib/user-profile-cache";
import { getUserProfileDoc } from "@/lib/firestore/user-profile";
import { resolveDisplayName } from "@/lib/user-profile";
import { PostalCodeField } from "@/components/forms/postal-code-field";
import {
  KO_UNIT_AMOUNT,
  MIN_KO,
  PlanAmount,
  Spot,
  defaultPlanAmount
} from "@/lib/types";
import { amountToKo, koToAmount } from "@/lib/plan";

type Step = "login" | "email_sent" | "profile";


export function SocioSignupModal({
  spot,
  open,
  onClose,
  defaultPlan = defaultPlanAmount,
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
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (!open) return;

    setPlanAmount(defaultPlan);
    setError(null);

    if (user) {
      const cached = loadUserProfileCache();
      setEmail(user.email ?? "");
      setStep("profile");
      // アプリ設定の表示名を優先（キャッシュ→Firestore→Auth名の順）
      if (cached?.name) {
        setName(cached.name);
      } else {
        void getUserProfileDoc(user.uid).then((profile) => {
          setName(resolveDisplayName(profile?.profileDisplayName, user.displayName, user.email));
        });
      }
    } else {
      setEmail("");
      setName("");
      setStep(initialStep ?? "login");
    }
  }, [open, defaultPlan, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Googleログイン成功後に user が変わったらプロフィール画面へ
  useEffect(() => {
    if (!open || !user) return;

    if (step === "login" || step === "email_sent") {
      setEmail(user.email ?? "");
      setStep("profile");
      void getUserProfileDoc(user.uid).then((profile) => {
        setName(resolveDisplayName(profile?.profileDisplayName, user.displayName, user.email));
      });
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
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;

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
    saveUserProfileCache({ name: name.trim() });

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
          address: addressLine.trim() ? `〒${postalCode} ${addressLine.trim()}` : undefined,
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
      checkoutInFlight.current = false;
    }
  }

  if (!open) return null;

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

            <span className="chip">応援会員</span>

            {/* ─── Step: login ─────────────────────────────── */}
            {step === "login" ? (
              <>
                <h2 className="mt-5 text-3xl font-extrabold text-ink">応援会員登録</h2>
                <p className="mt-2 text-sm text-ink/70">
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
                  <span className="text-xs text-ink/60">または</span>
                  <div className="h-px flex-1 bg-ink/10" />
                </div>

                <div className="mt-5 space-y-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/72">メールアドレス</span>
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
                  <h2 className="text-3xl font-extrabold text-ink">メールを確認</h2>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4 rounded-[20px] bg-mist p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <Mail className="h-6 w-6 text-ink/78" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{email}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink/75">
                      上記のアドレスに認証リンクを送信しました。<br />
                      メール内のリンクをクリックするとログインが完了し、加入手続きに進めます。
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-6 text-ink/65">
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
                <h2 className="mt-5 text-3xl font-extrabold text-ink">加入情報</h2>
                <p className="mt-2 text-sm text-ink/68">{user.email}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/72">お名前</span>
                    <input
                      className="field h-14"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="お名前"
                      aria-invalid={!!error && !name ? true : undefined}
                    />
                  </label>
                  <div className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/72">住所（任意）</span>
                    <PostalCodeField
                      onResolved={({ postalCode: pc, prefecture, city, addressLine: al }) => {
                        setPostalCode(pc);
                        setAddressLine(`${prefecture}${city}${al}`);
                      }}
                    />
                    <input
                      className="field"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="都道府県・市区町村・番地"
                    />
                    <p className="text-[13px] text-ink/60">オーナーのみ閲覧できます。</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] border border-ink/10 bg-mist p-6">
                  <p className="text-center text-xs font-semibold tracking-[0.2em] text-ink/55">1口 ¥100 / 月</p>
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <button
                      type="button"
                      aria-label="口数を減らす"
                      onClick={() => setPlanAmount((a) => Math.max(MIN_KO * KO_UNIT_AMOUNT, a - KO_UNIT_AMOUNT))}
                      disabled={amountToKo(planAmount) <= MIN_KO}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-2xl font-bold text-ink transition hover:border-ink disabled:opacity-30"
                    >
                      −
                    </button>
                    <div className="min-w-[100px] text-center">
                      <div className="text-5xl font-extrabold leading-none text-ink">
                        {amountToKo(planAmount)}
                        <span className="ml-1 text-2xl">口</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="口数を増やす"
                      onClick={() => setPlanAmount((a) => a + KO_UNIT_AMOUNT)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-2xl font-bold text-ink transition hover:border-ink"
                    >
                      ＋
                    </button>
                  </div>
                  <p className="mt-5 text-center text-sm text-ink/72">
                    月額 <span className="text-2xl font-extrabold text-ink">¥{koToAmount(amountToKo(planAmount)).toLocaleString("ja-JP")}</span>
                  </p>

                  {(spot.planBenefits?.[5] || spot.planBenefits?.[10]) ? (
                    <div className="mt-5 space-y-2 border-t border-ink/8 pt-4">
                      {spot.planBenefits?.[5] ? (
                        <div className={`flex items-start gap-2 text-xs leading-5 ${amountToKo(planAmount) >= 5 ? "text-ink" : "text-ink/45"}`}>
                          <span className="font-semibold">5口以上</span>
                          <span>{spot.planBenefits[5]}</span>
                        </div>
                      ) : null}
                      {spot.planBenefits?.[10] ? (
                        <div className={`flex items-start gap-2 text-xs leading-5 ${amountToKo(planAmount) >= 10 ? "text-ink" : "text-ink/45"}`}>
                          <span className="font-semibold">10口以上</span>
                          <span>{spot.planBenefits[10]}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
              <h3 className="mt-4 text-2xl font-extrabold text-ink">{spot.name}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/72">{spot.shortDescription || spot.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-4 text-sm text-ink/72">
                <span>月額（{amountToKo(planAmount)}口）</span>
                <span className="text-lg font-semibold text-ink">¥{koToAmount(amountToKo(planAmount)).toLocaleString("ja-JP")}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-ink/65">
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
