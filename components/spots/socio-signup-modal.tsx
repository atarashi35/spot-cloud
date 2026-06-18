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

  const [postalLoading, setPostalLoading] = useState(false);
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

  // ─── 郵便番号ルックアップ ─────────────────────────────────────
  async function handlePostalLookup() {
    const normalized = postalCode.replace(/[^\d]/g, "");
    if (normalized.length !== 7) return;
    setPostalLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalized}`);
      const data = (await res.json()) as { results?: { address1: string; address2: string; address3: string }[] };
      if (data.results?.length) {
        const r = data.results[0];
        setPostalCode(normalized);
        setAddressLine(`${r.address1}${r.address2}${r.address3}`);
      }
    } finally {
      setPostalLoading(false);
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
      <section className="menu-surface relative z-[141] w-full max-w-lg overflow-hidden p-0">
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
                <h2 className="mt-3 text-2xl font-extrabold text-ink">加入情報</h2>
                <p className="mt-1 text-sm text-ink/68">{user.email}</p>

                {/* 名前 + 郵便番号 横並び */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-ink/72">お名前</span>
                    <input
                      className="field h-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="お名前"
                      aria-invalid={!!error && !name ? true : undefined}
                    />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-ink/72">郵便番号（任意）</span>
                    <div className="flex gap-2">
                      <input
                        className="field h-11 min-w-0"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="1234567"
                      />
                      <button
                        type="button"
                        className="cta-secondary h-11 shrink-0 px-3 text-sm"
                        onClick={() => void handlePostalLookup()}
                        disabled={postalLoading}
                      >
                        {postalLoading ? "…" : "反映"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 住所フリー入力 */}
                <div className="mt-2">
                  <input
                    className="field h-11 w-full"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="都道府県・市区町村・番地（任意）"
                  />
                  <p className="mt-1 text-[11px] text-ink/50">住所はオーナーのみ閲覧できます。</p>
                </div>

                {/* コンパクトステッパー */}
                <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-mist px-4 py-3">
                  <button
                    type="button"
                    aria-label="口数を減らす"
                    onClick={() => setPlanAmount((a) => Math.max(MIN_KO * KO_UNIT_AMOUNT, a - KO_UNIT_AMOUNT))}
                    disabled={amountToKo(planAmount) <= MIN_KO}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xl font-bold text-ink transition hover:border-ink disabled:opacity-30"
                  >
                    −
                  </button>
                  <div className="flex flex-1 items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold tabular-nums text-ink">{amountToKo(planAmount)}</span>
                    <span className="text-lg font-semibold text-ink">口</span>
                  </div>
                  <button
                    type="button"
                    aria-label="口数を増やす"
                    onClick={() => setPlanAmount((a) => a + KO_UNIT_AMOUNT)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xl font-bold text-ink transition hover:border-ink"
                  >
                    ＋
                  </button>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-ink">¥{koToAmount(amountToKo(planAmount)).toLocaleString("ja-JP")}</p>
                    <p className="text-[11px] text-ink/50">/月</p>
                  </div>
                </div>

                {/* 特典ヒント（常時表示、口数が足りない場合はグレーアウト） */}
                {(spot.planBenefits?.[5] || spot.planBenefits?.[10]) ? (
                  <div className="mt-2 space-y-1 rounded-[10px] border border-ink/8 px-3 py-2">
                    {spot.planBenefits?.[5] ? (
                      <p className={`text-xs leading-5 transition-colors ${amountToKo(planAmount) >= 5 ? "text-ink" : "text-ink/35"}`}>
                        <span className="font-semibold">5口以上</span>　{spot.planBenefits[5]}
                      </p>
                    ) : null}
                    {spot.planBenefits?.[10] ? (
                      <p className={`text-xs leading-5 transition-colors ${amountToKo(planAmount) >= 10 ? "text-ink" : "text-ink/35"}`}>
                        <span className="font-semibold">10口以上</span>　{spot.planBenefits[10]}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    className="cta-primary w-full"
                    onClick={() => void startCheckout()}
                    disabled={loading}
                  >
                    {loading ? "移動中..." : "支払いへ進む"}
                  </button>
                  <p className="text-center text-[11px] leading-5 text-ink/50">
                    「支払いへ進む」で
                    <a href="/terms" className="underline hover:text-moss" target="_blank" rel="noreferrer">利用規約</a>・
                    <a href="/privacy" className="underline hover:text-moss" target="_blank" rel="noreferrer">プライバシーポリシー</a>
                    に同意したものとみなします。
                  </p>
                </div>
              </>
            ) : null}

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        </div>
      </section>
      </div>
    </div>
  );
}
