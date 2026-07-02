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
  COURSE_AMOUNTS,
  PlanAmount,
  Spot,
  defaultPlanAmount
} from "@/lib/types";

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

  useEffect(() => {
    if (!open) return;
    setPlanAmount(defaultPlan);
    setError(null);
    if (user) {
      const cached = loadUserProfileCache();
      setEmail(user.email ?? "");
      setStep("profile");
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

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  // PWA(standalone)ではブラウザの戻るが無い/効かないため、モーダルを履歴に1段積む。
  // これでAndroidのジェスチャ戻りがページ離脱ではなくモーダルのクローズになる。
  // iOSは戻る自体が無いので無害（✕での閉じが主導線）。
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ spotSignupModal: true }, "");
    function handlePopState() { onCloseRef.current(); }
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // ✕や背景タップで閉じた場合は、積んだダミー履歴を取り除く。
      // 戻る操作で閉じた場合は既にpopされているのでスキップ。
      if (window.history.state?.spotSignupModal) {
        window.history.back();
      }
    };
  }, [open]);

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

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google ログインに失敗しました。");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSendEmailLink() {
    const trimmed = email.trim();
    if (!trimmed) { setError("メールアドレスを入力してください。"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setError("メールアドレスの形式が正しくありません。"); return; }
    setLoading(true);
    setError(null);
    const auth = getFirebaseAuth();
    const origin = window.location.origin;
    const callbackUrl = `${origin}/auth/email-callback?spotId=${spot.id}&plan=${planAmount}`;
    const state: EmailSignInState = { email: trimmed, spotId: spot.id, planAmount };
    localStorage.setItem(EMAIL_LINK_STORAGE_KEY, JSON.stringify(state));
    try {
      await sendSignInLinkToEmail(auth, trimmed, { url: callbackUrl, handleCodeInApp: true });
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

  async function startCheckout() {
    if (checkoutInFlight.current) return;
    checkoutInFlight.current = true;
    if (!user) { setError("ログインが必要です。"); return; }
    if (!name.trim()) { setError("お名前を入力してください。"); return; }
    setLoading(true);
    setError(null);
    saveUserProfileCache({ name: name.trim() });
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          spotId: spot.id,
          planAmount,
          name: name.trim(),
          address: addressLine.trim() ? `〒${postalCode} ${addressLine.trim()}` : undefined,
        })
      });
      const data = (await response.json()) as { url?: string; message?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.message ?? data.error ?? "Checkout セッションの作成に失敗しました。");
      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加入処理に失敗しました。");
      setLoading(false);
      checkoutInFlight.current = false;
    }
  }

  if (!open) return null;

  const pb = spot.planBenefits;
  const getBenefit = (threshold: 5000 | 10000) => pb?.[threshold];
  const hasBenefits = ([5000, 10000] as const).some((t) => getBenefit(t));

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink/35 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="閉じる" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center px-4 py-6">
        <section className="menu-surface relative z-[141] w-full max-w-3xl overflow-hidden p-0">
          <div className="grid md:grid-cols-[1.1fr_0.9fr]">

            {/* ── 左カラム: フォーム → ステッパー → CTA ── */}
            <div className="relative p-6 sm:p-7">
              <button
                type="button"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-ink/10 hover:text-ink active:scale-95"
                onClick={onClose}
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="chip">応援会員</span>

              {/* Step: login */}
              {step === "login" ? (
                <>
                  <h2 className="mt-4 text-xl font-extrabold text-ink">ログインして応援する</h2>
                  <p className="mt-1 text-sm text-ink/70">加入にはアカウントが必要です。</p>
                  <div className="mt-5">
                    <button type="button" className="cta-secondary w-full" onClick={() => void handleGoogle()} disabled={googleLoading}>
                      {googleLoading ? "接続中..." : "Googleで続ける"}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-ink/10" />
                    <span className="text-xs text-ink/55">または</span>
                    <div className="h-px flex-1 bg-ink/10" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-ink/72">メールアドレス</span>
                      <input type="email" className="field h-11" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void handleSendEmailLink(); }} placeholder="you@email.com" />
                    </label>
                    <button type="button" className="cta-primary w-full" onClick={() => void handleSendEmailLink()} disabled={loading}>
                      {loading ? "送信中..." : "メールで続ける"}
                    </button>
                  </div>
                </>
              ) : null}

              {/* Step: email_sent */}
              {step === "email_sent" ? (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <button type="button" className="icon-button" onClick={() => { setStep("login"); setError(null); }} aria-label="戻る">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-xl font-extrabold text-ink">メールを確認してください</h2>
                  </div>
                  <div className="mt-5 flex flex-col items-center gap-3 rounded-[20px] bg-mist p-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Mail className="h-5 w-5 text-ink/78" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{email}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/72">認証リンクを送りました。メール内のリンクをクリックして加入手続きに進んでください。</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink/60">
                    届かない場合は迷惑メールフォルダをご確認ください。
                    <button type="button" className="ml-1 underline hover:text-ink" onClick={() => { setStep("login"); setError(null); }}>再送信</button>
                  </p>
                </>
              ) : null}

              {/* Step: profile — フォーム → ステッパー → ボタンを一直線に */}
              {step === "profile" && user ? (
                <>
                  <h2 className="mt-4 text-xl font-extrabold text-ink">お申し込み</h2>
                  <p className="mt-0.5 text-sm text-ink/65">{user.email}</p>

                  {/* 名前 + 郵便番号 */}
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-ink/72">お名前</span>
                      <input className="field h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="お名前" aria-invalid={!!error && !name ? true : undefined} />
                    </label>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium text-ink/72">郵便番号</span>
                      <div className="flex gap-1.5">
                        <input className="field h-11 min-w-0" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} inputMode="numeric" maxLength={8} placeholder="1234567" />
                        <button type="button" className="cta-secondary h-11 shrink-0 px-3 text-sm" onClick={() => void handlePostalLookup()} disabled={postalLoading}>
                          {postalLoading ? "…" : "反映"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input className="field h-11 w-full" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="都道府県・市区町村・番地（任意）" />
                    <p className="mt-1 text-[11px] text-ink/50">住所はオーナーのみ閲覧できます。</p>
                  </div>

                  {/* 年会費コース選択 */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {COURSE_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPlanAmount(amount)}
                        className={`relative rounded-[14px] border px-2 py-3 text-center transition ${
                          planAmount === amount
                            ? "border-ink bg-ink text-white"
                            : "border-ink/15 bg-mist text-ink hover:border-ink/40"
                        }`}
                      >
                        {amount === defaultPlanAmount && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-moss px-2 py-0.5 text-[10px] font-bold text-white">
                            おすすめ
                          </span>
                        )}
                        <p className="text-lg font-extrabold tabular-nums">¥{amount.toLocaleString("ja-JP")}</p>
                        <p className="text-[11px] opacity-70">/年</p>
                      </button>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-3 space-y-2">
                    <button type="button" className="cta-primary w-full" onClick={() => void startCheckout()} disabled={loading}>
                      {loading ? "移動中..." : `¥${planAmount.toLocaleString("ja-JP")}/年で応援する`}
                    </button>
                    <p className="text-center text-[11px] leading-5 text-ink/50">
                      「応援する」で<a href="/terms" className="underline hover:text-moss" target="_blank" rel="noreferrer">利用規約</a>・<a href="/privacy" className="underline hover:text-moss" target="_blank" rel="noreferrer">プライバシーポリシー</a>に同意
                    </p>
                  </div>
                </>
              ) : null}

              {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
            </div>

            {/* ── 右カラム: 特典（静的）── */}
            <aside className="flex flex-col border-t border-ink/8 bg-mist/60 p-6 md:border-l md:border-t-0">
              <p className="text-xs font-bold text-ink/55">加入すると</p>
              <div className="mt-3 space-y-3.5">
                {[
                  "番号入りの会員証を受け取れる",
                  "限定の投稿が読める",
                  "このSPOTの継続を支える",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3 text-sm font-medium text-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold text-teal-600">✓</span>
                    {text}
                  </div>
                ))}
                {hasBenefits && (
                  <>
                    <div className="my-1 h-px bg-ink/10" />
                    {([5000, 10000] as const).map((threshold) => {
                      const benefit = getBenefit(threshold);
                      if (!benefit) return null;
                      return (
                        <div key={threshold} className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-600">
                            ¥{threshold.toLocaleString("ja-JP")}コース以上
                          </span>
                          <p className="text-sm leading-5 text-ink">{benefit}</p>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </aside>

          </div>
        </section>
      </div>
    </div>
  );
}
