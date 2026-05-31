"use client";

import { ChevronLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PlanAmount,
  SocioAgeRange,
  SocioGender,
  Spot,
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

type Step = "email" | "profile";

export function SocioSignupModal({
  spot,
  open,
  onClose,
  defaultPlan = 100
}: {
  spot: Spot;
  open: boolean;
  onClose: () => void;
  defaultPlan?: PlanAmount;
}) {
  const { user, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [planAmount, setPlanAmount] = useState<PlanAmount>(defaultPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setPlanAmount(defaultPlan);
    setError(null);

    if (user?.email) {
      setEmail(user.email);
      setStep("profile");
    } else {
      setStep("email");
    }
  }, [defaultPlan, open, user?.email]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.displayName) {
      setName(user.displayName);
    }

    if (user.email) {
      setEmail(user.email);
      setStep("profile");
    }
  }, [user]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  function continueWithEmail() {
    if (!email.trim()) {
      setError("メールアドレスを入力してください。");
      return;
    }

    setError(null);
    setStep("profile");
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      setStep("profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google 連携を開始できませんでした。");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function startCheckout() {
    if (!name.trim() || !email.trim()) {
      setError("名前とメールアドレスを入力してください。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          spotId: spot.id,
          planAmount,
          guestName: name.trim(),
          guestEmail: email.trim(),
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section className="menu-surface relative z-[141] w-full max-w-4xl overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative p-6 sm:p-8">
            <button type="button" className="icon-button absolute right-6 top-6" onClick={onClose} aria-label="閉じる">
              <X className="h-4 w-4" />
            </button>

            <span className="chip">SOCIO</span>

            {step === "email" ? (
              <>
                <h2 className="mt-5 text-3xl font-bold text-ink">ソシオ登録</h2>
                <p className="mt-2 text-sm text-ink/58">まずはメールアドレスを入力してください。</p>

                <div className="mt-8 space-y-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">メールアドレス</span>
                    <input
                      type="email"
                      className="field h-14"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@email.com"
                    />
                  </label>

                  <button type="button" className="cta-primary w-full" onClick={continueWithEmail}>
                    メールで続ける
                  </button>
                </div>

                <div className="mt-5 border-t border-ink/8 pt-5">
                  <button
                    type="button"
                    className="cta-secondary w-full"
                    onClick={() => void continueWithGoogle()}
                    disabled={googleLoading}
                  >
                    {googleLoading ? "連携中..." : "Googleで続ける"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <button type="button" className="icon-button" onClick={() => setStep("email")} aria-label="戻る">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-ink">ソシオ登録</h2>
                    <p className="mt-1 text-sm text-ink/58">{email}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium text-ink/62">名前</span>
                    <input
                      className="field h-14"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="お名前"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">年齢（任意）</span>
                    <select
                      className="field h-14"
                      value={ageRange}
                      onChange={(event) => setAgeRange(event.target.value)}
                    >
                      <option value="">選択しない</option>
                      {ageRangeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink/62">性別（任意）</span>
                    <select
                      className="field h-14"
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                    >
                      <option value="">選択しない</option>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {planOptions.map((amount) => {
                    const active = amount === planAmount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPlanAmount(amount)}
                        className={`rounded-[24px] border p-5 text-left transition ${
                          active ? "border-ink bg-ink text-white" : "border-ink/10 bg-mist text-ink"
                        }`}
                      >
                        <div className="text-[11px] font-semibold tracking-[0.18em] opacity-65">MONTHLY</div>
                        <div className="mt-2 text-4xl font-bold">¥{amount}</div>
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
            )}

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
          </div>

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
          </aside>
        </div>
      </section>
    </div>
  );
}
